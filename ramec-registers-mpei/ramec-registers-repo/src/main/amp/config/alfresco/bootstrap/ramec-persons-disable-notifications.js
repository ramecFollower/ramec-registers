
/* Выключение пользовательских оповещений */

function main() {
  var nodes = roothome.childrenByXPath('/sys:system/sys:people')[0].children;
  
  for each(var node in nodes) {
    if (node.properties["cm:emailFeedDisabled"] !== true) {
      node.properties["cm:emailFeedDisabled"] = true;
      node.save();
      logger.log(node.properties["cm:userName"] + " : " +  node.properties["cm:emailFeedDisabled"]);
    }
  }
}

main();
