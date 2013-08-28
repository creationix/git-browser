var deps = require('./utils/find-deps.js');
deps.add("chromeapp/bootstrap.js");
console.log(Object.keys(deps.flush()));
