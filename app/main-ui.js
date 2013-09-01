var domBuilder = require('dombuilder');
var ui = require('./ui.js');
var data = require('./data.js');

ui.push(repoList());
// var repo = data.repos[1];
// ui.push(historyList(repo));
// var hash = repo.db.refs["refs/heads/master"];
// var commit = repo.db.objects[hash].body;
// ui.push(commitPage(repo, commit));
// var tree = repo.db.objects[commit.tree].body;
// ui.push(filesList(repo, tree));

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
        data: [repo]
      };
    }), load)
  ];
  return domBuilder(ui.page(body));



  function add() {}
  function load(repo) {
    ui.push(historyList(repo));
  }
}

function historyList(repo) {
  var list = [];
  var $ = {};
  var chunkSize = 9;
  var stream = data.historyStream(repo.db, repo.db.refs["refs/heads/master"]);
  more();
  var body = [
    ui.header({
      title: repo.name,
      back: ui.pop
    }),
    ui.list(list, load)
  ];
  return domBuilder(ui.page(body), $);

  function more() {
    for (var i = 0; i < chunkSize; ++i) {
      var commit = stream.next();
      if (!commit) return;
      var title = truncate(commit.message, 80);
      list.push({
        title: title,
        sub: commit.hash,
        icon: "octicon octicon-git-commit",
        iconRight: "octicon octicon-chevron-right",
        data: [repo, commit]
      });
    }
    list.push({
      title: ["span$more", "Load More..."],
      data: []
    });
  }

  function load(repo, commit) {
    if (!repo) {
      var li = $.more.parentNode;
      while (li.tagName !== "LI") li = li.parentNode;
      var ul = li.parentNode;
      ul.removeChild(li);
      list = [];
      more();
      $.more = null;
      ul.appendChild(domBuilder(ui.arrMap(list, ui.listItem, load), $));
      return;
    }
    ui.push(commitPage(repo, commit));
  }
}

function commitPage(repo, commit) {
  var details = [];
  var body = [
    ui.header({
      title: repo.name,
      back: ui.pop
    }),
    ["article.content.scrollable.header", details]
  ];
  details.push(
    ["header", ["h2", "message:"]],
    ["p", {css:{whiteSpace:"pre-wrap"}}, commit.message]);
  details.push(
    ["header", ["h2", {css:{marginTop:0}}, "tree:"]],
    ["button.recommend", {onclick: enter}, commit.tree]);
  if (commit.parents) {
    details.push(["header",
      ["h2", {css:{marginTop:0}}, "parent" + (commit.parents.length === 1 ? "" : "s") + ":"]
    ]);
    commit.parents.forEach(function (parent) {
      details.push(["button", {onclick: ascend(parent)}, parent]);
    });
  }
  details.push(
    ["header", ["h2", {css:{marginTop:0}}, "author:"]],
    ["p", commit.author]);
  if (commit.author !== commit.committer) {
    details.push(
      ["header", ["h2", {css:{marginTop:0}}, "committer:"]],
      ["p", commit.committer]);
  }
  details.push(
    ["header", ["h2", {css:{marginTop:0}}, "hash:"]],
    ["button", {disabled:true}, commit.hash]);

  return domBuilder(ui.page(body));

  function enter() {
    var tree = repo.db.objects[commit.tree].body;
    ui.push(filesList(repo, tree));
  }

  function ascend(parent) {
    return function () {
      var commit = repo.db.objects[parent].body;
      ui.peer(commitPage(repo, commit));
    };
  }
}

function filesList(repo, tree) {
  var body = [
    ui.header({
      title: repo.name,
      back: ui.pop,
    }),
    ui.list(tree.map(function (file) {
      var entry = {
        title: file.name,
        sub: file.hash,
        data: [file]
      };
      if (file.mode === 040000) {
        entry.icon = "octicon octicon-file-directory";
        entry.iconRight = "octicon octicon-chevron-right";
      }
      else if (file.mode === 0120000) {
        entry.data = ["tree", file.hash];
        if (/\.[a-z0-9]{1,7}$/i.test(file.name)) {
          entry.icon = "octicon octicon-symlink-file";
        }
        else {
          entry.icon = "octicon octicon-symlink-directory";
        }
      }
      else {
        if (/\.(png|jpg|jpeg|gif|bmp|m4a|avi|mpeg|ogg|mp3|aac|svg)$/i.test(file.name)) {
          entry.icon = "octicon octicon-file-media";
        }
        else if (/\.(js|css|lua|html|md|markdown|json|rb|py)$/i.test(file.name)) {
          entry.icon = "octicon octicon-file-code";
        }
        else if (/\.(pdf)$/i.test(file.name)) {
          entry.icon = "octicon octicon-file-pdf";
        }
        else if (/\.(txt|log)$/i.test(file.name)) {
          entry.icon = "octicon octicon-file-text";
        }
        else if (/\.(zip)$/i.test(file.name)) {
          entry.icon = "octicon octicon-file-zip";
        }
        else {
          entry.icon = "octicon octicon-file-binary";
        }
      }
      return entry;
    }), load)
  ];
  return domBuilder(ui.page(body, "dark"));
  function load(file) {
    if (file.mode === 040000) {
      var tree = repo.db.objects[file.hash].body;
      ui.push(filesList(repo, tree));
    }
  }
}

function truncate(message, limit) {
  var title = message.split(/[\r\n]/)[0];
  if (title.length > limit) title = title.substr(0, limit - 3) + "...";
  return title;
}
