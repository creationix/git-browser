var domBuilder = require('dombuilder');
var ui = require('./ui.js');
var data = require('./data.js');

ui.push(repoList());

function repoList() {
  var body = [
    ui.header({
      title: "Git Repositories",
      actions: {
        "octicon octicon-repo-create": add,
      }
    }),
    ui.list(data.repos.map(function (repo) {
      return {
        title: repo.name,
        sub: repo.description,
        icon: "octicon octicon-repo",
        iconRight: "octicon octicon-chevron-right",
        data: repo
      };
    }), load)
  ];
  return domBuilder(ui.page(body));



  function add() {}
  function load(repo) {
    console.log(repo.name)
    console.log(repo.db);
    // ui.push(historyList());
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
  return domBuilder(ui.page(body, "dark"));
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

