#/usr/bin/sh

mkdir -p .mozilla/firefox/
cp -R .mozilla/firefox/ $HOME/.mozilla/firefox

nohup java -jar selenium-server-standalone-2.29.0.jar -Dwebdriver.firefox.profile="TESTING" 2>&1 > /dev/null &
