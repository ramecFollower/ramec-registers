/**
 * Обёртка для улучшения поиска групп и устранения глюков альфреско в этой части
 */

function getGroupsInZoneRMC(shortNameFilter, zone, paging, sortBy, sortAsc) {
  var newG = groups.getGroupsInZone(shortNameFilter, zone, paging, sortBy, sortAsc);
  
  if (newG.length) { return newG; }
  
  /** 
   * Дополнительный поиск с пристрастием, если ничего пока не нашлось
   * ВНИМАНИЕ! в этом блоке zone и paging игнорируются
   */
  newG = [];
  var auths = roothome.childrenByXPath('/sys:system/sys:authorities')[0];
  var re = [ new RegExp(shortNameFilter.toLowerCase()), new RegExp('.*' + shortNameFilter.toLowerCase() + '.*') ];
  var fltAuths = function (x) {
    var adn = x.properties['cm:authorityDisplayName'];
    return adn && re.some(function (rex) { return rex.test(adn.toLowerCase()); });
  };
  for each (var a1 in auths.children.filter(fltAuths)) {
    var g1 = groups.getGroupForFullAuthorityName(a1.properties['cm:authorityName']);
    if (g1) { newG.push(g1); }
  }
  var sortGroups = sortAsc ?
  function (a, b) { return a[sortBy] > b[sortBy]; }:
  function (a, b) { return a[sortBy] < b[sortBy]; };
  
  return newG.sort(sortGroups);
}

