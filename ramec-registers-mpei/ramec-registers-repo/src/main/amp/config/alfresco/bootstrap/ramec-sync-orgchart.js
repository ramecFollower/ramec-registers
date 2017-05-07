/* Форматирование даты и времени */
function formatDateTime(dt) {
  if (!dt) { dt = new Date(); }
  var yy = dt.getFullYear() + '-';
  var mm = (dt.getMonth() + 1).toString();
  mm = (mm < 10 ? '0' + mm : mm) + '-';
  var dd = dt.getDate().toString();
  dd = (dd < 10 ? '0' + dd : dd) + ' ';
  var hrs = dt.getHours().toString();
  hrs = (hrs < 10 ? '0' + hrs : hrs) + '-';
  var mnt = dt.getMinutes().toString();
  mnt = (mnt < 10 ? '0' + mnt : mnt) + '-';
  var scd = dt.getSeconds().toString();
  scd = (scd < 10 ? '0' + scd : scd);
  return(yy + mm + dd + hrs + mnt + scd);
}

/* При автозапуске скрипта из правил roothome не определён */
function getRootNode(nod) {
  if (!nod) { nod = companyhome; }
  if (!nod.parent) { return nod; }
  do { nod = nod.parent; } while (nod.parent);
  return nod;
}
if (!roothome) {
  var roothome = getRootNode();
}


/* sync_persons */
function sync_persons(personsJson) {
  var persToBe = eval('(' + personsJson + ')').persons;
  if (!persToBe) { return; }
  for each (var p in persToBe) {
    if (p.userName !== null && p.emailAddress !== null) {
      var pers = people.getPerson(p.userName);
      if (pers) {
        pers.properties.firstName = p.firstName;
        pers.properties.lastName = p.lastName;
        pers.properties.email = p.emailAddress;
        pers.save();
      } else {
        people.createPerson(p.userName, p.firstName, p.lastName, p.emailAddress);
      }
    }
  }
}

/* sync_role_definitions */
var roleDefObj = {};
/* читаем определения ролей */
var roleDefRoot = roothome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:orgchart/alvexoc:roles')[0];
if (roleDefRoot) {
  for each(var rd1 in roleDefRoot.children) {
    roleDefObj[rd1.properties['alvexoc:roleDisplayName']] = rd1;
  }
}
function sync_role_definitions(roleDefinitionsJson) {
  var roleDefToBe = eval('(' + roleDefinitionsJson + ')').roleDefinitions;
  if (!roleDefRoot) { return; }
  /* добавляем определения ролей */
  var roleDefToBeObj = {};
  for each (var rd2 in roleDefToBe) {
    if (rd2.roleName && rd2.roleDisplayName) {
      roleDefToBeObj[rd2.roleDisplayName] = rd2;
      if (!(rd2.roleDisplayName in roleDefObj)) {
        var props = [];
        props['alvexoc:roleName'] = rd2.roleName;
        props['alvexoc:roleDisplayName'] = rd2.roleDisplayName;
        props['alvexoc:roleGroupName'] = rd2.roleGroupName;
        props['alvexoc:roleWeight'] = rd2.roleWeight;
        roleDefObj[rd2.roleDisplayName] = roleDefRoot.createNode(
          'alvexoc:' + rd2.roleName, 'alvexoc:roleDefinition', props, "sys:children");
      }
    }
  }
  /* удаляем лишние определения ролей */
  for (var rd3 in roleDefObj) {
    if (!(rd3 in roleDefToBeObj)) {
      roleDefObj[rd3].remove();
      delete roleDefObj[rd3];
    }
  }
}

/* sync_units */
var rootUnit = roothome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:orgchart/alvexoc:branches/alvexoc:default')[0];
var unitsObj = {};
unitsObj['default'] = rootUnit;

function read_units(unitName) {
  if (!(unitName in unitsObj)) { return; }
  for each (var u0 in unitsObj[unitName].childAssociations) {
    for each (var ucu0 in u0) {
      var un0 = ucu0.properties['alvexoc:unitName'];
      if (un0) {
        unitsObj[un0] = ucu0;
        read_units(un0);
      }
    }
  }
}
read_units('default');


function del_unit(delUnit) {
  /* Удаляем группу, если она есть */
  var uGrName = delUnit.properties['alvexoc:groupName'];
  if (uGrName) {
    var uGr = groups.getGroupForFullAuthorityName(uGrName);
    if (uGr) {
      uGr.deleteGroup();
    }
  }
  /* Удаляем юнит */
  delUnit.remove();
}

var managedGroups = groups.getGroup('ramec-managed-groups');
if (!managedGroups) { managedGroups = groups.createRootGroup('ramec-managed-groups', 'ramec-managed-groups'); }


function sync_unit_name(unitName, unitsToBeObj) {
  if (!(unitName in unitsObj)) { return; }
  /* проверяем существующие вложенные юниты */
  var hasChildren = {};
  for each (var u0 in unitsObj[unitName].childAssociations) {
    for each (var ucu0 in u0) {
      var un0 = ucu0.properties['alvexoc:unitName'];
      if (un0) {
        if (!(un0 in unitsToBeObj)) {
          /* Удаляем лишние юниты */
          del_unit(ucu0);
          delete unitsObj[un0];
          continue;
        }
        if (unitsToBeObj[un0].unitParent != unitName) {
          del_unit(ucu0);
          delete unitsObj[un0];
          continue;
        }
        hasChildren[un0] = ucu0;
        sync_unit_name(un0, unitsToBeObj);
      }
    }
  }
  /* добавляем недостающие вложенные юниты */
  var unitParent = (unitName == 'default') ? null : unitName;
  for each (var u1 in unitsToBeObj) {
    if (!u1.unitName || !u1.unitDisplayName || u1.unitParent != unitParent || u1.unitName in hasChildren) {
      continue;
    }
    var props = [];
    props['alvexoc:unitName'] = u1.unitName;
    props['alvexoc:unitDisplayName'] = u1.unitDisplayName;
    props['alvexoc:groupName'] = 'GROUP_' + u1.unitDisplayName;
    props['alvexoc:unitWeight'] = u1.unitWeight ? u1.unitWeight : '99';
    
    unitsObj[u1.unitName] = unitsObj[unitName].createNode(
      props['alvexoc:unitName'], 'alvexoc:unit', props, 'alvexoc:subunit', 'alvexoc:' + u1.unitDisplayName);
    
    var uGroup = groups.getGroup(props['alvexoc:unitDisplayName']);
    if (!uGroup) {
      uGroup = managedGroups.createGroup(props['alvexoc:unitDisplayName'], props['alvexoc:unitDisplayName']);
    }
    var prnGroupName = unitsObj[unitName].properties['alvexoc:groupName'];
    if (prnGroupName) {
      var prnGroup = groups.getGroupForFullAuthorityName(prnGroupName);
      if (!prnGroup) { 
        var prnUnitDisplayName = unitsObj[unitName].properties['alvexoc:unitDisplayName'];
        prnGroup = managedGroups.createGroup(prnUnitDisplayName, prnUnitDisplayName);
      }
      if (prnGroup && !prnGroup.childGroups.some(function (x) { return x.displayName.equals(u1.unitDisplayName); })) {
        prnGroup.addAuthority(uGroup.fullName);
      }
    }
    
    sync_unit_name(u1.unitName, unitsToBeObj);
  }
}


function sync_units(unitsJson) {
  var unitsToBe = eval('(' + unitsJson + ')').units;
  if (!unitsToBe) { return; }
  var unitsToBeObj = {};
  for (var u1 in unitsToBe) {
    if (unitsToBe[u1].unitName) {
      unitsToBeObj[unitsToBe[u1].unitName] = unitsToBe[u1];
    }
  }
  sync_unit_name('default', unitsToBeObj);
}

/* sync_role_members */
var roleMembersObj = {};
var unitMembersObj = {};

function read_role_members () {
  for each (var unit in unitsObj) {
    var unitName = unit.properties['alvexoc:unitName'];
    if (!unitName) { continue; }
    for each (var rinst in unit.childAssociations['alvexoc:role']) {
      var roleDisplayName = rinst.associations['alvexoc:roleDefinition'];
      if (!roleDisplayName) { continue; }
      roleDisplayName = roleDisplayName[0];
      if (!roleDisplayName) { continue; }
      roleDisplayName = roleDisplayName.properties['alvexoc:roleDisplayName'];
      if (!roleDisplayName) { continue; }
      for each (var mmbr in rinst.associations['alvexoc:roleMember']) {
        var userName = mmbr.properties.userName;
        if (!userName) { continue; }
        var riId = unitName + '---' + roleDisplayName + '---' + userName;
        if (riId in roleMembersObj && roleMembersObj[riId]) {
          /* Попутно удаляем дубликаты инстансов ролей, если встретим */
          rinst.remove();
        } else {
          roleMembersObj[riId] = rinst;
        }
        /* Попутно заполняем список сотрудников подразделений */
        var umId = unitName + '---' + userName;
        if (!(umId in unitMembersObj)) {
          unitMembersObj[umId] = { 'unitName': unitName, 'userName': userName};
        }
      }
    }
  }
}
read_role_members();



function sync_role_members(roleMembersJson) {
  var roleMembersToBe = eval('(' + roleMembersJson + ')').roleMembers;
  if (!roleMembersToBe) { return; }
  var rInstIdToBe = {};
  var uMembersToBe = {};
  for each (var rmem in roleMembersToBe) {
    var rdef = roleDefObj[rmem.roleDisplayName];
    var userPerson = people.getPerson(rmem.userName);
    var unitNode = unitsObj[rmem.unitName];
    
    /* Заполняем новый список сотрудников подразделений */
    var umId = rmem.unitName + '---' + rmem.userName;
    if (unitNode && userPerson && !(umId in uMembersToBe)) {
      var uGroupName = unitNode.properties['alvexoc:unitDisplayName'];
      if (!uGroupName) {
        uGroupName = unitNode.properties['alvexoc:unitName'];
        unitNode.properties['alvexoc:groupName'] = 'GROUP_' + uGroupName;
        unitNode.save();
      }
      var uGroup = groups.getGroup(uGroupName);
      if (uGroup && !uGroup.childUsers.some(function (x) { return x.userName.equals(userPerson.properties.userName); })) {
        uGroup.addAuthority(userPerson.properties.userName);
      }
      var uMembers = unitNode.associations['alvexoc:member'];
      if (!uMembers || !uMembers.some(function (x) { return x.equals(userPerson); })) {
        unitNode.createAssociation(userPerson, 'alvexoc:member');
      }
      uMembersToBe[umId] = { 'unitName': rmem.unitName, 'userName': rmem.userName };
    }
    
    /* Создаём инстанс роли при необходимости */
    var rInstId = rmem.unitName + '---' + rmem.roleDisplayName + '---' + rmem.userName;
    rInstIdToBe[rInstId] = '';
    if (rdef && userPerson && unitNode && !(rInstId in roleMembersObj)) {
      var rinst = unitNode.createNode(
        'alvexoc:' + rdef.properties['alvexoc:roleName'],
        'alvexoc:roleInstance', null, 'alvexoc:role',
        'alvexoc:' + rdef.properties['alvexoc:roleName']);
      rinst.createAssociation(rdef, 'alvexoc:roleDefinition');
      rinst.createAssociation(userPerson, 'alvexoc:roleMember');
      roleMembersObj[rInstId] = rinst;
    }
  }
  /* Удаляем лишние инстансы ролей */
  for (var ri in roleMembersObj) {
    if (!(ri in rInstIdToBe)) {
      roleMembersObj[ri].remove();
      delete roleMembersObj[ri];
    }
  }
  /* Делаем выверку сотрудников подразделений */
  for (var um in unitMembersObj)  {
    if (!(um in uMembersToBe)) {
      var unit = unitsObj[unitMembersObj[um].unitName];
      var userPers = people.getPerson(unitMembersObj[um].userName);
      var uGroup1 = groups.getGroup(unit.properties['alvexoc:unitDisplayName']);
      if (uGroup1 && userPers) {
        uGroup1.removeAuthority(unitMembersObj[um].userName);
      }
      /* Удаляем сотрудника подразделения */
      if (unit && userPers) {
        unit.removeAssociation(userPers, 'alvexoc:member');
      }
    }
  }
}



var unitSVObj = {};
function read_unit_sv () {
  for each (var u1 in unitsObj) {
    for each (var usv1 in u1.associations['alvexoc:supervisor']) {
      var unit1 = u1.properties['alvexoc:unitName'];
      var user1 = usv1.properties.userName;
      if (unit1 && user1) {
        var uobj1 = unitSVObj[unit1];
        if (!uobj1) { uobj1 = {}; }
        uobj1[user1] = usv1;
        unitSVObj[unit1] = uobj1;
      }
    }
  }
}
read_unit_sv();


var svRecurse = true;

function recurse_unit_sv(svUnit) {
  if (!svUnit || !svUnit.properties || !svUnit.properties['alvexoc:unitName']) {
    return;
  }
  for each (var svSubU in svUnit.childAssociations['alvexoc:subunit']) {
    for each (var svPersNode in svUnit.associations['alvexoc:supervisor']) {
      var svPersUName = svPersNode.properties['cm:userName'];
      var svPers = people.getPerson(svPersUName);
      var svCurr = svSubU.associations['alvexoc:supervisor'];
      if ( !svCurr || !svCurr.some(function (x) { return x.properties['cm:userName'].equals(svPersUName); })) 
      {
        /* Добавляем руководителя с верхнего уровня, если его ещё нет на текущем уровне */
        svSubU.createAssociation(svPers, 'alvexoc:supervisor');
      }
    }
    recurse_unit_sv(svSubU);
  }
}

function sync_unit_sv(unitSVJson) {
  var unitSVToBe = eval('(' + unitSVJson + ')').unitSupervisors;
  var u2b = {};
  // Как должно быть
  for each (var usv2 in unitSVToBe) {
    if (!usv2.unitName || !usv2.userName) { continue; }
    var pers1 = people.getPerson(usv2.userName);
    if (!pers1) { continue; }
    usv2.userName = pers1.properties.userName;
    if (!usv2.userName) { continue; }
    var unit2 = u2b[usv2.unitName];
    if (!unit2) { unit2 = {}; }
    unit2[usv2.userName] = '';
    u2b[usv2.unitName] = unit2;
  }
  // Стираем лишние
  for (var unit3 in unitsObj) {
    for (var svasis in unitSVObj[unit3]) {
      if (!u2b[unit3] || !(svasis in u2b[unit3])) {
        unitsObj[unit3].removeAssociation(unitSVObj[unit3][svasis], 'alvexoc:supervisor');
        delete unitSVObj[unit3][svasis];
      }
    }
  }
  // Создаём недостающие
  for (var unit4 in u2b) {
    if (!(unit4 in unitsObj)) { continue; }
    for (var user4 in u2b[unit4]) {
      if (!unitSVObj[unit4] || !(user4 in unitSVObj[unit4])) {
        var pers = people.getPerson(user4);
        if (pers && unitsObj[unit4]) {
          var unit5 = unitSVObj[unit4];
          if (!unit5) { unit5 = {}; }
          unit5[user4] = unitsObj[unit4].createAssociation(pers, 'alvexoc:supervisor');
          unitSVObj[unit4] = unit5;
        }
      }
    }
  }
  // Добавляем рекурсивно, если требуется
  if (svRecurse) {
    recurse_unit_sv(rootUnit);
  }
}




// Удаление оргструктуры (используется для отладки)
function clear_orgchart (clearConf) {
  if (clearConf.clearRoleMembers) {
    for each (var rinst in roleMembersObj) {
      rinst.remove();
    }
    roleMembersObj = {};
    logger.log('DONE clearRoleMembers');
  }
  
  if (clearConf.clearUnits) {
    for each (var unit1 in unitsObj) {
      if (unit1.properties['alvexoc:unitName'] != 'default') {
        try {
          unit1.remove();
        } catch (ex) {
          // These are already deleted, do nothing, swallow exeption
        }
      }
    }
    var tmpU = unitsObj['default'];
    unitsObj = {};
    unitsObj['default'] = tmpU;
    logger.log('DONE clearUnits');
  }
  
  if (clearConf.clearRoleDefs) {
    for each (var rDef in roleDefObj) {
      rDef.remove();
    }
    roleDefObj = {};
    logger.log('DONE clearRoleDefs');
  }
  
  if (clearConf.clearGroups) {
    for each (var gr1 in managedGroups.getChildGroups()) {
      gr1.deleteGroup();
    }
    logger.log('DONE clearGroups');
  }
}



function logToFile(f, t) {
  logger.log('ORGCHART-SYNC: ' + t);
  if (!f || !f.content) {
    return;
  }
  f.content += '\n' + formatDateTime() + (t ? ': ' + t : '');
  f.save();
}

function processDoc() {
  if (typeof document == 'undefined' || !document) { return; }
  
  var docn = document.name;
  var proclist = {
    'persons.json': sync_persons,
    'roleDefinitions.json': sync_role_definitions,
    'units.json': sync_units,
    'roleMembers.json': sync_role_members,
    'unitSupervisors.json': sync_unit_sv
  };
  if (docn in proclist) {
    proclist[docn](document.content);
  }
  if (docn.equals('clear_orgchart')) {
    clear_orgchart({ 'clearRoleMembers': true, 'clearUnits': true, 'clearRoleDefs': true, 'clearGroups': true });
  }
}

processDoc();
