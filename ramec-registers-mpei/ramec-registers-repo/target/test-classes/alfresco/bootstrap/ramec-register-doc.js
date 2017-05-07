function align_right (numVal, numLength) {
  numVal = numVal.toString();
  if (numVal.length < numLength) {
    for (var i = numVal.length; i < numLength; i++) {
      numVal = ' ' + numVal;
    }
  }
  return numVal;
}

function registerDoc (regSite, rcvType, rcvStatus, dlvType, numLength) {
  var rgn = document.properties["ramecedm:registerable_register"];
  if (rgn === null || rgn == "(не зарегистрирован)") { return; }

  // проверяем наличие сайта и нужного реестра
  var rgs = siteService.getSite(regSite);
  if (rgs === null) { return; }

  rgs = rgs.getContainer("dataLists");
  if (rgs === null) { return; }

  rgs = rgs.childByNamePath(rgn);
  if (rgs === null) { return; }

  // Проверяем наличие совпадений
  for each (var ch in rgs.children) {
    if (!ch.properties['alvexdt:id']) { continue; }
    if (ch.properties["ramecedm:correspondent_number"] != document.properties["ramecedm:registable_correspondent_number"]) { continue; }
    if (ch.properties["ramecedm:correspondent_date"].toString() != document.properties["ramecedm:registable_correspondent_date"].toString())  { continue; }
    if (ch.properties["ramecedm:correspondent_name"] != document.properties["ramecedm:registable_correspondent_name"])  { continue; }
    if ((ch.associations['ramecedm:correspondent_person'] === null && document.associations['ramecedm:registable_correspondent_person'] === null) ||
      (ch.associations['ramecedm:correspondent_person'] !== null && document.associations['ramecedm:registable_correspondent_person'] !== null &&
      ch.associations['ramecedm:correspondent_person'][0] ==  document.associations['ramecedm:registable_correspondent_person'][0])) {
      // Нашли совпадение, не регистрируем вторично
      return;
    }
  }

  // получаем новый номер в реестре
  var cnt = rgs.properties["alvexdr:inc"]++;
  rgs.save();  // быстренько запоминаем увеличение счётчика реестра

  // создаём шаблон документа с номером в качестве имени
  var rc = rgs.createNode(cnt, "ramecedm:document_incoming");
  rc.properties["alvexdt:id"] = cnt;
  rc.properties["alvexdt:registerDate"] = new Date();
  rc.save();  // закрепляем номер за собой

  // прописываем проперти
  rc.properties["ramecedm:received_title"] = document.properties["ramecedm:registable_title"];
  rc.properties["ramecedm:received_type"] = rcvType;
  rc.properties["ramecedm:received_status"] = rcvStatus;
  rc.properties["alvexdt:deliveryType"] = dlvType;
  rc.properties["ramecedm:correspondent_name"] = document.properties["ramecedm:registable_correspondent_name"];
  rc.properties["ramecedm:received_sender_fio"] = document.properties["ramecedm:registable_sender_fio"];
  rc.properties["ramecedm:correspondent_number"] = document.properties["ramecedm:registable_correspondent_number"];
  rc.properties["ramecedm:correspondent_date"] = document.properties["ramecedm:registable_correspondent_date"];
  rc.properties["alvexdt:summary"] = document.properties["ramecedm:registable_summary"];
  rc.properties["ramecedm:wfstart"] = false;  // не хотим, чтобы бизнес-процесс пошёл раньше времени
  rc.save();  // обязательно делаем save() перед createAssociation, иначе проперти не запомнятся

  // копируем ассоциации из документа
  var tmp = document.associations["ramecedm:registable_correspondent_person"];
  if (tmp !== null) {
    for (var i1 = 0; i1 < tmp.length; i1++) {
      rc.createAssociation(tmp[i1], "ramecedm:correspondent_person");
    }
  }
  tmp = document.associations["ramecedm:registable_addressee"];
  if (tmp !== null) {
    for (var i2 = 0; i2 < tmp.length; i2++) {
      rc.createAssociation(tmp[i2], "alvexdt:addressee");
    }
  }
  tmp = document.associations["ramecedm:registable_informee"];
  if (tmp !== null) {
    for (var i3 = 0; i3 < tmp.length; i3++) {
      rc.createAssociation(tmp[i3], "ramecedm:informee");
    }
  }
  rc.createAssociation(document, "alvexdt:files");

  // обратно в документ приписываем к имени полученный в реестре номер
  document.name = rgs.name + "-" + align_right(rc.properties["alvexdt:id"], numLength) + " " + document.name;
  document.save();

  // в самом конце ставим флажок запуска бизнес-процесса
  rc.properties["ramecedm:wfstart"] = document.associations["ramecedm:registable_addressee"] !== null;
  rc.save();
}


registerDoc("registers", "2 - Письмо", "2 - Обработан (присвоены регистрационные данные)", "3 - Факс", 4);
