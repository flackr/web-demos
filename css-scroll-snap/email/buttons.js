let actions = document.querySelector('#actions');

function addOverscrollArea(email, area) {
  const container = email.parentElement;
  container.insertBefore(area, area.classList.contains('right') ? null : container.firstElementChild); 
}

for (const email of document.querySelectorAll('.email-item')) {
  const container = email;
  const article = email.querySelector('article');
  for (const area of actions.content.children) {
    addOverscrollArea(article, area.cloneNode(true));
  }
  container.scrollLeft = article.offsetLeft;
  container.addEventListener('scrollsnapchange', async (evt) => {
    const target = evt.snapTargetInline;
    const command = target.dataset.command;
    if (!command)
      return;
    if (command == 'delete') {
      container.classList.add('animate-deletion');
      await container.getAnimations()[0].finished;
      container.remove();
      return;
    } else if (command == 'toggle') {
      email.classList.toggle('unread');
    } else {
      throw new Error(`Unsupported command: ${command}`);
    }
    // Should have a better way to unscroll the overscroll area.
    container.scrollLeft = article.offsetLeft;
  });
}

function setupPullToRefresh() {
  const pullArea = document.querySelector('main');
  const icon = document.querySelector('#pull-to-refresh .ptr-icon');
  const container = pullArea.parentElement;
  container.addEventListener('scrollsnapchange', (evt) => {
    if (evt.snapTargetBlock.id != 'pull-to-refresh')
      return;
    icon.classList.add('refreshing');
    setTimeout(() => {
      icon.classList.remove('refreshing');
      container.scrollTo({top: container.scrollHeight});
    }, 2000);
  });
}
setupPullToRefresh();
