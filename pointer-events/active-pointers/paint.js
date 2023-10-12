function init() {
  let canvas = document.querySelector('canvas');
  let scale = window.devicePixelRatio;
  let pointers = {};
  function update() {
    canvas.setAttribute('width', canvas.offsetParent.scrollWidth * scale);
    canvas.setAttribute('height', canvas.offsetParent.scrollHeight * scale);
    canvas.style.transform = `scale(${1/scale})`;
    draw();
  }

  let raf = null;
  const RADIUS = 30;
  const FONTSIZE = 16;
  const LINESPACING = 4;
  const PADDING = 8;
  function draw() {
    if (raf === null) {
      raf = requestAnimationFrame(() => {
        raf = null;
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(scale, scale);
        for (let id in pointers) {
          let pointer = pointers[id];
          ctx.fillStyle = `hsla(${(id * 30) % 360}deg 50% 50% / ${pointer.state == 'down' ? 100 : 50}%)`
          ctx.beginPath();
          ctx.arc(pointer.x, pointer.y, RADIUS, 0, 2 * Math.PI);
          ctx.fill();
        }

        ctx.font = `${FONTSIZE}px sans-serif`;
        for (let id in pointers) {
          let pointer = pointers[id];
          let text = `pointerId: ${id}\nbuttons: ${pointer.buttons}`;
          let lines = text.split('\n');
          let y = pointer.y - (lines.length * 0.5 - 0.5) * (FONTSIZE + LINESPACING);
          ctx.fillStyle = 'black';
          for (let line of lines) {
            ctx.fillText(line, pointer.x + RADIUS + PADDING, y);
            y += FONTSIZE + LINESPACING;
          }
        }
        ctx.restore();
      });
    }
  }

  function updatePointer(evt) {
    pointers[evt.pointerId] = pointers[evt.pointerId] || {state: 'up'};
    pointers[evt.pointerId].x = evt.pageX;
    pointers[evt.pointerId].y = evt.pageY;
    pointers[evt.pointerId].buttons = evt.buttons;
    if (evt.type == 'pointerdown') {
      pointers[evt.pointerId].state = 'down';
    } else if (evt.type == 'pointerup') {
      pointers[evt.pointerId].state = 'up';
    }
    draw();
  }

  function removePointer(evt) {
    delete pointers[evt.pointerId];
    draw();
  }

  canvas.addEventListener('pointerdown', updatePointer);
  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('pointerup', updatePointer);

  canvas.addEventListener('pointerleave', removePointer);
  canvas.addEventListener('pointercancel', removePointer);

  update();
  window.addEventListener('resize', update);
}

document.addEventListener('DOMContentLoaded', init);
