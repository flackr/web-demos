"strict";

const ZOOM_MIN = 1;
const ZOOM_MAX = 6;
const ZOOM_ADJUST_MAX = 0.2;
const ZOOM_ADJUST_MAX_DELTA = 20;

// Parameters for current configuration.
let zoom = 1;
let scrollTop = 0;
let visualTop = 0;
let visualLeft = 0;
let unzoomedTop = 0;

let moveHandler = null;
let endHandler = null;

function scrollIntoView(elem) {
  let content = document.querySelector('.content');
  let pos = elem.offsetTop - content.offsetTop;
  let screen = document.querySelector('.screen');
  let layoutHeight = screen.clientHeight;
  let keyboard = document.querySelector('.keyboard');
  let keyboardHeight = keyboard.classList.contains('visible') ? keyboard.clientHeight : 0;
  let visualHeight = (layoutHeight - keyboardHeight) / zoom;
  visualTop = Math.min(pos, Math.max(visualTop, pos + elem.clientHeight - visualHeight));
  scrollTop = Math.min(Math.max(scrollTop, visualTop + visualHeight - layoutHeight), visualTop);
  updateViewports();
}

window.addEventListener('load', () => {
  let screen = document.querySelector('.screen');
  let contents = document.querySelectorAll('.content');
  let inputs = document.querySelectorAll('.content input');
  contents[1].innerHTML = contents[0].innerHTML;
  updateSizes();
  for (let input of inputs) {
    input.addEventListener('focus', onfocus);
    input.addEventListener('blur', onblur);
  }
  screen.addEventListener('wheel', (evt) => {
    let layoutWidth = screen.clientWidth;
    let layoutHeight = screen.clientHeight;
    let keyboard = document.querySelector('.keyboard');
    let keyboardHeight = keyboard.classList.contains('visible') ? keyboard.clientHeight : 0;

    evt.preventDefault();
    let zoomAdjust = Math.min(1, Math.max(-1, evt.deltaY / ZOOM_ADJUST_MAX_DELTA)) * ZOOM_ADJUST_MAX;
    let newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * (1 + zoomAdjust)));
    let screenX = evt.clientX - screen.offsetLeft;
    let screenY = evt.clientY - screen.offsetTop;
    console.log(screenX, screenY);
    visualLeft += screenX / screen.clientWidth * (layoutWidth / zoom - layoutWidth / newZoom);
    visualTop += screenY / screen.clientHeight * (layoutHeight / zoom - layoutHeight / newZoom);
    zoom = newZoom;
    visualLeft = Math.max(0, Math.min(layoutWidth - layoutWidth / zoom, visualLeft));
    visualTop = Math.max(scrollTop, Math.min(scrollTop + layoutHeight - layoutHeight / zoom, visualTop));
    updateViewports();
  });

  function updateSettings() {
    document.querySelector('#visual-nozoom').style.display = (document.querySelector('#unzoomed').checked ? '' : 'none');
    updateViewports();
  }

  screen.addEventListener('pointerdown', (startEvent) => {
    startEvent.preventDefault();
    screen.setPointerCapture(startEvent.pointerId);
    if (moveHandler)
      return;
    let layoutWidth = screen.clientWidth;
    let layoutHeight = screen.clientHeight;
    let keyboard = document.querySelector('.keyboard');
    let keyboardHeight = keyboard.classList.contains('visible') ? keyboard.clientHeight : 0;
    let visualHeight = (layoutHeight - keyboardHeight) / zoom;

    let scrollMax = document.querySelector('.browser .content').clientHeight - layoutHeight;
    let last = [startEvent.clientX, startEvent.clientY];
    moveHandler = (evt) => {
      evt.preventDefault();
      let delta = [evt.clientX - last[0], evt.clientY - last[1]];
      last = [evt.clientX, evt.clientY];
      let moveX = -delta[0] / zoom;
      let moveY = -delta[1] / zoom;

      // Since no horizontal scrolling is possible, don't need to worry about overflow.
      visualLeft += moveX;
      visualLeft = Math.max(0, Math.min(layoutWidth - layoutWidth / zoom, visualLeft));

      visualTop += moveY;
      let visualTopMax = scrollTop + layoutHeight - layoutHeight / zoom;
      let overflow = 0;
      visualTop = Math.max(0, Math.min(scrollMax + layoutHeight - layoutHeight / zoom, visualTop));

      scrollTop = Math.min(Math.max(scrollTop, visualTop + visualHeight - layoutHeight), visualTop);
      updateViewports();
    };
    endHandler = (evt) => {
      evt.preventDefault();
      screen.removeEventListener('pointermove', moveHandler);
      screen.removeEventListener('pointerup', endHandler);
      if (startEvent.target && Math.abs(evt.clientX - startEvent.clientX) < 8 && Math.abs(evt.clientY - startEvent.clientY) < 8) {
        startEvent.target.focus();
        if (document.activeElement != startEvent.target)
          document.activeElement.blur();
      }
      moveHandler = endHandler = null;
    };
    screen.addEventListener('pointermove', moveHandler);
    screen.addEventListener('pointerup', endHandler);
  });

  // Keyboard setup
  let alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let keyboard = document.querySelector('.keyboard');
  let addKey = function(gridArea, text, code) {
    let key = document.createElement('div');
    key.classList.add('key');
    if (text.length > 1)
      key.classList.add('small');
    key.setAttribute('code', code);
    key.innerHTML = text;
    key.style.gridArea = gridArea;
    keyboard.appendChild(key);
  }
  for (let i = 0; i < 26; ++i) {
    let lower = alphabet[i];
    let upper = alphabet[i].toUpperCase();
    addKey(lower, upper, lower);
  }
  addKey('R', 'Enter', 'Enter');
  addKey('B', 'Backspace', 'Backspace');

  document.querySelector('#unzoomed').addEventListener('change', updateSettings);
  updateSettings();
});

window.addEventListener('resize', updateSizes);

function onfocus() {
  document.querySelector('.keyboard').classList.add('visible');
  scrollIntoView(document.activeElement);
}

function onblur() {
  document.querySelector('.keyboard').classList.remove('visible');
  updateViewports();
}

function updateSizes() {
  let contents = document.querySelectorAll('.content');
  contents[1].style.width = contents[0].offsetWidth + 'px';
  document.querySelector('#layout').style.height = document.querySelector('.screen').clientHeight + 'px';
  document.querySelector('#layout').style.width = document.querySelector('.screen').clientWidth + 'px';
  document.querySelector('#visual-nozoom').style.width = document.querySelector('.screen').clientWidth + 'px';
  updateViewports();
}

function updateViewports() {
  let layoutWidth = document.querySelector('.screen').clientWidth;
  let layoutHeight = document.querySelector('.screen').clientHeight;
  let keyboard = document.querySelector('.keyboard');
  let keyboardHeight = keyboard.classList.contains('visible') ? keyboard.clientHeight : 0;
  let content = document.querySelector('.content');
  let visualHeight = (layoutHeight - keyboardHeight) / zoom;
  let useUnzoomed = document.querySelector('#unzoomed').checked;
  unzoomedTop = Math.min(unzoomedTop, scrollTop + keyboardHeight);
  unzoomedTop = Math.min(Math.max(unzoomedTop, visualTop + visualHeight - layoutHeight + keyboardHeight), visualTop);

  document.querySelector('#layout').style.top = scrollTop + 'px';

  let visual = document.querySelector('#visual');
  visual.style.left = visualLeft + 'px';
  visual.style.top = visualTop + 'px';
  visual.style.height = (layoutHeight - keyboardHeight) / zoom + 'px';
  visual.style.width = layoutWidth / zoom + 'px';
  content.style.transform = `scale(${zoom}, ${zoom}) translate(-${visualLeft}px, -${visualTop}px)`;

  let nozoom = document.querySelector('#visual-nozoom');
  nozoom.style.top = unzoomedTop + 'px';
  nozoom.style.height = (layoutHeight - keyboardHeight) + 'px';

  let allFixed = document.querySelectorAll('.fixed');
  for (let fixed of allFixed) {
    let offset = useUnzoomed ? unzoomedTop : scrollTop;
    if (fixed.classList.contains('bottom')) {
      offset += (layoutHeight - (useUnzoomed ? keyboardHeight : 0) - fixed.clientHeight + 1);
    }
    fixed.style.transform = `translateY(${offset}px)`;
  }
}