function initialize() {
  const viewer = document.querySelector('.viewer');  
  const scroller = document.querySelector('.scroller');
  
  /* Snapping to the first or last element should immediately cycle to other end. */
  scroller.addEventListener('scrollsnapchanging', (evt) => {
    const target = evt.snapTargetInline;
    if (!target) {
      return;
    }
    let scrollTarget = null;
    if (!target.previousElementSibling) {
      scrollTarget = target.parentElement.lastElementChild.previousElementSibling;
    } else if (!target.nextElementSibling) {
      scrollTarget = target.parentElement.firstElementChild.nextElementSibling;
    }
    if (scrollTarget) {
      scroller.scrollLeft = scrollTarget.offsetLeft;
    }
  });
  
  /* Auto advance on animation end. */
  viewer.addEventListener('animationend', (evt) => {
    // Only listen for the marker fill in animation.
    if (evt.animationName !== 'marker-fill-in')
      return;
    // Navigate to the next slide.
    scroller.scrollBy({left: 1});
  });

  /* Log interactions with scroll buttons and scroll markers. */
  scroller.addEventListener('click', (evt) => {
    let target = evt.target;
    // Currently the pseudoElement is given as the event target (https://issues.chromium.org/420463805)
    // but it shouldn't be. For now we work around this to demonstrate how you can hit test the pseudo
    // without this.
    if (target.tagName.startsWith('::')) {
      target = target.parentElement;
    }
    const hittest = (elem, selector) => {
      elem.classList.add(selector);
      const hit = realElementFromPoint(evt.pageX, evt.pageY) == elem;
      elem.classList.remove(selector);
      return hit;
    }
    let hitPseudo = '';
    if (target == scroller) {
      if (hittest(target, 'hit-test-scroll-button-left'))
        hitPseudo = '::scroll-button(left)';
      else if (hittest(target, 'hit-test-scroll-button-right'))
        hitPseudo = '::scroll-button(right)';
    } else if (target.classList.contains('tabpanel') && hittest(target, 'hit-test-scroll-marker')) {
        hitPseudo = '::scroll-marker';
    }
    console.log('Click on ' + elementSelector(target) + hitPseudo);
  });
}

function realElementFromPoint(x, y) {
  let elem = document.elementFromPoint(x, y);
  // Currently the pseudoElement is returned by elementFromPoint (https://issues.chromium.org/420463805)
  // but it shouldn't be. For now we work around this to demonstrate how you can hit test the pseudo
  // without this.
  if (elem.tagName.startsWith('::'))
    elem = elem.parentElement;
  return elem;
}

// Helper function to generate a selector string for an element.
function elementSelector(elem) {
  const nth = (elem, selector) => {
  let matches = Array.prototype.slice.apply((elem.parentElement || document).querySelectorAll(`:scope > ${selector}`));
  if (matches.length == 1)
    return selector;
  let index = matches.indexOf(elem);
  return `${selector}:nth-of-type(${index + 1})`;
}
  const path = (elem, selector) => {
    if (document.querySelectorAll(selector).length == 1)
      return '';
    return `${elementSelector(elem.parentElement)} > `;
  }
  
  if (!elem) return ':root';
  if (elem.id)
    return `#${elem.id}`;
  let selector = '';
  if (elem.className) {
    selector = `.${elem.className.replace(' ', '.')}`;
  } else {
    selector = elem.tagName.toLowerCase();
  }
  return path(elem, selector) + nth(elem, selector);
}

initialize();