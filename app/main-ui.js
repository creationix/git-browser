var domBuilder = require('dombuilder');
var ui = require('./ui.js');

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


document.body.textContent = "";
var $ = {};
document.body.appendChild(domBuilder([

  ["section$index.current", {"data-position":"current",role:"region"},
    ui.header({
      title: "Git Repositories",
      actions: { edit: edit, add: add }
    }),
    ui.groupedList(repos)
  ],

  ["section$history.right.skin-dark", {"data-position":"right",role:"region"},
    ui.header({
      title: "conquest - History",
      back: right("history", "index")
    }),
    ui.groupedList(commits)
  ],

  ["section$files.right", {"data-position":"right",role:"region"},
    ui.header({
      title: "conquest - Files",
      back: right("files", "history")
    }),
    ui.list(tree)
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


// Push a new page onto the navigation
function push(page) {

}

// Go back by popping a page from the navigation.
function pop() {

}
