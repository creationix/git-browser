var domBuilder = require('dombuilder');

var goHistory = left("index", "history");
var repos = {
  creationix: [
    { title: "conquest",
      sub: "A remake of the classic Lords of Conquest for C64 implemented in JavaScript",
      onclick: goHistory },
    { title: "dombuilder",
      sub: "An easy dombuilder using json-ml style syntax",
      onclick: goHistory },
    { title: "js-git",
      sub: "A JavaScript implementation of Git",
      onclick: goHistory },
    { title: "git-browser",
      sub: "Browse Git Repos offline",
      onclick: goHistory },
    { title: "luv",
      sub: "Bare libuv bindings for lua",
      onclick: goHistory },
    { title: "rec",
      sub: "A tool for recording CLI programs and posting their output.",
      onclick: goHistory },
  ],
  luvit: [
    { title: "luvit",
      sub: "Lua + libUV + jIT = pure awesomesauce",
      onclick: goHistory },
    { title: "kernel",
      sub: "A simple async template language similair to dustjs and mustache (ported from c9/kernel)",
      onclick: goHistory },
  ],
};


var gofiles = left("history","files");
var commits = {
  "May 27, 2013": [
    { title: "Add circle icon for web store",
      sub: "39a63c86fed320e06c84af7cf311c38f4395ff00",
      onclick: gofiles },
    { title: "Convert to chrome app",
      sub: "edc154eab21edfcda42e2087dcba02eeffd6550d",
      onclick: gofiles },
  ],
  "Apr 30, 2013": [
    { title: "Remove old launch script",
      sub: "2a0008d86420559d2ebe1cf8962e92b31d75d73c",
      onclick: gofiles },
  ],
  "Aug 21, 2012": [
    { title: "Add package.json to declare dependencies",
      sub: "5d6eca688224279ffaaa8f3675521f00c6696936",
      onclick: gofiles },
  ],
  "May 12, 2011": [
    { title: "Allow loading over file urls",
      sub: "170ac70fd9f119c808eb860d7d76418544daf433",
      onclick: gofiles },
  ],
  "Apr 29, 2011": [
    { title: "Fix for tablet",
      sub: "ac9582c7e108d09d61de6260d9fea7f3730a9fb3",
      onclick: gofiles },
  ],
  "Mar 21, 2011": [
    { title: "Push changes",
      sub: "5ea500d3c9415af778c6d3643244f6fdb27d4507",
      onclick: gofiles },
  ],
  "Dec 10, 2010": [
    { title: "Repair the client",
      sub: "2c55ff9bb056ea3a35cc001a08a8c1e8e4e71593",
      onclick: gofiles },
    { title: "Fix file links",
      sub: "8c2cc497d857b09521b9aa4db42c67487938355d",
      onclick: gofiles },
    { title: "Fix README",
      sub: "b2b21570853202c742e23decde7c46611eb0c1f7",
      onclick: gofiles },
    { title: "Initial commit",
      sub: "76b17bf33955978d26c4464d4cce1be2c644cae7",
      onclick: gofiles },
  ]
};

var tree = [
  { title: ".gitignore",
    sub: "38f211d3325f524b74ef076c3569a57b92dbda57" },
  { title: "README.markdown",
    sub: "461a5bdb83746a7e3f8449bc009574b92f6e6dd0" },
  { title: "appinfo.json",
    sub: "8a48e7ace978047bfff982a4e2aca2f502acaa71" },
  { title: "art",
    sub: "b3f8efa73bfac690b386a7f92c9d54eb6b40f359" },
  { title: "background.js",
    sub: "8b017f72578016c876de8e95265af2657b6a400c" },
  { title: "client.js",
    sub: "28555e7055d7fa6184865bd3bab090621cf14cc5" },
  { title: "icons",
    sub: "ad157cf510e280ccfb7af63955c5a9eb5a4dfd53" },
  { title: "index.html",
    sub: "4e2ff86c954e4f02845524ba408da1782a140ad4" },
  { title: "manifest.json",
    sub: "8d572631af9ba044c4f07c57cb417c7d9de41b48" },
  { title: "maps",
    sub: "8cdfe297492d361098f0ca85596caf220623da6c" },
  { title: "resources",
    sub: "7deb4e389c162420b612d41ef9343502d4bc10ef" },
  { title: "utils.js",
    sub: "58aac45ba0d3c2829df074f58d801b6ff8e4641b" },
];

// Wrap a callback so that it auto-prevents default and is in scope.
function wrap(obj, fn) {
  return function (evt) {
    evt.preventDefault();
    return fn.call(obj);
  };
}

// Generate domBulder JSON for a header
// options.title, the title of the page
// options.back, a callback for the back button
// options.actions, a hash of toolbar actions
//   key is icon name, value is callback
function header(options) {
  var header = ["header.fixed"];
  if (options.back) {
    header.push(["a", {href:"#", onclick: wrap(options, options.back)},
      ["span.icon.icon-back", "back"]
    ]);
  }
  if (options.actions) {
    header.push(["menu", {type: "toolbar"},
      map(options.actions, function (name, action) {
        return ["a", {href:"#", onclick: wrap(options, action)},
          ["span.icon", {class: "icon-" + name}, name]
        ];
      })
    ]);
  }
  if (options.title) {
    header.push(["h1", options.title]);
  }
  return header;
}

// Generate domBuilder JSON for a list
// groups is hash of title and items
function groupedList(groups) {
  return ["article.content.scrollable.header",
    ["section", {"data-type": "list"}, map(groups, listGroup)]
  ];
}

// Name is group heading, items is list of item objects.
function listGroup(name, items) {
  return [
    ["header", name],
    ["ul", items.map(listItem)]
  ];
}

// Generate domBuilder JSON for a flast list
// items is an array of item objects
function list(items) {
  return ["article.content.scrollable.header",
    ["ul", {"data-type": "list"},
      items.map(listItem)
    ]
  ];
}

// item.title - main title
// item.subtitle - subtitle
// item.onclick - click action
function listItem(item) {
  var line = [["p", item.title]];
  if (item.sub) {
    line.push(["p", item.sub]);
  }
  if (item.onclick) {
    line = ["a", {href:"#",onclick: wrap(item, item.onclick)}, line];
  }
  return ["li", line];
}


document.body.textContent = "";
var $ = {};
document.body.appendChild(domBuilder([

  ["section$index.current", {"data-position":"current",role:"region"},
    header({
      title: "Git Repositories",
      actions: { edit: edit, add: add }
    }),
    groupedList(repos)
  ],

  ["section$history.right.skin-dark", {"data-position":"right",role:"region"},
    header({
      title: "conquest - History",
      back: right("history", "index")
    }),
    groupedList(commits)
  ],

  ["section$files.right", {"data-position":"right",role:"region"},
    header({
      title: "conquest - Files",
      back: right("files", "history")
    }),
    list(tree)
  ]

], $))

function left(current, next) {
  return function () {
    $[current].classList.remove("current");
    $[current].classList.add("left");
    $[next].classList.remove("right");
    $[next].classList.add("current");
    setTimeout(after, 400);
  };
  function after() {
    $[current].setAttribute('data-position', "left");
    $[next].setAttribute('data-position', "current");
  }
}

function right(current, next) {
  return function () {
    $[current].classList.remove("current");
    $[current].classList.add("right");
    $[next].classList.remove("left");
    $[next].classList.add("current");
    setTimeout(after, 400);
  };
  function after() {
    $[current].setAttribute('data-position', "right");
    $[next].setAttribute('data-position', "current");
  }
}

function edit() {

}

function add() {

}


// Simple helper to map over an object and return an array
function map(obj, callback) {
  var keys = Object.keys(obj);
  var result = [];
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    result.push(callback(key, obj[key]));
  }
  return result;
}


// Push a new page onto the navigation
function push(page) {

}

// Go back by popping a page from the navigation.
function pop() {

}
