'use strict';

document.addEventListener('DOMContentLoaded', init);

function animateTo(element, x, y) {
  const transform = getComputedStyle(element).transform;
  let match = transform.match(/matrix\((.+)\)/);
  let from = [0, 0];
  if (match) {
    let components = match[1].split(',').map(str => parseFloat(str));
    from = [components[4], components[5]];
  }
  setupCustomTransform(element, from, [x, y]);
}

function setupCustomTransform(element, from, to) {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const d = Math.sqrt(dx * dx + dy * dy);
    const dx_max = window.innerWidth;
    const dy_max = window.innerHeight; 
    const d_max = Math.sqrt(dx_max * dx_max + dy_max * dy_max);
    const base_duration = 2000;
    const duration = Math.trunc(base_duration * (d / d_max));
    const anim = element.animate([{transform: `translate(${to[0]}px, ${to[1]}px)`}], 
                                 {duration: duration, fill: 'forwards'});
}

function init() {
  // Add event listeners
  let selector = document.querySelector('.selector');
  function handleClick(evt) {
    let sibling = evt.target;
    while (sibling.parentElement != selector.parentElement)
    	sibling = sibling.parentElement;
    let x = sibling.offsetLeft;
    let y = sibling.offsetTop;
    animateTo(selector, x, y);
  }
  
  for (let item of document.querySelectorAll('.grid > div')) {
    item.addEventListener('click', handleClick);
  }
}
