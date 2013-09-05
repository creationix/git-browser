CHROME=build/chromeapp
CHROME_ZIP=../git-browser-chrome.zip
FIREFOX=build/firefoxapp
FIREFOX_ZIP=../git-browser-firefox.zip

all: chrome chrome-zip firefox firefox-zip

chrome: ${CHROME} ${CHROME}/app.js ${CHROME}/manifest.json ${CHROME}/background.js ${CHROME}/index.html ${CHROME}/icons ${CHROME}/style.css

chrome-zip: chrome
	cd ${CHROME} && rm -f ${CHROME_ZIP} && zip -o -r ${CHROME_ZIP} .

firefox-zip: firefox
	cd ${FIREFOX} && rm -f ${FIREFOX_ZIP} && zip -o -r ${FIREFOX_ZIP} .

${CHROME}:
	mkdir -p ${CHROME}

${CHROME}/app.js: .FORCE
	node utils/find-deps.js chromeapp/bootstrap.js > ${CHROME}/app.js

${CHROME}/manifest.json: chromeapp/manifest.json
	cp chromeapp/manifest.json ${CHROME}/manifest.json

${CHROME}/background.js: chromeapp/background.js
	cp chromeapp/background.js ${CHROME}/background.js

${CHROME}/index.html: app/index.html
	cp app/index.html ${CHROME}/index.html

${CHROME}/style.css: app/style.less app/transitions.less
	lessc app/style.less > ${CHROME}/style.css

${CHROME}/icons: icons
	cp -r icons ${CHROME}/icons

firefox: ${FIREFOX} ${FIREFOX}/app.js ${FIREFOX}/manifest.webapp ${FIREFOX}/index.html ${FIREFOX}/icons ${FIREFOX}/style.css

${FIREFOX}:
	mkdir -p ${FIREFOX}

${FIREFOX}/app.js: .FORCE
	node utils/find-deps.js mozapp/bootstrap.js > ${FIREFOX}/app.js

${FIREFOX}/manifest.webapp: mozapp/manifest.webapp
	cp mozapp/manifest.webapp ${FIREFOX}/manifest.webapp

${FIREFOX}/index.html: app/index.html
	cp app/index.html ${FIREFOX}/index.html

${FIREFOX}/style.css: app/style.less app/transitions.less
	lessc app/style.less > ${FIREFOX}/style.css

${FIREFOX}/icons: icons
	cp -r icons ${FIREFOX}/icons

clean:
	rm -rf build

.PHONY: all chrome zip firefox clean
.FORCE:
