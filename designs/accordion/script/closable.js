let init = function() {
  let inputs = document.querySelectorAll('label > input[type=radio]');
  for (let input of inputs) {
    input.setAttribute('type', 'checkbox');
  }
}
init();
document.addEventListener('input', (evt) => {
  const target = evt.target;
  if (target.checked) {
    // Uncheck other checkboxes when one is open.
    let inputs = document.querySelectorAll('label > input[type=checkbox]');
    for (let input of inputs) {
      if (input != target)
        input.checked = false;
    }
  }
});
