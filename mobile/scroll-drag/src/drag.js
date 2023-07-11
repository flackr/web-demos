class EventListenerRegistry {
  constructor() {
    this.listeners = new Map();
  }

  listen(obj, eventName, listener) {
    if (!this.listeners.has(obj)) {
      this.listeners[obj] = [];
    }
    this.listeners[obj].push([eventName, listener]);
    obj.addEventListener(eventName, listener);
  }

  cleanup() {
    for (let obj of this.listeners.keys()) {
      for (const [eventName, listener] of this.listeners[obj]) {
        obj.removeEventListener(eventName, listener);
      }
    }
    this.listeners = new Map();
  }
}

// Given a list element, make the items of the list draggable.
function setupDraggableList(list) {
  let items = list.children;
  for (let item of items) {
    item.setAttribute('draggable', true);
    item.setAttribute('contenteditable', true);
    item.addEventListener('dragstart', (evt) => {
      let registry = new EventListenerRegistry();
      const height = item.clientHeight;
      let index = -1;
      let target = -1;
      let makeSpace = function() {
        // All items that are before the target slide forward
        for (let i = 0; i < items.length; ++i) {
          if (i < index) {
            items[i].style.transform = (i < target) ? '' : `translateY(${height}px)`;
          } else if (i > index) {
            items[i].style.transform = (i > target) ? '' : `translateY(${-height}px)`;
          }
        }
      };
      requestAnimationFrame(() => {
        item.style.opacity = 0;
      });
      for (let i = 0; i < items.length; ++i) {
        if (items[i] === item) {
          index = i;
          target = i;
        }
        registry.listen(items[i], 'dragenter', (evt) => {
          let offset = 0;
          if (i < index && i >= target)
            offset += 1;
          else if (i > index && i <= target)
            offset -= 1;
          target = i + offset;
          makeSpace();
        });
      }
      registry.listen(list, 'dragover', (evt) => {
        // Required to allow dropping on this target.
        evt.preventDefault();
      });
      registry.listen(list, 'drop', (evt) => {
        evt.preventDefault();
        registry.cleanup();
        for (let i = 0; i < items.length; ++i) {
          items[i].style.transform = '';
        }
        for (let i = 0; i < items.length; ++i) {
          for (let anim of items[i].getAnimations())
            anim.finish();
        }  
        list.insertBefore(item, items[target + (index < target ? 1 : 0)]);
        item.style.opacity = 1;
        console.log('drop');
      })
    });
  }
}
