const scroller = document.querySelector('.scroller');
const markers = Array.prototype.slice.apply(document.querySelectorAll('.scroll-marker'));
const sections = markers.map(marker => document.getElementById(marker.getAttribute('aria-details')));
const scrollStart = document.querySelector('.scroll-button.inline-start');
const scrollEnd = document.querySelector('.scroll-button.inline-end');

scroller.addEventListener('scrollsnapchanging', (evt) => {
  setSection(evt.snapTargetInline);
});
function forAllChildren(elem, fn) {
  fn(elem);
  for (const child of elem.children) {
    forAllChildren(child, fn);
  }
}
function isFocusable(element) {
  // https://stackoverflow.com/a/30753870/76472
  const selector =
    'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),iframe,[tabindex],[contentEditable=true]';
  return element.matches(selector);
}
function setSection(section) {
  const sectionIndex = sections.indexOf(section);
  markers[sectionIndex].checked = true;
  for (const marker of markers) {
    if (marker.checked)
      marker.setAttribute('aria-selected', true);
    else
      marker.removeAttribute('aria-selected');
  }
  for (const otherSection of sections) {
    if (otherSection == section) continue;
    forAllChildren(otherSection, (elem) => {
      if (isFocusable(elem))
        elem.setAttribute('tabindex', -1);
    });
  }
  forAllChildren(section, (elem) => {
    if (elem.getAttribute('tabindex') == '-1')
      elem.removeAttribute('tabindex');
  });
}
// Set initial state.
setSection(sections[0]);

for (let i = 0; i < markers.length; i++) {
  markers[i].addEventListener('change', () => {
    if (markers[i].checked) {
      sections[i].scrollIntoView({behavior: 'smooth'});
    }
  });
}

scrollStart.addEventListener('click', () => {
  scroller.scrollBy({left: -scroller.clientWidth * 0.85, behavior: 'smooth'});
});
scrollEnd.addEventListener('click', () => {
  scroller.scrollBy({left: scroller.clientWidth * 0.85, behavior: 'smooth'});
});
