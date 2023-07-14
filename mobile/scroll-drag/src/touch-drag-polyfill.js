(()=>{
  let installed = false;
  const DEFAULT_EVENT_OPTIONS = {
    bubbles: true,
    cancelable: true
  };

  function install() {
    if (installed)
      return;
    installed = true;

    // Polyfill contextmenu events for iOS Safari.
    if (navigator.userAgent.toLowerCase().indexOf('iphone') > -1) {
      const LONGPRESS_TIMEOUT = 500;
      const TOUCH_PROPS = ['clientX', 'clientY', 'layerX', 'layerY', 'offsetX', 'offsetY', 'pageX', 'pageY', 'screenX', 'screenY'];
      let longpress = null;

      let cancelLongpress = function(evt) {
        if (!longpress)
          return;
        clearTimeout(longpress.timer);
        for (let listener of longpress.listeners) {
          listener[0].removeEventListener(listener[1], listener[2]);
        }
        longpress = null;
      }

      function listen(obj, eventName, listener) {
        longpress.listeners.push([obj, eventName, listener]);
        obj.addEventListener(eventName, listener);
      }

      document.body.addEventListener('touchstart', (evt) => {
        if (evt.touches.length != 1 || evt.defaultPrevented) {
          cancelTimer(evt);
          return;
        }
        const target = evt.target;
        longpress = {
          listeners: [],
          timer: 0
        };
        const moveListener = (moveevt) => {
          // If contextmenu fired and was handled, prevent the first touchmove.
          if (prevented) {
            moveevt.preventDefault();
          }
        };
        target.addEventListener('touchend', (evt) => {
          cancelLongpress(evt);
          target.removeEventListener('touchmove', moveListener, {once: true, passive: false});
        }, {once: true});
        target.addEventListener('touchmove', moveListener, {once: true, passive: false});
        let scroller = target;
        let prevented = false;
        while (scroller) {
          if (scroller === document.scrollingElement)
            scroller = window;

          listen(scroller, 'scroll', cancelLongpress);
          scroller = scroller.parentElement;
        }
        longpress.timer = setTimeout(() => {
          let options = {...DEFAULT_EVENT_OPTIONS};
          for (let prop of TOUCH_PROPS) {
            options[prop] = evt.touches[0][prop];
          }
          let dispatch = new MouseEvent('contextmenu', options);
          target.dispatchEvent(dispatch);
          prevented = dispatch.defaultPrevented;
          cancelLongpress();
        }, LONGPRESS_TIMEOUT);
      }, {passive: false});
    }

    // Polyfill drag and drop events for Android.
    if (navigator.userAgent.toLowerCase().indexOf('iphone') == -1) {
      console.log('setattr')
      // Android drag and drop is broken so we need to use a non-standard attribute.
      // We could also use mutation observer to ensure that we change this anytime
      // the attribute is set.
      const elementSetAttribute = Element.prototype.setAttribute;
      const POLYFILL_DRAGGABLE_ATTRIBUTE = 'data-polyfill-draggable';
      for (let elem of document.querySelectorAll('[draggable]')) {
        elem.setAttribute(POLYFILL_DRAGGABLE_ATTRIBUTE, elem.getAttribute('draggable'));
        elem.removeAttribute('draggable');
      }
      Element.prototype.setAttribute = function(name, value) {
        if (name == 'draggable') {
          name = POLYFILL_DRAGGABLE_ATTRIBUTE;
        }
        return elementSetAttribute.apply(this, [name, value]);
      };
      const elementGetAttribute = Element.prototype.getAttribute;
      Element.prototype.getAttribute = function(name, value) {
        if (name == 'draggable') {
          name = POLYFILL_DRAGGABLE_ATTRIBUTE;
        }
        return elementGetAttribute.apply(this, [name, value]);
      };

      let dragStarted = false;
      document.body.addEventListener('touchstart', () => {
        dragStarted = false;
      }, {passive: false});
      document.body.addEventListener('touchmove', (evt) => {
        if (dragStarted)
          evt.preventDefault();
      }, {passive: false});
      function findDraggable(elem) {
        let target = elem;
        while (target) {
          if (target.getAttribute) {
            if (target.getAttribute('draggable'))
              return target;
          }
          target = target.parentElement;
        }
        return target;
      }
      document.body.addEventListener('selectstart', (evt) => {
        // Prevent selection if there is a draggable element.
        if (findDraggable(evt.target))
          evt.preventDefault();
      });
      document.body.addEventListener('contextmenu', (ctxevt) => {
        let target = findDraggable(ctxevt.target);
        // No draggable target.
        if (!target)
          return;
        // Simulate dragstart on current element.
        ctxevt.preventDefault();
        dragStarted = true;
        target.dispatchEvent(new DragEvent('dragstart', {...DEFAULT_EVENT_OPTIONS}));
        const clone = target.cloneNode(true);
        clone.style.pointerEvents = 'none';
        clone.style.position = 'fixed';
        clone.style.top = `${-ctxevt.offsetX}px`;
        clone.style.left = `${-ctxevt.offsetY}px`;
        clone.style.width = `${target.clientWidth}px`;
        clone.style.height = `${target.clientHeight}px`;
        clone.style.transition = 'none';
        target.parentElement.appendChild(clone);
        let dragTarget = null;
        let canDrop = false;
        let move = function(evt) {
          const x = evt.pageX || evt.touches[0].pageX;
          const y = evt.pageY || evt.touches[0].pageY;
          clone.style.transform = `translate(${x}px, ${y}px)`;
          let newTarget = document.elementFromPoint(x, y);
          if (newTarget != dragTarget) {
            if (dragTarget) {
              dragTarget.dispatchEvent(new DragEvent('dragleave', {...DEFAULT_EVENT_OPTIONS}));
            }
            dragTarget = newTarget;
            dragTarget.dispatchEvent(new DragEvent('dragenter', {...DEFAULT_EVENT_OPTIONS}));
          }
          let dispatch = new DragEvent('dragover', {...DEFAULT_EVENT_OPTIONS});
          dragTarget.dispatchEvent(dispatch);
          canDrop = dispatch.defaultPrevented;
        }
        move(ctxevt);
        target.addEventListener('touchmove', move);
        target.addEventListener('touchend', (evt) => {
          target.removeEventListener('touchmove', move);
          clone.remove();
          if (canDrop)
            dragTarget.dispatchEvent(new DragEvent('drop', {bubbles: true}));
          target.dispatchEvent(new DragEvent('dragend', {bubbles: true}));
        }, {once: true});
      });
    }
  }

  function mixin(prototype, name, fn) {
    const original = prototype[name];
    prototype[name] = function() {
      fn.apply(this, arguments);
      return original.apply(this, arguments);  
    }
  }

  function addListenerMixin(eventName, listener, options) {
    if (eventName === 'dragstart' ||
        eventName === 'contextmenu' && navigator.userAgent.toLowerCase().indexOf('iphone') > -1) {
      install();
    }
  }
  if (navigator.userAgent.toLowerCase().indexOf('iphone') == -1) {
    install();
  }

  mixin(Element.prototype, 'addEventListener', addListenerMixin);
})();
