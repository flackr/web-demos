let actions = document.querySelector('#actions');

function addOverscrollArea(container, area) {
  // Shouldn't need to set commandForElement, it should be the implicit target.
  area.commandForElement = area;
  container.appendChild(area);
}

for (const email of document.querySelectorAll('.email-item')) {
  for (const area of actions.content.children) {
    addOverscrollArea(email, area.cloneNode(true));
  }
  let overscrolling = false;
  email.addEventListener('overscrollchanging', (evt) => {
    overscrolling = evt.overscrolling;
  });
  email.addEventListener('overscrollend', (evt) => {
    console.log(evt);
    if (!overscrolling)
      return;
    const command = evt.overscrollTarget.dataset.command;
    if (command == 'delete')
      email.remove();
    else if (command == 'toggle')
      email.classList.toggle('unread');
    else
      throw new Error(`Unsupported command: ${command}`);
    // Should have a better way to unscroll the overscroll area.
      evt.overscrollTarget.click();
  });
}

function setupPullToRefresh() {
  const pullArea = document.querySelector('main');
  const icon = document.querySelector('#pull-to-refresh .ptr-icon');
  pullArea.addEventListener('overscrollend', (evt) => {
    if (!evt.overscrolling)
      return;
    icon.classList.add('refreshing');
    setTimeout(() => {
      icon.classList.remove('refreshing');
      document.getElementById('refresh-btn').click();
    }, 2000);
  });
}
setupPullToRefresh();
