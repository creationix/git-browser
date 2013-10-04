var domBuilder = require('dombuilder');
var progressParser = require('../lib/progress-parser.js');
var ui = require('./ui.js');
var prism = require('../prism/prism-core.js');
require('../prism/prism-javascript.js');
require('../prism/prism-c.js');
require('../prism/prism-bash.js');
require('../prism/prism-coffeescript.js');
require('../prism/prism-cpp.js');
require('../prism/prism-css-extras.js');
require('../prism/prism-markup.js');

// Patterns for different language mode names.
var modes = {
  javascript: /\.(?:js|json|webapp)$/i,
  css: /\.(?:css|less)$/i,
  // markup: /\.(?:xml|html|svg)$/i,
  bash: /\.sh$/i,
  c: /\.(?:h|c)$/i,
  cpp: /\.(?:cpp|cxx|hxx|h)$/i,
  coffeescript: /\.(?:cs|coffee)$/i,
};

var isText = /(?:\.(?:markdown|md|txt|html|svg|xml)|^(?:LICENSE|README|\.gitignore))$/i;

var isImage = /\.(?:png|jpg|jpeg|gif)$/i;

module.exports = function (backend) {
  ui.push(repoList(backend));
};

function repoList(backend) {
  var $ = {};
  var pending;
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
      ["li$li", { href: "#", onclick: onclick(fetch, repo, icon, $$) },
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
    repo.remove = function (callback) {
      backend.remove(repo, callback);
    };
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

  function fetch(repo, icon, $$) {
    var progress = $$.progress;
    var span = $$.span;
    var child = $$.li;
    pending = repo;

    return repo.getHead(function (err, head) {
      if (err) return ui.error(err);
      if (!head) return clone();
      return onFetch();
    });

    function clone() {
      child.classList.add("active");
      var old;
      repo.fetch(repo.remote, {
        onProgress: progressParser(function (message, num, max) {
          if (max) {
            progress.setAttribute("max", max);
            progress.setAttribute("value", num);
          }
          if (message !== old) {
            span.textContent = old = message;
          }
        })
      }, onFetch);

    }

    function onFetch(err) {
      if (err) {
        return repo.remove(function () {
          return ui.error(err);
        });
      }
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
      if (pending === repo) load(repo);
    }

  }

  function load(repo) {
    pending = null;
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
      var action;
      if (file.mode === 16384) {
        icon += "folder-empty";
        action = enterFolder;
      }
      else if (isImage.test(file.name)) {
        icon += "picture";
        action = loadImage;
      }
      else if (isText.test(file.name)) {
        icon += "doc-text";
        action = loadText;
      }
      else {
        var names = Object.keys(modes);
        for (var i = 0, l = names.length; i < l; ++i) {
          var name = names[i];
          var regexp = modes[name];
          if (regexp.test(file.name)) {
            icon += "doc-text";
            action = loadCode.bind(null, name);
            break;
          }
        }
      }
      if (!action) {
        icon += "doc";
        action = load;
      }
      return ["li", { href:"#", onclick: onclick(action, file) },
        [icon],
        (file.mode === 16384 ? [".icon.right.icon-right-open"] : []),
        ["p", file.name],
        ["p", file.hash]
      ];
    })]
  ]);

  function enterFolder(file) {
    return repo.loadAs("tree", file.hash, function (err, tree) {
      if (err) return ui.error(err);
      ui.push(filesList(repo, tree));
    });
  }

  function loadImage(file) {
    return repo.loadAs("blob", file.hash, function (err, blob) {
      if (err) return ui.error(err);
      ui.push(imagePage(file.name, blob));
    });
  }

  function loadCode(language, file) {
    return repo.loadAs("blob", file.hash, function (err, blob) {
      if (err) return ui.error(err);
      ui.push(codePage(file.name, blob, language));
    });
  }

  function loadText(file) {
    return repo.loadAs("blob", file.hash, function (err, blob) {
      if (err) return ui.error(err);
      ui.push(textPage(file.name, blob));
    });
  }

  function load(file) {
    console.log("TODO: load file");
  }
}

function codePage(filename, blob, language) {
  var code = "";
  for (var i = 0, l = blob.length; i < l; ++i) {
    code += String.fromCharCode(blob[i]);
  }
  var body = prism.parse(code, language);
  body[0] += ".content.header";

  return domBuilder(["section.page",
    ["header",
      ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
      ["h1", filename]
    ],
    body
  ]);
}

function textPage(filename, blob) {
  var text = "";
  for (var i = 0, l = blob.length; i < l; ++i) {
    text += String.fromCharCode(blob[i]);
  }
  return domBuilder(["section.page",
    ["header",
      ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
      ["h1", filename]
    ],
    ["pre.content.header", {css: {
      padding: "1rem",
      whiteSpace:"pre-wrap"
    }},
      ["code", text]
    ]
  ]);
}

function imagePage(filename, blob) {
  blob = new Blob([blob]);
  var url = window.URL.createObjectURL(blob);
  return domBuilder(["section.page",
    ["header",
      ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
      ["h1", filename],
    ],
    [".content.header", {css:{
      backgroundImage: "url(" + url + ")",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center"
    }}]
  ]);
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

