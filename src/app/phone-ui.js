var domBuilder = require('dombuilder');
var progressParser = require('../lib/progress-parser.js');
var ui = require('./ui.js');

module.exports = function (backend) {
  ui.push(repoList(backend));
  backend.add({
    name: "creationix/conquest",
    url: "git://github.com/creationix/conquest.git",
    description: "A remake of the classic Lords of Conquest for C64 implemented in JavaScript"
  }, check);
  backend.add({
    name: "creationix/jack",
    url: "https://github.com/creationix/jack.git",
  }, check);
  backend.add({
    name: "creationix/js-git",
    url: "http://github.com/creationix/js-git.git",
    description: "A JavaScript implementation of Git."
  }, check);
  function check(err) {
    if (err) throw err;
  }
};

function repoList(backend) {
  var $ = {};
  var children = {};
  backend.init(onAdd, onRemove, onReady);

  return domBuilder(["section.page$page", {"data-position": "none", css: {opacity: 0.5}},
    ["header",
      ["button", {onclick:onclick(add)}, [".icon-plus"]],
      ["h1", "Git Repositories"]
    ],
    ["ul.content.header$list"]
  ], $);

  function onAdd(repo) {
    var icon = ".icon.left.icon-";
    if (/github\.com/.test(repo.url)) {
      icon += "github";
    }
    else if (/bitbucket\.org/.test(repo.url)) {
      icon += "bitbucket";
    }
    else {
      icon += "git";
    }
    var $$ = {};
    var child = domBuilder(
      ["li.active",
        [icon],
        ["p", repo.name],
        ["p", repo.description],
        ["p.progress",
          ["progress$progress"], ["span$span", "Working..."]
        ],
      ], $$
    );
    children[repo.name] = child;
    $.list.appendChild(child);
    repo.remove = remove;

    var progress = $$.progress;
    var span = $$.span;
    repo.fetch(repo.remote, {
      onProgress: progressParser(function (message, num, max) {
        progress.setAttribute("max", max);
        progress.setAttribute("value", num);
        span.textContent = message;
      })
    }, function (err) {
      if (err) return ui.error(err);
      var oldChild = child;
      child = domBuilder(
        ["li", { href:"#", onclick: onclick(load, repo) },
          [icon],
          [".icon.right.icon-right-open"],
          ["p", repo.name],
          ["p", repo.description]
        ]
      );
      children[repo.name] = child;
      $$ = null;
      $.list.replaceChild(child, oldChild);
    });

    function remove(callback) {
      backend.remove(repo, callback);
    }
  }

  function onRemove(meta) {
    var child = children[meta.name];
    delete children[meta.name];
    $.list.removeChild(child);
  }

  function onReady(err) {
    if (err) return ui.error(err);
    $.page.style.opacity = 1;
  }

  function load(repo) {
    repo.logWalk("HEAD", function (err, stream) {
      if (err) return ui.error(err);
      ui.push(historyList(repo, stream));
    });
  }

  function add() {
    ui.push(addPage(backend));
  }

}

function addPage(backend) {
  var $ = {};
  var working = false;
  return domBuilder(["section.page",
    ["header",
      ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
      ["h1", "Add Repository"]
    ],
    ["form.content.header", {onsubmit: submit},
      ["label", {"for": "url"}, "Remote Url"],
      ["input", {
        type: "text",
        name: "url",
        placeholder: "Enter git url here",
        value: "git://github.com/creationix/conquest.git",
        required: true
      }],
      ["label", {"for": "name"}, "Name"],
      ["input", {
        type: "text",
        name: "name",
        placeholder: "Enter custom local name here",
      }],
      ["label", {"for": "description"}, "Description"],
      ["input", {
        type: "text",
        name: "description",
        placeholder: "Enter a short description here",
      }],
      ["input$submit", {
        type: "submit",
        value: "Add Repo"
      }]
    ]
  ], $);
  function submit(evt) {
    evt.preventDefault();
    if (working) return;
    working = true;
    var url = this.url.value;
    var name = this.name.value;
    if (!name) {
      var index = url.lastIndexOf("/");
      name = url.substr(index + 1);
      if (/\.git$/.test(name)) {
        name = name.substr(0, name.length - 4);
      }
    }
    var description = this.description.value;
    return backend.add({
      name: name,
      url: url,
      description: description
    }, onRepo);

    function onRepo(err) {
      working = false;
      if (err) return ui.error(err);
      return ui.pop();
    }
  }
}

function historyList(repo, stream) {
  var $ = {}, ul, end, reading = false;
  var root = domBuilder(["section.page",
    ["header",
      ["button", {onclick:onclick(remove)}, [".icon-minus"]],
      ["button", {onclick:onclick(update)}, [".icon-download"]],
      ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
      ["h1", repo.name]
    ],
    ["ul$ul.content.header",
      ["li$li", {css:{height: "100px"}}, "Loading..."]
    ]
  ], $);
  ul = $.ul;
  end = $.li;
  $ = {};
  ul.addEventListener('scroll', check, false);
  window.addEventListener('resize', check, false);
  setImmediate(function () {
    reading = true;
    stream.read(onRead);
  });
  return root;

  function remove() {
    ui.confirm("Are you sure you want to delete this local repo?", function (res) {
      if (!res) return;
      repo.remove(function (err) {
        if (err) return ui.error(err);
        ui.pop();
      });
    });
  }

  function update() {
    ui.error("TODO: Implement update");
  }

  function load(commit) {
    ui.push(commitPage(repo, commit));
  }

  function onRead(err, commit) {
    reading = false;
    if (err) return ui.error(err);
    if (commit === undefined) {
      ul.removeChild(end);
      end = null;
      ul.removeEventListener('scroll', check, false);
      window.removeEventListener('resize', check, false);
      return;
    }
    var title = truncate(commit.message, 80);
    var item = domBuilder(
      ["li", { href:"#", onclick: onclick(load, commit) },
        [".icon.right.icon-right-open", { title: commit.hash }],
        ["p", title],
        ["p", commit.author.date]
      ]
    );
    ul.insertBefore(item, end);
    check();
  }

  function check() {
    if (reading) return;
    console.log({
      otop: end.offsetTop,
      uHeight: ul.offsetHeight,
      uTop: ul.scrollTop
    })
    if (end.offsetTop > ul.offsetHeight + ul.scrollTop) return;
    reading = true;
    stream.read(onRead);
  }

}

function commitPage(repo, commit) {
  var details = [];
  var body = ["section.page",
    ["header",
      ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
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
    ["p", commit.author.name + " <" + commit.author.email + "> " + commit.author.date]);
  if (commit.author.email !== commit.committer.email) {
    details.push(
      ["label", "Committer"],
      ["p", commit.committer.name + " <" + commit.committer.email + "> " + commit.committer.date]);
  }
  details.push(
    ["label", "Hash"],
    ["button", {disabled:true}, commit.hash]);

  return domBuilder(body);

  function prevent(evt) {
    evt.preventDefault();
  }

  function enter() {
    repo.loadAs("tree", commit.tree, function (err, tree) {
      if (err) return ui.error(err);
      ui.push(filesList(repo, tree));
    });
  }

  function ascend(parent) {
    return function () {
      repo.loadAs("commit", parent, function (err, commit) {
        if (err) return ui.error(err);
        ui.peer(commitPage(repo, commit));
      });
    };
  }
}

function filesList(repo, tree) {
  return domBuilder(["section.page",
    ["header",
      ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
      ["h1", repo.name]
    ],
    ["ul.content.header", tree.map(function (file) {
      var icon = ".icon.left.icon-";
      if (file.mode === 16384) {
        icon += "folder-empty";
      }
      else {
        icon += "doc";
      }

      return ["li", { href:"#", onclick: onclick(load, file) },
        [icon],
        (file.mode === 16384 ? [".icon.right.icon-right-open"] : []),
        ["p", file.name],
        ["p", file.hash]
      ];
    })]
  ]);
  function load(file) {
    if (file.mode === 16384) {
      return repo.loadAs("tree", file.hash, function (err, tree) {
        if (err) return ui.error(err);
        ui.push(filesList(repo, tree));
      });
    }
    console.log("TODO: load file");
  }
}

function truncate(message, limit) {
  var title = message.split(/[\r\n]/)[0];
  if (title.length > limit) title = title.substr(0, limit - 3) + "...";
  return title;
}



function onclick(handler) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    return handler.apply(this, args);
  };
}

