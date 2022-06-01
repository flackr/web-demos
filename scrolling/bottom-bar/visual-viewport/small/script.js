// On load the toolbar should always be visible giving us the small viewport height.
let svh = window.innerHeight;

function $(id) {
  return document.getElementById(id);
}

function update() {
  $('log').textContent = `svh = ${svh} visualViewport.height = ${visualViewport.height}`;
  if (Math.round(visualViewport.height) == Math.round(svh)) {
    document.body.classList.add('small');
  } else {
    document.body.classList.remove('small');
  }
}

window.visualViewport.addEventListener('resize', update);
document.addEventListener('DOMContentLoaded', update);