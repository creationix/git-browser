// Generate domBulder JSON for a header
// options.title, the title of the page
// options.back, a callback for the back button
// options.actions, a hash of toolbar actions
//   key is icon name, value is callback
exports.header = header;
// Generate domBuilder JSON for a list
// groups is hash of title and items
exports.groupedList = groupedList;
// Generate domBuilder JSON for a flast list
// items is an array of item objects
exports.list = list;
// Generate a page
// options.skin (dark, organic, etc...)
// options.body JSON content for body.
exports.page = page;
// Push a new page onto the navigation
exports.push = push;
// Pop the top page from the navigation
exports.pop = pop;
// Swap the current page with another
exports.peer = peer;

document.body.textContent = "";
var pages = [];

function push(next) {
  var current = pages.length && pages[pages.length - 1];
  if (current) {
    current.classList.remove("current");
    current.classList.add("left");
  }
  pages.push(next);
  next.setAttribute("data-position", "right");
  next.classList.remove("right");
  next.classList.add("current");
  document.body.appendChild(next);
  setTimeout(function () {
    if (current) {
      current.setAttribute("data-position", "left");
    }
    next.setAttribute("data-position", "current");
  }, 400);
}

function pop() {
  if (!pages.length) return;
  var current = pages.pop();
  var previous = pages.length && pages[pages.length - 1];
  current.classList.remove("current");
  current.classList.add("right");
  if (previous) {
    previous.classList.remove("left");
    previous.classList.add("current");
  }
  setTimeout(function () {
    document.body.removeChild(current);
    if (previous) {
      previous.setAttribute("data-position", "current");
    }
  }, 400);
}

function peer(next) {
  // TODO: make this prettier
  pop();
  push(next);
}

function page(body, skin) {
  var opts = {role:"region"};
  if (skin) opts.class = "skin-" + skin;
  return ["section", opts, body];
}

function header(options) {
  var header = ["header.fixed"];
  if (options.back) {
    header.push(["a", {href:"#", onclick: wrap(options, options.back)},
      ["span.icon.icon-back", "back"]
    ]);
  }
  if (options.actions) {
    header.push(["menu", {type: "toolbar"},
      map(options.actions, function (name, action) {
        return ["a", {href:"#", onclick: wrap(options, action)},
          ["span", {class: name}]
        ];
      })
    ]);
  }
  if (options.title) {
    header.push(["h1", options.title]);
  }
  if (options.sub) {
    header.push(["h2", options.sub]);
  }
  return header;
}

function groupedList(groups, onclick) {
  return ["article.content.scrollable.header",
    ["section", {"data-type": "list"}, map(groups, listGroup, onclick)]
  ];
}

// Name is group heading, items is list of item objects.
function listGroup(name, items, onclick) {
  return [
    ["header", name],
    ["ul", arrMap(items, listItem, onclick)]
  ];
}

function list(items, onclick) {
  console.log("list", items, onclick)
  return ["article.content.scrollable.header",
    ["ul", {"data-type": "list"},
      arrMap(items, listItem, onclick)
    ]
  ];
}

// item.title - main title
// item.subtitle - subtitle
// item.onclick - click action
function listItem(item, onclick) {
  var line = [];
  if (item.icon) {
    line.push(["aside",
      ["span", {class:item.icon}]
    ]);
  }
  if (item.iconRight) {
    line.push(["aside.pack-end",
      ["span", {class:item.iconRight}]
    ]);
  }
  line.push(["p", item.title]);
  if (item.sub) {
    line.push(["p", item.sub]);
  }
  if (onclick) {
    line = ["a", {href:"#",onclick: wrap(item, onclick)}, line];
  }
  line = ["li", line];
  return line;
}

// Wrap a callback so that it auto-prevents default and is in scope.
function wrap(obj, fn) {
  return function (evt) {
    evt.preventDefault();
    return fn.apply(obj, obj.data || []);
  };
}

function arrMap(arr, callback, extra) {
  var length = arr.length;
  var result = new Array(length);
  for (var i = 0; i < length; i++) {
    result[i] = callback(arr[i], extra);
  }
  return result;
}

function map(obj, callback, extra) {
  var keys = Object.keys(obj);
  var result = [];
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    result.push(callback(key, obj[key], extra));
  }
  return result;
}
