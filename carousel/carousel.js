function init() {
  for (let carousel of document.querySelectorAll('carousel')) {
    let targets = Array.prototype.slice.call(carousel.querySelectorAll('.pseudo-marker'));
    let pages = carousel.querySelectorAll('.pseudo-page');
    carousel.addEventListener('input', (evt) => {
      let index = targets.indexOf(evt.target);
      if (index == -1)
        return;
      evt.preventDefault();
      pages[index].scrollIntoView();
    });
    let scroller = carousel.querySelector('.pseudo-grid-flow-scroller');
    let next = carousel.querySelector('.pseudo-next');
    let prev = carousel.querySelector('.pseudo-previous');
    if (next) {
      next.addEventListener('click', () => {
        scroller.scrollBy({left: 1, behavior: 'smooth'});
      })
    }
    if (prev) {
      prev.addEventListener('click', () => {
        scroller.scrollBy({left: -1, behavior: 'smooth'});
      })
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
