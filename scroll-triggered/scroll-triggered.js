if (window.CSS && window.CSS.registerProperty) {
  window.CSS.registerProperty({
    name: "--animation-trigger",
    syntax: "*",
    inherits: false,
    initialValue: "none",
  });
}

const TRIGGER_ANIMATION_NAME = '--animation-trigger';

function setupAnimationTriggers() {
  let stylesheets = document.querySelectorAll('style');
  for (let sheet of stylesheets) {
    sheet.innerHTML = sheet.innerHTML.replaceAll('animation-trigger:', '--animation-trigger:');
  }
  let stylesheet = document.createElement('style');
  stylesheet.innerHTML = `
  @keyframes --animation-trigger {
    0% { --animation-trigger-in-range:1; }
    100% { --animation-trigger-in-range:1; }
  }
  `;
  document.querySelector('head').appendChild(stylesheet);
  for (let elem of document.querySelectorAll('*')) {
    const cs = getComputedStyle(elem);
    let triggerCount = 0;
    let trigger = cs.getPropertyValue('--animation-trigger').trim();
    if (trigger == 'none')
      continue;
    let components = trigger.split(/\s/);
    const timeline = components.splice(0, 1)[0];
    const frequency = components.splice(0, 1)[0];
    const range = components.join(' ');
    let hasMultipleRanges = components.length > 1;
    if (['entry', 'exit', 'contain', 'cover', 'normal'].indexOf(components[0]) != -1) {
      hasMultipleRanges = components.length > 2;
    }
    const fillMode = hasMultipleRanges ? 'none' : 'forwards';

    // To observe a specified timeline, we need to create an animation --animation-trigger that uses it.
    let animationName = cs.animationName;
    if (animationName == 'none')
      continue;

    elem.style.animationName = cs.animationName + `, ${TRIGGER_ANIMATION_NAME}`;
    elem.style.animationTimeline = cs.animationTimeline + `, ${timeline}`;
    elem.style.animationRange = cs.animationRange + `, ${range}`;
    elem.style.animationFillMode = cs.animationFillMode + `, ${fillMode}`;
    let animations = elem.getAnimations();
    let triggerAnimation = animations.find(anim => anim.animationName == TRIGGER_ANIMATION_NAME);
    animations = animations.filter(anim => anim != triggerAnimation);
    for (let anim of animations) {
      anim.cancel();
      anim.pause();
    }
    let triggered = false;
    let update = function() {
      const isTriggered = getComputedStyle(elem).getPropertyValue('--animation-trigger-in-range') == '1';
      if (triggered == isTriggered)
        return;
      triggered = isTriggered;
      if (triggered) {
        ++triggerCount;
      }
      if (triggered && (triggerCount == 1 || frequency != 'once')) {
        for (let anim of animations) {
          anim.updatePlaybackRate(1);
          anim.play();
        }
      } else if (!triggered && frequency != 'once') {
        for (let anim of animations) {
          if (frequency == 'alternate') {
            anim.updatePlaybackRate(-1);
            anim.play();
          } else {
            anim.cancel();
            anim.pause();
          }
        }
      }
    }
    elem.addEventListener('animationstart', (evt) => {
      if (evt.target != elem || evt.animationName != TRIGGER_ANIMATION_NAME) {
        return;
      }
      requestAnimationFrame(update);
    });
    elem.addEventListener('animationend', (evt) => {
      if (evt.target != elem || evt.animationName != TRIGGER_ANIMATION_NAME) {
        return;
      }
      requestAnimationFrame(update);
    });
  }
}
requestAnimationFrame(setupAnimationTriggers);
