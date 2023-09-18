// The custom property setting up animation triggers.
const ANIMATION_TRIGGER = '--animation-trigger';
// The custom properties animated to determine animation trigger ranges.
const ANIMATION_TRIGGER_IN_RANGE = '--animation-trigger-in-range';
const ANIMATION_TRIGGER_EXIT_IN_RANGE = '--animation-trigger-exit-in-range';

if (window.CSS && window.CSS.registerProperty) {
  // None of the props should inherit.
  for (let prop of [ANIMATION_TRIGGER, ANIMATION_TRIGGER_IN_RANGE, ANIMATION_TRIGGER_EXIT_IN_RANGE]) {
    window.CSS.registerProperty({
      name: prop,
      syntax: "*",
      inherits: false,
      initialValue: prop == ANIMATION_TRIGGER ? 'none' : '0',
    });
  }
}

const TRIGGER_ANIMATION_NAME = '--animation-trigger';
const TRIGGER_EXIT_ANIMATION_NAME = '--animation-trigger-exit';

function setupAnimationTriggers() {
  let parseRange = function(str, index) {
    let parsed = {range: 'normal', index, success: false};
    if (index >= str.length)
      return parsed;
    const RANGE_NAMES = ['normal', 'cover', 'entry', 'exit', 'contain', 'entry-crossing', 'exit-crossing'];
    let word = str.slice(parsed.index).split(/\s+/, 2)[0];
    // Consume valid range names
    if (RANGE_NAMES.indexOf(word) != -1) {
      parsed.range = word;
      parsed.index += word.length;
      // Sucess even if we don't find a length.
      parsed.success = true;
      if (str[parsed.index] != ' ')
        return parsed;
      ++parsed.index;
    }

    // Consume a length
    let start = parsed.length;
    if (str.slice(parsed.index).startsWith('calc(')) {
      let calc = '';
      parsed.index += 5;
      let brackets = 1;
      while (brackets > 0 && parsed.index < str.length) {
        let c = str[parsed.index++];
        if (c == '(')
          brackets++;
        else if (c == ')')
          brackets--;
      }
      let length = str.slice(start, parsed.index);
      parsed.range += ' ' + length;
      parsed.success = true;
      return parsed;
    }

    let c = str[parsed.index];
    // Consume a non-calc length, require a custom prop or number character first.
    if (['-', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].indexOf(c) == -1) {
      return parsed;
    }
    let length = str.slice(parsed.index).split(/\s+/, 2)[0];
    parsed.range += ' ' + length;
    parsed.index += length.length;
    // Consume following whitespace.
    if (str[parsed.index] == ' ')
      ++parsed.index;
    if (length.length > 0)
      parsed.success = true;
    return parsed;
  }

  let stylesheets = document.querySelectorAll('style');
  for (let sheet of stylesheets) {
    sheet.innerHTML = sheet.innerHTML.replaceAll('animation-trigger:', '--animation-trigger:');
  }
  let stylesheet = document.createElement('style');
  stylesheet.innerHTML = `
  @keyframes --animation-trigger {
    0% { ${ANIMATION_TRIGGER_IN_RANGE}:1; }
    100% { ${ANIMATION_TRIGGER_IN_RANGE}:1; }
  }
  @keyframes --animation-trigger-exit {
    0% { ${ANIMATION_TRIGGER_EXIT_IN_RANGE}:1; }
    100% { ${ANIMATION_TRIGGER_EXIT_IN_RANGE}:1; }
  }
  `;
  document.querySelector('head').appendChild(stylesheet);
  for (let elem of document.querySelectorAll('*')) {
    const cs = getComputedStyle(elem);
    let triggerCount = 0;
    let trigger = cs.getPropertyValue('--animation-trigger').trim();
    if (trigger == 'none')
      continue;
    let components = trigger.split(/\s+/);
    const timeline = components.splice(0, 1)[0];
    const frequency = components.splice(0, 1)[0];
    const remaining = components.join(' ');
    let ranges = [];
    let index = 0;
    while (ranges.length < 4) {
      let range = parseRange(remaining, index);
      index = range.index;
      if (!range.success) break;
      ranges.push(range.range);
    }
    // At least one range must be specified.
    if (ranges.length == 0)
      continue;
    let hasMultipleRanges = ranges.length > 1;
    const fillMode = hasMultipleRanges ? 'none' : 'forwards';
    let exitRange = '';
    let entryRange = ranges[0];
    if (ranges.length > 1)
      entryRange += ' ' + ranges[1];
    if (ranges.length <= 2) {
      exitRange = entryRange;
    } else {
      exitRange = ranges[2];
      if (ranges.length > 3)
        exitRange += ' ' + ranges[3];
    }

    // To observe a specified timeline, we need to create an animation --animation-trigger that uses it.
    let animationName = cs.animationName;
    if (animationName == 'none')
      continue;

    elem.style.animationName = cs.animationName + `, ${TRIGGER_ANIMATION_NAME}, ${TRIGGER_EXIT_ANIMATION_NAME}`;
    elem.style.animationTimeline = cs.animationTimeline + `, ${timeline}, ${timeline}`;
    elem.style.animationRange = cs.animationRange + `, ${entryRange}, ${exitRange}`;
    elem.style.animationFillMode = cs.animationFillMode + `, ${fillMode}, none`;
    let animations = elem.getAnimations();
    let triggerAnimation = animations.find(anim => anim.animationName == TRIGGER_ANIMATION_NAME);
    let triggerExitAnimation = animations.find(anim => anim.animationName == TRIGGER_EXIT_ANIMATION_NAME);
    animations = animations.filter(anim => anim != triggerAnimation && anim != triggerExitAnimation);
    for (let anim of animations) {
      anim.cancel();
      anim.pause();
    }
    let triggered = false;
    let update = function() {
      const inEnter = getComputedStyle(elem).getPropertyValue(ANIMATION_TRIGGER_IN_RANGE) == '1';
      const leftExit = getComputedStyle(elem).getPropertyValue(ANIMATION_TRIGGER_EXIT_IN_RANGE) != '1';

      // Determine current trigger value.
      let isTriggered = null;
      if (inEnter) {
        isTriggered = true;
      } else if (leftExit) {
        isTriggered = false;
      }
      if (isTriggered === null || triggered == isTriggered)
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
      if (evt.target != elem || (evt.animationName != TRIGGER_ANIMATION_NAME && evt.animationName != TRIGGER_EXIT_ANIMATION_NAME)) {
        return;
      }
      requestAnimationFrame(update);
    });
    elem.addEventListener('animationend', (evt) => {
      if (evt.target != elem || (evt.animationName != TRIGGER_ANIMATION_NAME && evt.animationName != TRIGGER_EXIT_ANIMATION_NAME)) {
        return;
      }
      requestAnimationFrame(update);
    });
  }
}
requestAnimationFrame(setupAnimationTriggers);
