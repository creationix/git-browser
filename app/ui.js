var domBuilder = require('dombuilder');

var repos = [
  ["creationix",
    ["conquest", "A remake of the classic Lords of Conquest for C64 implemented in JavaScript"],
    ["dombuilder", "An easy dombuilder using json-ml style syntax"],
    ["js-git", "A JavaScript implementation of Git"],
    ["git-browser", "Browse Git Repos offline"],
    ["luv", "Bare libuv bindings for lua"],
    ["rec", "A tool for recording CLI programs and posting their output."],
  ],
  ["luvit",
    ["luvit", "Lua + libUV + jIT = pure awesomesauce"],
    ["kernel", "A simple async template language similair to dustjs and mustache (ported from c9/kernel)"],
  ]
];

var commits = [
  ["May 27, 2013",
    ["39a63c86fed320e06c84af7cf311c38f4395ff00", "Add circle icon for web store"],
    ["edc154eab21edfcda42e2087dcba02eeffd6550d", "Convert to chrome app"],
  ],
  ["Apr 30, 2013",
    ["2a0008d86420559d2ebe1cf8962e92b31d75d73c", "Remove old launch script"],
  ],
  ["Aug 21, 2012",
    ["5d6eca688224279ffaaa8f3675521f00c6696936", "Add package.json to declare dependencies"],
  ],
  ["May 12, 2011",
    ["170ac70fd9f119c808eb860d7d76418544daf433", "Allow loading over file urls"],
  ],
  ["Apr 29, 2011",
    ["ac9582c7e108d09d61de6260d9fea7f3730a9fb3", "Fix for tablet"],
  ],
  ["Mar 21, 2011",
    ["5ea500d3c9415af778c6d3643244f6fdb27d4507", "Push changes"],
  ],
  ["Dec 10, 2010",
    ["2c55ff9bb056ea3a35cc001a08a8c1e8e4e71593", "Repair the client "],
    ["8c2cc497d857b09521b9aa4db42c67487938355d", "Fix file links"],
    ["b2b21570853202c742e23decde7c46611eb0c1f7", "Fix README"],
    ["76b17bf33955978d26c4464d4cce1be2c644cae7", "Initial commit"],
  ]
];

var trees = {
  "39a63c86fed320e06c84af7cf311c38f4395ff00": [
    [100644, "blob", "38f211d3325f524b74ef076c3569a57b92dbda57", ".gitignore"],
    [100644, "blob", "461a5bdb83746a7e3f8449bc009574b92f6e6dd0", "README.markdown"],
    [100644, "blob", "8a48e7ace978047bfff982a4e2aca2f502acaa71", "appinfo.json"],
    [040000, "tree", "b3f8efa73bfac690b386a7f92c9d54eb6b40f359", "art"],
    [100644, "blob", "8b017f72578016c876de8e95265af2657b6a400c", "background.js"],
    [100644, "blob", "28555e7055d7fa6184865bd3bab090621cf14cc5", "client.js"],
    [040000, "tree", "ad157cf510e280ccfb7af63955c5a9eb5a4dfd53", "icons"],
    [100644, "blob", "4e2ff86c954e4f02845524ba408da1782a140ad4", "index.html"],
    [100644, "blob", "8d572631af9ba044c4f07c57cb417c7d9de41b48", "manifest.json"],
    [040000, "tree", "8cdfe297492d361098f0ca85596caf220623da6c", "maps"],
    [040000, "tree", "7deb4e389c162420b612d41ef9343502d4bc10ef", "resources"],
    [100644, "blob", "58aac45ba0d3c2829df074f58d801b6ff8e4641b", "utils.js"],
  ]
};


document.body.textContent = "";
var $ = {};
document.body.appendChild(domBuilder([
  ["section$index.current", {"data-position":"current",role:"region"},
    ["header.fixed",
      ["menu", {type:"toolbar"},
        ["a", {href:"#",onclick:edit},
          ["span.icon icon-edit", "edit"]
        ],
        ["a", {href:"#",onclick:add},
          ["span.icon icon-add", "add"]
        ]
      ],
      ["h1", "Git Repositories"]
    ],
    ["article.content.scrollable.header",
      ["section", {"data-type":"list"}, repos.map(function (pair) {
        return [
          ["header", pair[0]],
          ["ul", pair.slice(1).map(function (repo) {
            var url = {
              protocol: "git:",
              hostname: "github.com",
              port: 9418,
              pathname: pair[0] + "/" + repo[0] + ".git"
            };
            return ["li",
              ["a", {href:"#",onclick:left("index","history")},
                ["p", repo[0]],
                ["p", repo[1]],
                ["progress.pack-activity", {value:80,max:100}],
              ]
            ];
          })]
        ]
      })]
    ]
  ],

  ["section$history.right.skin-dark", {"data-position":"right",role:"region"},
    ["header.fixed",
      ["a", {href:"#",onclick:right("history", "index")},
        ["span.icon.icon-back", "back"]
      ],
      ["h1", "creationix/conquest"]
    ],
    ["article.content.scrollable.header",
      ["section", {"data-type":"list"}, commits.map(function (pair) {
        return [
          ["header", pair[0]],
          ["ul", pair.slice(1).map(function (commit) {
            return ["li",
              ["a", {href:"#",onclick:left("history","files")},
                ["p", commit[1]],
                ["p", commit[0]]
              ]
            ];
          })]
        ]
      })]
    ]
  ],
  ["section$files.right", {"data-position":"right",role:"region"},
    ["header.fixed",
      ["a", {href:"#",onclick:right("files", "history")},
        ["span.icon.icon-back", "back"]
      ],
      ["h1", "creationix/conquest"],
    ],
    ["article.content.scrollable.header",
      ["div", {"data-type": "list"},
        ["header", "39a63c86fed320e06c84af7cf311c38f4395ff00 /"],
        ["ul", trees["39a63c86fed320e06c84af7cf311c38f4395ff00"].map(function (file) {
          return ["li",
            ["a", {href:"#"},
              ["p", file[3]],
              ["p", file[2]]
            ]
          ];
        })]
      ]
    ]
  ]
], $))

function left(current, next) {
  return function (evt) {
    evt.preventDefault();
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
  return function (evt) {
    evt.preventDefault();
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

function edit(evt) {
  evt.preventDefault();

}

function add(evt) {
  evt.preventDefault();

}
