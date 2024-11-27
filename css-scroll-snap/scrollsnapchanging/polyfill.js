const originalAddEventListener = Element.prototype.addEventListener;
const originalRemoveEventListener = Element.prototype.removeEventListener;
const originalScrollIntoView = Element.prototype.scrollIntoView;

function getScroller(el) {
  el = el.parentElement;
  while (el && ['visible', 'clip'].indexOf(getComputedStyle(el).overflowX) != -1)
    el = el.parentElement;
  return el || document.scrollingElement;
}

function scrollOffset(el) {
  let offset = [0, 0];
  const scroller = getScroller(el);
  while(el && el != scroller) {
    offset[0] += el.offsetLeft;
    offset[1] += el.offsetTop;
    el = el.offsetParent;
  }
  return offset;
}

// Note: Assume center alignment.
function alignedOffset(item) {
  const scroller = getScroller(item);
  const offset = scrollOffset(item);
  return [
    offset[0] + item.offsetWidth / 2 - scroller.clientWidth / 2,
    offset[1] + item.offsetHeight / 2 - scroller.clientHeight / 2,
  ];
}

function dist(p1, p2) {
  return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}

Element.prototype.scrollIntoView = function(options) {
  const scroller = getScroller(this);
  scroller.scrollTarget = this;
  originalScrollIntoView.apply(this, arguments);
}

let scrollListener = (evt) => {
  const scroller = evt.target;
  const cur = [scroller.scrollLeft, scroller.scrollTop];
  const last = scroller.last;
  if (last && scroller.scrollTarget) {
    const desired = alignedOffset(scroller.scrollTarget);
    if (dist(desired, last) < dist(desired, cur)) {
      scroller.scrollTarget = null;
    }
  }
  let closest = null;
  let closestDist = 0;
  let snapTargets = scroller.querySelectorAll('*');
  for (let snapTarget of snapTargets) {
    if (getComputedStyle(snapTarget).scrollSnapAlign == 'none')
      continue;
    let d = dist(alignedOffset(snapTarget), cur);
    if (closest == null || d < closestDist) {
      closestDist = d;
      closest = snapTarget;
    }
  }
  let target = scroller.scrollTarget || closest;

  if (scroller.lastTarget != target) {
    scroller.lastTarget = target;
    dispatch(scroller, scroller.listeners['scrollsnapchanging-targeted'], {snapTargetInline: target});
  }
  if (scroller.lastClosest != closest) {
    scroller.lastClosest = closest;
    dispatch(scroller, scroller.listeners['scrollsnapchanging-current'], {snapTargetInline: closest});
  }
  scroller.last = cur;
}

function dispatch(target, list, evt) {
  if (!list)
    return;
  for (let l of list) {
    l.apply(target, [evt]);
  }
}

Element.prototype.addEventListener = function(name, fn, options = {}) {
  if (name != 'scrollsnapchanging' || options.behavior == 'native') {
    originalAddEventListener.apply(this, arguments);
    return;
  }
  if (!this.scrollListener) {
    this.scrollListener = true;
    this.addEventListener('scroll', scrollListener);
  }
  this.listeners = this.listeners || {};
  const mapName = name + '-' + options.behavior;
  this.listeners[mapName] = this.listeners[mapName] || [];
  this.listeners[mapName].push(fn);
}
Element.prototype.removeEventListener = function(name, fn, options = {}) {
  if (name != 'scrollsnapchanging' || options.behavior == 'native') {
    originalRemoveEventListener.apply(this, arguments);
    return;
  }
  const mapName = name + '-' + options.behavior;
  this.listeners[mapName].splice(this.listeners[mapName].indexOf(fn));
}
