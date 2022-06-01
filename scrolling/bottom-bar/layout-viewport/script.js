function $(id) {
  return document.getElementById(id);
}

function update() {
  let largeSize = $('vh').clientHeight;
  if (window.innerHeight == largeSize) {
    document.body.classList.remove('small');
  } else {
    document.body.classList.add('small');
  }
}
window.addEventListener('resize', update);
document.addEventListener('DOMContentLoaded', update);