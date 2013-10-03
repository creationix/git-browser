var domBuilder = require('dombuilder');
var progressParser = require('./progress-parser.js');
var ui = require('./ui.js');
module.exports = function (backend) {

////////////////////////////////////////////////////////////////////////////////
  var metaDb = backend.db("__meta__");
  var repos;

  // Get the repos metadata for the app.
  // Call this before reading the repos list.
  function getRepos(callback) {
    if (repos) return callback(null, repos);
    return metaDb.load("repos", function (err, json) {
      if (err) return callback(err);
      if (!json) {
        repos = [];
        return callback(null, repos);
      }
      try {
        repos = JSON.parse(json);
      }
      catch (err) {
        return callback(err);
      }
      return callback(null, repos);
    });
  }

  // Save the repos metadata for the app.
  // Call this after changing the repos list.
  function saveRepos(callback) {
    if (!repos) return callback();
    var json;
    try {
      json = JSON.stringify(repos);
    }
    catch (err) {
      return callback(err);
    }
    return metaDb.save("repos", repos, callback);
  }

////////////////////////////////////////////////////////////////////////////////

  getRepos(function (err, repos) {
    if (err) return ui.error(err);
    ui.push(repoList(repos));
  });

  function onclick(handler) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      return handler.apply(this, args);
    };
  }

  function repoList(repos) {
    return domBuilder(["section.page", {"data-position": "none"},
      ["header",
        ["button", {onclick:onclick(add)}, [".icon-plus"]],
        ["h1", "Git Repositories"]
      ],
      ["ul.content.header", repos.map(function (repo) {
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
        return [
          ["li", { href:"#", onclick: onclick(load, repo) },
            [icon],
            [".icon.right.icon-right-open"],
            ["button.right", {onclick: onclick(fetch, repo)}, [".icon-download"]],
            ["p", repo.name],
            ["p", repo.description],
            ["p.progress",
              ["progress"], ["span", "Working..."]
            ],
          ]
        ];
      })]
    ]);

    function fetch(repo) {
      var button = this;
      var li = button.parentNode;
      var progress = li.querySelector(".progress progress");
      var span = li.querySelector(".progress span");
      li.classList.add("active");
      button.setAttribute("disabled", "disabled");
      var remote = backend.remote(repo.url);
      repo.fetch(remote, {
        onProgress: progressParser(function (message, num, max) {
          progress.setAttribute("max", max);
          progress.setAttribute("value", num);
          span.textContent = message;
        })
      }, function (err) {
        button.setAttribute("disabled", "");
        li.classList.remove("active");
        if (err) return ui.error(err);
      });

    }

    function load(repo) {
      repo.logWalk("HEAD", function (err, stream) {
        if (err) return ui.error(err);
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
        ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
        ["h1", "Clone Repository"]
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
      var label = "", value, max;
      var repo, remote, interval;
      var url = this.url.value;
      var name = this.name.value;
      if (!name) {
        var index = url.lastIndexOf("/");
        name = url.substr(index + 1);
        if (/\.git$/.test(name)) {
          name = name.substr(0, name.length - 4);
        }
      }
      var description = this.description.value || url;
      try {
        remote = backend.remote(url);
      } catch (err) {
        working = false;
        return ui.error(err);
      }
      return backend.createRepo({
        url: url,
        name: name,
        description: description
      }, onRepo);

      function onRepo(err) {
        if (err) {
          working = false;
          return ui.error(err);
        }
        ui.pop();
        ui.pop();
        backend.listRepos(function (err, repos) {
          if (err) return ui.error(err);
          ui.push(repoList(repos));
        });
      }
    }
  }

  // function historyList(repo, stream) {
  //   var $ = {};
  //   var first = true;
  //   var chunkSize = 9;
  //   var root = domBuilder(["section.page",
  //     ["header",
  //       ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
  //       ["h1", repo.name]
  //     ],
  //     ["ul$ul.content.header",
  //       ["li$li", "Loading..."]
  //     ]
  //   ], $);
  //   enqueue(true);
  //   return root;

  //   function enqueue(isFirst) {
  //     first = isFirst;
  //     var left = chunkSize;
  //     stream.read(onRead);
  //     function onRead(err, commit) {
  //       if (err) return ui.error(err);
  //       if (commit === undefined) {
  //         $.ul.removeChild($.li);
  //         return;
  //       }
  //       var title = truncate(commit.message, 80);
  //       append(title, commit);
  //       if (--left) return stream.read(onRead);
  //       appendMore();
  //     }
  //   }

  //   function append(title, commit) {
  //     var list = [
  //       ["li", { href:"#", onclick: onclick(load, commit) },
  //         [".icon.right.icon-right-open"],
  //         ["p", title],
  //         ["p", commit.hash]
  //       ],
  //       ["li$li", "Loading..."]
  //     ];
  //     $.ul.removeChild($.li);
  //     $.ul.appendChild(domBuilder(list, $));
  //     if (!first) $.ul.scrollTop = $.ul.scrollHeight;
  //   }

  //   function appendMore() {
  //     var list = ["li$li",{ href:"#", onclick: onclick(enqueue) },
  //       ["p", "Load More..."]
  //     ];
  //     $.ul.removeChild($.li);
  //     $.ul.appendChild(domBuilder(list, $));
  //   }

  //   function load(commit) {
  //     ui.push(commitPage(repo, commit));
  //   }
  // }

  // function commitPage(repo, commit) {
  //   var details = [];
  //   var body = ["section.page",
  //     ["header",
  //       ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
  //       ["h1", repo.name]
  //     ],
  //     ["form.content.header", {onsubmit: prevent}, details]
  //   ];
  //   details.push(
  //     ["label", "Message"],
  //     ["p", {css:{whiteSpace:"pre-wrap"}}, commit.message]);
  //   details.push(
  //     ["label", "Tree"],
  //     ["button.recommend", {onclick: enter}, commit.tree]);
  //   if (commit.parents) {
  //     details.push(["label",
  //       "Parent" + (commit.parents.length === 1 ? "" : "s")
  //     ]);
  //     commit.parents.forEach(function (parent) {
  //       details.push(["button", {onclick: ascend(parent)}, parent]);
  //     });
  //   }
  //   console.log(commit);
  //   details.push(
  //     ["label", "Author"],
  //     ["p", commit.author.name + " <" + commit.author.email + "> " + commit.author.date]);
  //   if (commit.author.email !== commit.committer.email) {
  //     details.push(
  //       ["label", "Committer"],
  //       ["p", commit.committer.name + " <" + commit.committer.email + "> " + commit.committer.date]);
  //   }
  //   details.push(
  //     ["label", "Hash"],
  //     ["button", {disabled:true}, commit.hash]);

  //   return domBuilder(body);

  //   function prevent(evt) {
  //     evt.preventDefault();
  //   }

  //   function enter() {
  //     repo.loadAs("tree", commit.tree, function (err, tree) {
  //       if (err) return ui.error(err);
  //       ui.push(filesList(repo, tree));
  //     });
  //   }

  //   function ascend(parent) {
  //     return function () {
  //       repo.loadAs("commit", parent, function (err, commit) {
  //         if (err) return ui.error(err);
  //         ui.peer(commitPage(repo, commit));
  //       });
  //     };
  //   }
  // }

  // function filesList(repo, tree) {
  //   return domBuilder(["section.page",
  //     ["header",
  //       ["button.back", {onclick: ui.pop}, [".icon-left-open"]],
  //       ["h1", repo.name]
  //     ],
  //     ["ul.content.header", tree.map(function (file) {
  //       var icon = ".icon.left.icon-";
  //       if (file.mode === 16384) {
  //         icon += "folder-empty";
  //       }
  //       else {
  //         icon += "doc";
  //       }

  //       return ["li", { href:"#", onclick: onclick(load, file) },
  //         [icon],
  //         (file.mode === 16384 ? [".icon.right.icon-right-open"] : []),
  //         ["p", file.name],
  //         ["p", file.hash]
  //       ];
  //     })]
  //   ]);
  //   function load(file) {
  //     if (file.mode === 16384) {
  //       return repo.loadAs("tree", file.hash, function (err, tree) {
  //         if (err) return ui.error(err);
  //         ui.push(filesList(repo, tree));
  //       });
  //     }
  //     console.log("TODO: load file");
  //   }
  // }

  // function truncate(message, limit) {
  //   var title = message.split(/[\r\n]/)[0];
  //   if (title.length > limit) title = title.substr(0, limit - 3) + "...";
  //   return title;
  // }


};

