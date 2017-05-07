<import resource="classpath:/alfresco/extension/templates/webscripts/ru/ramec/alfresco/repository/groups/groups.lib.js">

/**
 * List/Search groups
 */

function main ()
{
  // Get the args
  var shortNameFilter = args["shortNameFilter"];
  var zone = args["zone"];
  var sortBy = args["sortBy"];
  var sortAsc = args["dir"] != "desc";
  var paging = utils.createPaging(args);
  
  if (shortNameFilter == null)
  {
    shortNameFilter = "";
  }
  
  if (sortBy == null)
  {
    sortBy = "displayName";
  }
  
  // Get the groups
  model.groups = getGroupsInZoneRMC(shortNameFilter, zone, paging, sortBy, sortAsc);
  model.paging = paging;
}

main();
