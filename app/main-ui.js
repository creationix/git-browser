var domBuilder = require('dombuilder');
var ui = require('./ui.js');
var dummy = require('./dummy.js');
var each = require('./util.js').each;

var repos = dummy.repos;
var goHistory = left("index", "history");
each(repos, function (key, repos) {
  repos.forEach(function (repo) {
    repo.onclick = goHistory;
  });
});

var goFiles = left("history", "files");
var commits = dummy.commits;
each(commits, function (key, commits) {
  commits.forEach(function (commit) {
    commit.onclick = goFiles;
  });
});

var tree = dummy.tree;

console.log({repos:repos,commits:commits,tree:tree});


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
