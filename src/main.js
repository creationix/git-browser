var domBuilder = require('dombuilder');
var ui = require('./ui.js');
module.exports = function (backend) {

  backend.getRepos(function (err, repos) {
    if (err) throw err;
    ui.push(repoList(repos));
  });

  function onclick(handler) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function (evt) {
      evt.preventDefault();
      return handler.apply(this, args);
    };
  }

  function repoList(repos) {
    return domBuilder(["section.page", {"data-position": "none"},
      ["header",
        (backend.addRepo ? ["button", {onclick:onclick(add)}, "⊕"] : []),
        ["h1", "Git Repositories"]
      ],
      ["ul.content.header", repos.map(function (repo) {
        return ["li", { href:"#", onclick: onclick(load, repo) },
          [".icon.right", "❱"],
          ["p", repo.name],
          ["p", repo.description]
        ];
      })]
    ]);

    function load(repo) {
      backend.getHistoryStream(repo, function (err, stream) {
        if (err) throw err;
        ui.push(historyList(repo, stream));
      });
    }

    function add() {
      ui.push(addPage());
    }
  }

  function addPage() {
    var $ = {};
    var working = false;
    return domBuilder(["section.page",
      ["header",
        ["button.back", {onclick: ui.pop}, "❰"],
        ["h1", "Clone Repository"]
      ],
      ["form.content.header", {onsubmit: submit},
        ["label", {for: "hostname"}, "Host"],
        ["input", {
          type: "text",
          name: "hostname",
          placeholder: "github.com",
          value: "github.com",
          required: true
        }],
        ["label", {for: "pathname"}, "Path"],
        ["input", {
          type: "text",
          name: "pathname",
          placeholder: "/creationix/conquest.git",
          value: "/creationix/conquest.git",
          required: true
        }],
        ["label", {for: "description"}, "Description"],
        ["input", {
          type: "text",
          name: "description",
          placeholder: "Enter a short description here",
          value: "A remake of the classic Lords of Conquest for C64 implemented in JavaScript"
        }],
        ["input$submit", {
          type: "submit",
          value: "Clone"
        }],
        ["label$label"],
        ["progress$progress", {css: {display: "none"}}]
      ]
    ], $);
    function submit(evt) {
      evt.preventDefault();
      if (working) return;
      working = true;
      $.submit.setAttribute("disabled", true);
      $.progress.style.display = null;
      backend.addRepo({
        hostname: this.hostname.value,
        pathname: this.pathname.value,
        description: this.description.value
      }, function (label, value, max) {
        $.label.textContent = label;
        $.progress.setAttribute("max", max);
        $.progress.setAttribute("value", value);
      }, function (err, repo) {
        if (err) throw err;
        ui.pop();
        ui.pop();
        backend.getRepos(function (err, repos) {
          if (err) throw err;
          ui.push(repoList(repos));
        });
      });
    }
  }

  function historyList(repo, stream) {
    var $ = {};
    var first = true;
    var chunkSize = 9;
    var root = domBuilder(["section.page",
      ["header",
        ["button.back", {onclick: ui.pop}, "❰"],
        ["h1", repo.name]
      ],
      ["ul$ul.content.header",
        ["li$li", "Loading..."]
      ]
    ], $);
    enqueue(true);
    return root;

    function enqueue(isFirst) {
      first = isFirst;
      var left = chunkSize;
      stream.read(onRead);
      function onRead(err, commit) {
        if (err) throw err;
        if (commit === undefined) {
          $.ul.removeChild($.li);
          return;
        }
        var title = truncate(commit.message, 80);
        append(title, commit);
        if (--left) return stream.read(onRead);
        appendMore();
      }
    }

    function append(title, commit) {
      var list = [
        ["li", { href:"#", onclick: onclick(load, commit) },
          [".icon.right", "❱"],
          ["p", title],
          ["p", commit.hash]
        ],
        ["li$li", "Loading..."]
      ];
      $.ul.removeChild($.li);
      $.ul.appendChild(domBuilder(list, $));
      if (!first) $.ul.scrollTop = $.ul.scrollHeight;
    }

    function appendMore() {
      var list = ["li$li",{ href:"#", onclick: onclick(enqueue) },
        ["p", "Load More..."]
      ];
      $.ul.removeChild($.li);
      $.ul.appendChild(domBuilder(list, $));
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
      ["form.content.header", {onsubmit: prevent}, details]
    ];
    details.push(
      ["label", "Message"],
      ["p", {css:{whiteSpace:"pre-wrap"}}, commit.message]);
    details.push(
      ["label", "Tree"],
      ["button.recommend", {onclick: enter}, commit.tree]);
    if (commit.parents) {
      details.push(["label",
        "Parent" + (commit.parents.length === 1 ? "" : "s")
      ]);
      commit.parents.forEach(function (parent) {
        details.push(["button", {onclick: ascend(parent)}, parent]);
      });
    }
    details.push(
      ["label", "Author"],
      ["p", commit.author]);
    if (commit.author !== commit.committer) {
      details.push(
        ["label", "Committer"],
        ["p", commit.committer]);
    }
    details.push(
      ["label", "Hash"],
      ["button", {disabled:true}, commit.hash]);

    return domBuilder(body);

    function prevent(evt) {
      evt.preventDefault();
    }

    function enter() {
      backend.getTree(repo, commit.tree, function (err, tree) {
        if (err) throw err;
        ui.push(filesList(repo, tree));
      });
    }

    function ascend(parent) {
      return function () {
        backend.getCommit(repo, parent, function (err, commit) {
          if (err) throw err;
          ui.peer(commitPage(repo, commit));
        });
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


};

