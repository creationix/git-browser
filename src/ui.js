exports.push = push;
exports.pop = pop;
exports.peer = peer;

document.body.textContent = "";
var pages = [];

function push(next) {
  next.addEventListener("animationend", onAnimationEnd, false);
  next.addEventListener("webkitAnimationEnd", onAnimationEnd, false);

  var current = pages.length && pages[pages.length - 1];
  if (current) {
    current.classList.remove("current");
    current.classList.add("left");
  }
  pages.push(next);
  if (!next.getAttribute("data-position")) {
    next.setAttribute("data-position", "right");
  }
  next.classList.remove("right");
  next.classList.add("current");
  document.body.appendChild(next);
}

function pop() {
  if (!pages.length) return;
  var current = pages.pop();
  var previous = pages.length && pages[pages.length - 1];
  current.classList.remove("current");
  current.classList.remove("current");
  current.classList.add("right");
  if (previous) {
    previous.classList.remove("left");
    previous.classList.add("current");
  }
  setTimeout(function () {
    document.body.removeChild(current);
  }, 400);
}

function onAnimationEnd(evt) {
  var page = evt.target;
  var classList = page.classList;
  if (classList.contains("current")) {
    page.setAttribute("data-position", "current");
  }
  else if (classList.contains("left")) {
    page.setAttribute("data-position", "left");
  }
}

function peer(next) {
  // TODO: make this prettier
  pop();
  push(next);
}
