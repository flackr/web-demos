
let initBeforeMatch = function() {
  let sections = document.querySelectorAll('section > .details');
  for (let section of sections) {
    let input = section.parentElement.querySelector('input');
    section.setAttribute('hidden', 'until-found');
    // This is problematic because it triggers on every section containing search content.
    section.addEventListener('beforematch', () => {
      input.checked = true;
      input.dispatchEvent(new InputEvent('input'));
    });
    input.addEventListener('input', () => {
      let inputs = document.querySelectorAll('section > label > input');
      for (let input of inputs) {
        if (!input.checked) {
          input.parentElement.parentElement.querySelector('.details').setAttribute('hidden', 'until-found');
        }
      }
    });
  }
}
initBeforeMatch();
