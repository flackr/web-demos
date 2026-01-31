(() => {
  const slideshows = document.querySelectorAll('.slideshow > .scroller');
  let i = 0;
  for (const scroller of slideshows) {
    ++i;
    let j = 0;
    for (let child = scroller.firstElementChild; child; child = child.nextElementSibling) {
      ++j;
      if (!child.id) {
        child.id = slideshows.length > 1 ? `${i}-${j}` : `${j}`;
      }
    }
    scroller.addEventListener('scrollsnapchanging', (evt) => {
      const slide = evt.snapTargetInline || evt.snapTargetBlock;
      if (slide && slide.id) {
        history.replaceState(null, '', `#${slide.id}`);
      }
    })
  }
  if (window.location.hash) {
    const slide = document.getElementById(window.location.hash.substring(1));
    if (slide) {
      slide.scrollIntoView({behavior: 'instant'});
    }
  }
})();