function align_right (numVal, numLength) {
  numVal = numVal.toString();
  if (numVal.length < numLength) {
    for (var i = numVal.length; i < numLength; i++) {
      numVal = ' ' + numVal;
    }
  }
  return numVal;
}

function registerCardPrefix(numLength) {
  var propNumber = document.properties["alvexdt:id"];
  var propPrefix = document.parent.name + '-';
  
  if (propNumber && propPrefix && propNumber.indexOf(propPrefix) !== 0) {
    var newNumber = propPrefix + align_right(propNumber, numLength);
    var rgs = document.parent;
    
    // прибавляем номер, пока не найдём свободный
    // учитываем, что кто-то работает параллельно
    while (rgs.childByNamePath(newNumber) && rgs.childByNamePath(newNumber).properties['sys:node-uuid'] != document.properties['sys:node-uuid']) {
      propNumber++;
      if (propNumber >= rgs.properties["alvexdr:inc"]) {
        // двигаем счётчик реестра
        rgs.properties["alvexdr:inc"]++;
        rgs.save();
      }
      newNumber = propPrefix + align_right(propNumber, numLength);
    }
    
    document.name = newNumber;
    document.properties["alvexdt:id"] = newNumber;
    document.save();
  }
}

registerCardPrefix(0);
