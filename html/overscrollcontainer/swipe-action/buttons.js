let actions = document.querySelector('#actions');

function addOverscrollArea(container, area) {
  container.appendChild(area);
}

for (const email of document.querySelectorAll('.email-item')) {
  for (const area of actions.content.children) {
    addOverscrollArea(email, area.cloneNode(true));
  }
  email.addEventListener('overscrollend', (evt) => {
    console.log(evt);
    const command = evt.overscrollTarget.dataset.command;
    if (command == 'delete')
      email.remove();
    else if (command == 'toggle')
      email.classList.toggle('unread');
    else
      throw new Error(`Unsupported command: ${command}`);
    // Should have a better way to unscroll the overscroll area.
    email.firstElementChild.scrollIntoView({block: 'nearest', inline: 'nearest'});
  });
}
