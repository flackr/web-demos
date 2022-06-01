
function $(id) {
  return document.getElementById(id);
}

function update() {
  let lvh = $('vh').clientHeight;
  $('log').textContent = `lvh = ${lvh} visualViewport.height = ${visualViewport.height}`;
  if (Math.round(visualViewport.height) != Math.round(lvh)) {
    document.body.classList.add('small');
  } else {
    document.body.classList.remove('small');
  }
}

window.visualViewport.addEventListener('resize', update);
document.addEventListener('DOMContentLoaded', update);