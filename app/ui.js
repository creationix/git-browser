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
          ["span", {class: "icon icon-" + name}, name]
        ];
      })
    ]);
  }
  if (options.title) {
    header.push(["h1", options.title]);
  }
  return header;
}

function groupedList(groups) {
  return ["article.content.scrollable.header",
    ["section", {"data-type": "list"}, map(groups, listGroup)]
  ];
}

// Name is group heading, items is list of item objects.
function listGroup(name, items) {
  return [
    ["header", name],
    ["ul", items.map(listItem)]
  ];
}

function list(items) {
  return ["article.content.scrollable.header",
    ["ul", {"data-type": "list"},
      items.map(listItem)
    ]
  ];
}

// item.title - main title
// item.subtitle - subtitle
// item.onclick - click action
function listItem(item) {
  var line = [["p", item.title]];
  if (item.sub) {
    line.push(["p", item.sub]);
  }
  if (item.onclick) {
    line = ["a", {href:"#",onclick: wrap(item, item.onclick)}, line];
  }
  return ["li", line];
}

// Simple helper to map over an object and return an array
function map(obj, callback) {
  var keys = Object.keys(obj);
  var result = [];
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    result.push(callback(key, obj[key]));
  }
  return result;
}

// Wrap a callback so that it auto-prevents default and is in scope.
function wrap(obj, fn) {
  return function (evt) {
    evt.preventDefault();
    return fn.call(obj);
  };
}
