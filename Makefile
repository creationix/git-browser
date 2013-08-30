CHROME=build/chromeapp
CHROME_ZIP=../git-browser-chrome.zip
FIREFOX=build/firefoxapp
FIREFOX_ZIP=../git-browser-firefox.zip

all: chrome chrome-zip firefox firefox-zip

chrome: ${CHROME} ${CHROME}/app.js ${CHROME}/manifest.json ${CHROME}/background.js ${CHROME}/index.html ${CHROME}/icons ${CHROME}/bb ${CHROME}/style.css ${CHROME}/octicons

chrome-zip: chrome
	cd ${CHROME} && rm -f ${CHROME_ZIP} && zip -o -r ${CHROME_ZIP} .

firefox-zip: chrome
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

${CHROME}/style.css: app/style.css
	cp app/style.css ${CHROME}/style.css

${CHROME}/icons: icons
	cp -r icons ${CHROME}/icons

${CHROME}/bb: bb
	cp -r bb ${CHROME}/bb

${CHROME}/octicons: octicons
	cp -r octicons ${CHROME}/octicons

firefox: ${FIREFOX} ${FIREFOX}/app.js ${FIREFOX}/manifest.webapp ${FIREFOX}/index.html ${FIREFOX}/icons ${FIREFOX}/bb ${FIREFOX}/style.css ${FIREFOX}/octicons

${FIREFOX}:
	mkdir -p ${FIREFOX}

${FIREFOX}/app.js: .FORCE
	node utils/find-deps.js mozapp/bootstrap.js > ${FIREFOX}/app.js

${FIREFOX}/manifest.webapp: mozapp/manifest.webapp
	cp mozapp/manifest.webapp ${FIREFOX}/manifest.webapp

${FIREFOX}/index.html: app/index.html
	cp app/index.html ${FIREFOX}/index.html

${FIREFOX}/style.css: app/style.css
	cp app/style.css ${FIREFOX}/style.css

${FIREFOX}/icons: icons
	cp -r icons ${FIREFOX}/icons

${FIREFOX}/bb: bb
	cp -r bb ${FIREFOX}/bb

${FIREFOX}/octicons: octicons
	cp -r octicons ${FIREFOX}/octicons

clean:
	rm -rf build

.PHONY: all chrome zip firefox clean
.FORCE:
