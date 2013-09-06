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

function onclick(handler) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function (evt) {
    evt.preventDefault();
    return handler.apply(this, args);
  };
}

function repoList() {
  return domBuilder(["section.page", {"data-position": "current"},
    ["header",
      ["button", {onclick:onclick(add)}, "⊕"],
      ["h1", "Git Repositories"]
    ],
    ["ul.content.header", data.repos.map(function (repo) {
      return ["li", { href:"#", onclick: onclick(load, repo) },
        [".icon.right", "❱"],
        ["p", repo.name],
        ["p", repo.description]
      ];
    })]
  ]);

  function load(repo) {
    ui.push(historyList(repo));
  }

  function add() {
    ui.push(addPage());
  }
}

function addPage() {
  return domBuilder(["section.page",
    ["header",
      ["button.back", {onclick: ui.pop}, "❰"],
      ["h1", "Clone Repository"]
    ],
    ["content.header",
      ["h2", "TODO: Implement me"]
    ]
  ]);
}

function historyList(repo) {
  var list = [];
  var $ = {};
  var chunkSize = 9;
  var stream = data.historyStream(repo.db, repo.db.refs["refs/heads/master"]);
  enqueue();
  return domBuilder(["section.page",
    ["header",
      ["button.back", {onclick: ui.pop}, "❰"],
      ["h1", repo.name]
    ],
    ["ul.content.header", list]
  ], $);

  function enqueue() {
    for (var i = 0; i < chunkSize; ++i) {
      var commit = stream.next();
      if (!commit) return;
      var title = truncate(commit.message, 80);
      list.push(["li", { href:"#", onclick: onclick(load, commit) },
        [".icon.right", "❱"],
        ["p", title],
        ["p", commit.hash]
      ]);
    }
    list.push(["li", { href:"#", onclick: onclick(more) },
      ["p$more", "Load More..."]
    ]);
  }

  function more() {
    var li = $.more;
    while (li.tagName !== "LI") li = li.parentNode;
    var ul = li.parentNode;
    ul.removeChild(li);
    list = [];
    enqueue();
    $.more = null;
    ul.appendChild(domBuilder(list, $));
    return;
  }

  function load(commit) {
    ui.push(commitPage(repo, commit));
  }
}

function commitPage(repo, commit) {
  var details = [];
  var body = ["section.page",
    ["header",
      ["button.back", {onclick: ui.pop}, "❰"],
      ["h1", repo.name]
    ],
    [".content.header", details]
  ];
  details.push(
    ["header", ["h2", "message:"]],
    ["p", {css:{whiteSpace:"pre-wrap"}}, commit.message]);
  details.push(
    ["header", ["h2", {css:{marginTop:0}}, "tree:"]],
    ["button.recommend", {onclick: enter}, commit.tree]);
  if (commit.parents) {
    details.push(["header",
      ["h2", {css:{marginTop:0}},
        "parent" + (commit.parents.length === 1 ? "" : "s") + ":"
      ]
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

  return domBuilder(body);

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
  return domBuilder(["section.page",
    ["header",
      ["button.back", {onclick: ui.pop}, "❰"],
      ["h1", repo.name]
    ],
    ["ul.content.header", tree.map(function (file) {
      return ["li", { href:"#", onclick: onclick(load, file) },
        [".icon.right", "❱"],
        ["p", file.name],
        ["p", file.hash]
      ];
    })]
  ]);
  function load(file) {
    console.log("TODO: load file");
  }
}

function truncate(message, limit) {
  var title = message.split(/[\r\n]/)[0];
  if (title.length > limit) title = title.substr(0, limit - 3) + "...";
  return title;
}
