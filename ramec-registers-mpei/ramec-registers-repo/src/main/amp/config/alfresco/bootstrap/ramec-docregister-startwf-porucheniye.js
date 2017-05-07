function formatISO(dt) {
  var yy = dt.getFullYear() + '-';
  var mm = (dt.getMonth() + 1).toString();
  mm = (mm < 10 ? '0' + mm : mm) + '-';
  var dd = dt.getDate().toString();
  dd = (dd < 10 ? '0' + dd : dd);
  return(yy + mm + dd);
}

function personFullName(pers) {
  if (!pers.properties) {
    pers = people.getPerson(pers);
  }
  if (!pers.properties) { return pers; }
  var fname = pers.properties.lastName;
  if (fname) { fname = fname + ' '; }
  var f = pers.properties.firstName;
  if (f) { fname = fname + f; }
  return fname;
}


function startWorkflow()
{
  var wf = actions.create("start-workflow");
  wf.parameters.workflowName = "activiti$ramec-porucheniye-parallel";

  var wftitle = document.name;
  var doctitle = document.properties["ramecedm:porucheniye_title"];
  if (doctitle) {
    wftitle = wftitle + " " + doctitle;
  }
  wf.parameters["bpm:workflowDescription"] = wftitle;

  var asgnArray = [];
  var assignee = document.associations["ramecedm:addressees"];
  if (assignee) {
    /* Читаем персон, их передаём, как есть */
    for each (var a1 in assignee) {
      asgnArray.push(a1);
    }
  }
  var assignees = document.associations["ramecedm:groupsaddressees"];
  if (assignees) {
    /* Получаем набор групп, разбираем их по персонам */
    for each (var a2 in assignees) {
      for each (var u2 in groups.getGroupForFullAuthorityName(a2.properties["cm:authorityName"]).allUsers) {
        var p2 = search.findNode(u2.personNodeRef);
        if (p2) {
          asgnArray.push(p2);
        }
      }
    }
  }
  wf.parameters["ramecwf:assignees"] = asgnArray;

  var hist = '[' + personFullName(person) + ']: ' + document.properties["alvexdt:summary"];
  var dued = document.properties["alvexdt:dueDate"];
  if (dued) {
    hist = hist + ', выполнить к: ' + formatISO(dued);
  }
  wf.parameters["ramecwf:summaryHistory"] = hist;
  wf.parameters["ramecwf:summary"] = document.properties["alvexdt:summary"];
  wf.parameters["bpm:workflowDueDate"] = dued;

  return wf.execute(document);
}



function main()
{
  if (document.properties["ramecedm:wfstart"] && document.associations["ramecedm:addressees"]) {
    /* Отменяем предыдущие поручения */
    for each (var wf1 in document.activeWorkflows) {
      if (!wf1) { continue; }
      for each (var wfp1 in wf1.getPaths()) {
        if (!wfp1) { continue; }
        for each(var tsk1 in wfp1.tasks) {
          if (!tsk1) { continue; }
          var pkg = tsk1.properties['bpm:package'];
          if (pkg) { pkg = search.findNode(pkg); }
          if (pkg && pkg.properties['bpm:workflowDefinitionName'].indexOf('activiti$ramec-porucheniye') > -1) {
            tsk1.endTask('Next');
          }
        }
      }
    }

    /* Запускаем новый процесс */
    startWorkflow();
    document.properties["ramecedm:wfstart"] = false;
    document.save();

    /* Даём права чтения вложенных документов активити-группам */
    for each (var grp in document.activeWorkflows) {
      var prm = document.permissions.toString();
      var grpName = 'GROUP_' + grp.id;
      if (prm.indexOf(';' + grpName + ';') == -1) {
        document.setPermission('Consumer', grpName);
      }
      for each (var fl in document.associations['alvexdt:files']) {
        fl.setPermission('Consumer', grpName);
      }
    }
  }
}

main();
