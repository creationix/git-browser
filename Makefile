CHROME=build/chromeapp
CHROME_ZIP=build/git-browser-chrome.zip
FIREFOX=build/firefoxapp

all: chrome zip firefox

chrome: ${CHROME} ${CHROME}/app.js ${CHROME}/manifest.json ${CHROME}/background.js ${CHROME}/index.html ${CHROME}/icons

zip: chrome
	rm -f ${CHROME_ZIP}
	zip -o -r ${CHROME_ZIP} ${CHROME}

${CHROME}:
	mkdir -p ${CHROME}

${CHROME}/app.js: .FORCE
	node utils/find-deps.js chromeapp/bootstrap.js > ${CHROME}/app.js

${CHROME}/manifest.json: manifest.json
	sed manifest.json -e 's/chromeapp\/background\.js/background.js/' > ${CHROME}/manifest.json

${CHROME}/background.js: chromeapp/background.js
	sed chromeapp/background.js -e 's/chromeapp\/index\.html/index.html/' > ${CHROME}/background.js

${CHROME}/index.html: chromeapp/index.html
	sed chromeapp/index.html -e 's/\( *\).*bootstrap\.js.*/\1<script src="app.js"><\/script>/' > ${CHROME}/index.html

${CHROME}/icons: icons
	cp -r icons ${CHROME}/icons

firefox: ${FIREFOX} ${FIREFOX}/app.js ${FIREFOX}/manifest.webapp ${FIREFOX}/index.html ${FIREFOX}/icons

${FIREFOX}:
	mkdir -p ${FIREFOX}

${FIREFOX}/app.js: .FORCE
	node utils/find-deps.js mozapp/bootstrap.js > ${FIREFOX}/app.js

${FIREFOX}/manifest.webapp: mozapp/manifest.webapp
	cp mozapp/manifest.webapp ${FIREFOX}/manifest.webapp

${FIREFOX}/index.html: mozapp/index.html
	cp mozapp/index.html ${FIREFOX}/index.html

${FIREFOX}/icons: icons
	cp -r icons ${FIREFOX}/icons

clean:
	rm -rf build

.PHONY: all chrome zip firefox clean
.FORCE:
