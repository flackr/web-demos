let actions = document.querySelector('#actions');

function addOverscrollArea(container, area) {
  container.appendChild(area);
  const btn = document.createElement('button');
  btn.command = 'toggle-overscroll';
  btn.commandForElement = area;
  container.appendChild(btn);
  container.addEventListener('overscrollend', (evt) => {
    container.remove();
  });
}

for (const email of document.querySelectorAll('.email-item')) {
  for (const area of actions.content.children) {
    addOverscrollArea(email, area.cloneNode(true));
  }
}
