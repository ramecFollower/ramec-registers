#!/bin/bash

case $(hostname) in
pled76-x53s)
  DOCKDIR=/home/pled76/Work/RAMEC/Docker
  ;;

mp-480)
  DOCKDIR=/media/Data/Tools/Docker
  ;;

*)
  echo "Не указано расположение Docker для этого хоста: $(hostname)"
  exit 1
  ;;
esac

TGTALF=$DOCKDIR/alfresco_webapp/alfresco.mpei

echo "Запрашиваем пароль sudo в начале скрипта"
sudo echo "OK"

bzr add .
bzr commit -m "Собираем версию"

mvn clean install

sudo cp ramec-registers-repo/target/ramec-registers-repo.amp $TGTALF/amps/
sudo cp ramec-registers-share/target/ramec-registers-share.amp $TGTALF/amps_share/

docker stop alfresco.mpei

cd $TGTALF/bin
sudo ./apply_amps.sh -nonstop -force



exit 0
