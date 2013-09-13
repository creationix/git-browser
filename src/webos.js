/*global PalmSystem */
var ui = require('./ui.js');
ui.push = push;
ui.pop = pop;
ui.peer = peer;
var pages = [];

require('./web.js');
PalmSystem.stageReady();

function removeClass(node, name) {
  var classes = node.getAttribute("class").split(" ");
  var index = classes.indexOf(name);
  if (index >= 0) classes.splice(index, 1);
  node.setAttribute("class", classes.join(" "));
}

function addClass(node, name) {
  var classes = node.getAttribute("class").split(" ");
  classes.push(name);
  node.setAttribute("class", classes.join(" "));
}

function push(next) {
  var current = pages.length && pages[pages.length - 1];
  if (current) {
    removeClass(current, "current");
    addClass(current, "left");
  }
  pages.push(next);
  if (!next.getAttribute("data-position")) {
    next.setAttribute("data-position", "right");
  }
  removeClass(next, "right");
  addClass(next, "current");
  document.body.appendChild(next);
  setTimeout(function () {
    if (current) {
      onAnimationEnd(current);
    }
    onAnimationEnd(next);
  }, 400);
}

function pop() {
  if (!pages.length) return;
  var current = pages.pop();
  var previous = pages.length && pages[pages.length - 1];
  removeClass(current, "current");
  addClass(current, "right");
  if (previous) {
    removeClass(previous, "left");
    addClass(previous, "current");
  }
  setTimeout(function () {
    if (previous) {
      onAnimationEnd(previous);
    }
    document.body.removeChild(current);
  }, 400);
}

function onAnimationEnd(page) {
  var classes = page.getAttribute("class").split(" ");

  if (classes.indexOf("current") >= 0) {
    page.setAttribute("data-position", "current");
  }
  else if (classes.indexOf("left") >= 0) {
    page.setAttribute("data-position", "left");
  }
}

function peer(next) {
  // TODO: make this prettier
  pop();
  push(next);
}
