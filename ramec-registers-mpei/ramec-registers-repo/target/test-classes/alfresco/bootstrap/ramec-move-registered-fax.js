function moveRegisteredFax (srcdir, tgtdir) {
  if (document.associations["alvexdt:files"] !== null) {
    for (var i = 0; i < document.associations["alvexdt:files"].length; i++) {
      var fn = document.associations["alvexdt:files"][i];
      if (fn.parent.name == srcdir) {
        var tf = fn.parent.parent.childByNamePath(tgtdir);
        if (tf !== null) {
          fn.move(tf);
        }
      }
    }
  }
}

moveRegisteredFax("Не распределённые факсы", "Распределённые факсы");
