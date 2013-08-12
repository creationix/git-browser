var domBuilder = require('dombuilder');
var log = require('domlog');
window.log = log;
document.body.innerText = "";
document.body.appendChild(domBuilder([
  ["h1", "JS-Git ChromeApp"],
  ["form",
    {onsubmit: wrap(function (evt) {
      evt.preventDefault();
      var options = {
        protocol: 'git:',
        hostname: this.hostname.value,
        pathname: this.pathname.value
      };
      log("TODO:", options);
    })},
    ["input", {name: "hostname", size: 10, value: "github.com" }],
    ["input", {name: "pathname", size: 40, value: "/creationix/conquest.git" }],
    ["input", {type:"submit", value: "List Refs"}],
    ["input", {type:"submit", value: "Clone"}],
  ]
]));

log.setup({
  top: "150px",
  height: "auto",
  background: "#222"
});


// Load the libraries
var autoProto = require('js-git/protocols/auto.js');

var opts = {
  protocol: "git:",
  hostname: "github.com",
  pathname: "/creationix/conquest.git"
};

// Do the action
var connection = autoProto(opts);
connection.discover(function (err, refs) {
  if (err) throw err;
  Object.keys(refs).forEach(function (ref) {
    log(refs[ref] + "\t" + ref);
  });
  connection.close(function (err) {
    if (err) throw err;
    log("DONE");
  });
});

// Wrap a function in one that redirects exceptions.
// Use for all event-source handlers.
function wrap(fn) {

  return function () {
    try {
      return fn.apply(this, arguments);
    }
    catch (err) {
      log(err);
    }
  };
}
