#/usr/bin/sh

firefox -CreateProfile TESTING
mkdir -p .mozilla/firefox/
cp -R .mozilla/firefox/*TESTING/ $HOME/.mozilla/firefox/*TESTING/

sed "s/%USER%/$USER/g" < $HOME/.mozilla/firefox/*TESTING/prefs.js > $HOME/.mozilla/firefox/*TESTING/prefs.js
sed "s/%USER%/$USER/g" < $HOME/.mozilla/firefox/*TESTING/extensions.ini > $HOME/.mozilla/firefox/*TESTING/extensions.ini

ls -la selenium-server-standalone-2.29.0.jar || wget http://selenium.googlecode.com/files/selenium-server-standalone-2.29.0.jar

nohup java -jar selenium-server-standalone-2.29.0.jar -Dwebdriver.firefox.profile="TESTING" 2>&1 > /dev/null &