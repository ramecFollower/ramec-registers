function align_right (numVal, numLength) {
  numVal = numVal.toString();
  if (numVal.length < numLength) {
    for (var i = numVal.length; i < numLength; i++) {
      numVal = ' ' + numVal;
    }
  }
  return numVal;
}

function align_numbers (regSiteName, numLength) {
  var regSite = siteService.getSite(regSiteName);
  var regCont = regSite.getContainer('dataLists');

  for each (var rg in regCont.children) {
    var pref = rg.name + '-';
    for each (var rc in rg.children) {
      if (!rc.properties['alvexdt:id'] || rc.name != rc.properties['alvexdt:id']) { continue; }
      var newid = align_right(rc.name.slice(pref.length), numLength);
      try {
        rc.name = newid;
        rc.properties['alvexdt:id'] = newid;
        rc.save();
      } catch (e) {
        print('Не удалось исправить на номер: [' + newid + '] для документа: ' + rc.properties);
      }
    }
  }
}

align_numbers('registers', 4);
