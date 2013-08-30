var domBuilder = require('dombuilder');
var ui = require('./ui.js');
var dummy = require('./dummy.js');

ui.push(repoList());

function repoList() {
  var body = [
    ui.header({
      title: "Git Repositories",
      actions: {
        "octicon octicon-repo-create": add,
      }
    }),
    ui.groupedList(dummy.repos, load)
  ];
  return domBuilder(ui.page(body));

  function add() {}
  function load() {
    ui.push(historyList());
  }
}

function historyList() {
  var body = [
    ui.header({
      title: "conquest - History",
      back: ui.pop
    }),
    ui.groupedList(dummy.commits, load)
  ];
  return domBuilder(ui.page(body, "dark"))
  function load() {
    ui.push(filesList());
  }
}

function filesList() {
  var body = [
    ui.header({
      title: "conquest - Files",
      back: ui.pop
    }),
    ui.list(dummy.tree, load)
  ];
  return domBuilder(ui.page(body));
  function load() {

  }
}

