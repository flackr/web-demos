let dragged = null;

// Given a list element, make the items of the list draggable.
function setupDraggableList(list) {
  let index = -1;
  let target = -1;
  let cleanup = (options) => {
    if (dragged?.dropTarget === list)
      dragged.dropTarget = null;
    let items = list.children;
    for (let i = 0; i < items.length; ++i) {
      items[i].style.transform = '';
    }
    if (!options?.animate) {
      for (let i = 0; i < items.length; ++i) {
        for (let anim of items[i].getAnimations())
          anim.finish();
      }
    }
  };
  let pendingLeave = null;
  list.addEventListener('dragover', (evt) => {
    // Must prevent dragover to allow dropping on this target.
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'move';
  });
  list.addEventListener('dragenter', (evt) => {
    console.log(`dragenter on ${evt.target.tagName}`);
    let items = list.children;
    // The setup only needs to be done when we enter a new target.
    if (dragged?.dropTarget === list) {
      // If we have a pending leave for this target, cancel it.
      if (pendingLeave) {
        clearTimeout(pendingLeave);
        pendingLeave = 0;
      }
    } else {

      dragged = dragged || {
        elem: null,
        height: 0
      };
      if (!dragged.elem) {
        dragged.height = list.children.length ? list.children[0].clientHeight : 100;
      }
      dragged.dropTarget = list;

      target = index = items.length;
      for (let i = 0; i < items.length; ++i) {
        if (items[i] === dragged.elem) {
          target = index = i;
        }
      }

    }
    let makeSpace = function() {
      // All items that are before the target slide forward
      for (let i = 0; i < items.length; ++i) {
        if (i < index) {
          items[i].style.transform = (i < target) ? '' : `translateY(${dragged.height}px)`;
        } else if (i > index) {
          items[i].style.transform = (i > target) ? '' : `translateY(${-dragged.height}px)`;
        }
      }
    };
    if (evt.target !== list) {
      let items = list.children;
      let item = evt.target;
      while (item.parentElement !== list) {
        item = item.parentElement;
      }
      let i = Array.prototype.indexOf.apply(items, [item]);
      let offset = 0;
      if (i < index && i >= target)
        offset += 1;
      else if (i > index && i <= target)
        offset -= 1;
      target = i + offset;
      makeSpace();
    }
  });
  list.addEventListener('drop', (evt) => {
    if (evt.target !== list)
      return;
    cleanup();
    evt.preventDefault();
    let elem = dragged.elem;
    if (!elem) {
      let parent = document.createElement('div');
      const html = evt.dataTransfer.getData("text/html");
      parent.innerHTML = html;
      elem = parent.lastElementChild;
    }
    list.insertBefore(elem, list.children[target + (index < target ? 1 : 0)]);
    dragged.elem = null;
  });
  list.addEventListener('dragleave', (evt) => {
    console.log(`dragleave on ${evt.target.tagName}`);
    // Only consider leaves of the top level element.
    if (evt.target !== list) {
      return;
    }
    if (pendingLeave) {
      clearTimeout(pendingLeave);
    }
    // NOTE: It feels like a bug that we don't have a clear signal (e.g. dragout) for
    // when the drag leaves a particular element that doesn't fire when entering
    // sub-elements, e.g. equivalent to mouseout / pointerout.
    pendingLeave = setTimeout(() => {
      cleanup({animate: true});
    }, 200);
  });
  for (let item of list.children) {
    item.setAttribute('draggable', true);
    item.setAttribute('tabindex', 0);
    item.addEventListener('focus', () => {
      item.setAttribute('contenteditable', true);
    });
    item.addEventListener('blur', () => {
      item.setAttribute('contenteditable', false);
    });
  }
  list.addEventListener('dragstart', (evt) => {
    let item = evt.target;
    evt.dataTransfer.setData("text/html", item.outerHTML);
    dragged = {
      elem: item,
      height: item.clientHeight,
      dropTarget: null
    };
    requestAnimationFrame(() => {
      item.style.opacity = 0;
    });
    item.addEventListener('dragend', (evt) => {
      cleanup({animate: true});
      item.style.opacity = 1;
      dragged = null;
      if (dragged?.elem === item && dragged?.dropTarget !== list && item.parentElement === list) {
        item.remove();
      }
    }, {once: true});
  });
}
