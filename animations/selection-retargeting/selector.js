'use strict';

document.addEventListener('DOMContentLoaded', init);

function init() {
  // Add event listeners
  let selector = document.querySelector('.selector');
  function handleClick(evt) {
    let sibling = evt.target;
    while (sibling.parentElement != selector.parentElement)
    	sibling = sibling.parentElement;
    let x = sibling.offsetLeft;
    let y = sibling.offsetTop;
    selector.animate([{transform: `translate(${x}px, ${y}px)`}], {duration: 1000, fill: 'forwards'});
  }
  
  for (let item of document.querySelectorAll('.grid > div')) {
    item.addEventListener('click', handleClick);
  }
}
