'use strict';

document.addEventListener('DOMContentLoaded', init);

function TweakPropertyInterpolation(propertyName, tweaker) {
  const handler = evt => {
    if (evt.propertyName !== propertyName)
      return;
    const transition = 
        evt.target.getAnimations().
            find(animation => animation.transitionProperty ===
                propertyName);
    transition.effect = tweaker(transition.effect);
  };
  document.addEventListener('transitionrun', handler);
}

function setupCustomTransform() {
  TweakPropertyInterpolation('transform', effect => {
    const keyframes = effect.getKeyframes();
    const coords = transform => {
      if (transform === 'none')
        return [0, 0];
      const matches = [...transform.matchAll(/\d+/g)].map(str => parseFloat(str));
      return [matches[0], matches[1]];
    };
    const p1 = coords(keyframes[0].transform);
    const p2 = coords(keyframes[1].transform);
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const d = Math.sqrt(dx*dx + dy*dy);
    const dx_max = window.innerWidth;
    const dy_max = window.innerHeight; 
    const d_max = Math.sqrt(dx_max * dx_max + dy_max * dy_max);
    const base_duration = effect.getTiming().duration;
    const duration = Math.trunc(base_duration * (d / d_max));
    return new KeyframeEffect(effect.target, keyframes, {duration: duration});
  });
}

function init() {
  // Add event listeners
  let selector = document.querySelector('.selector');
  function handleClick(evt) {
    let sibling = evt.target;
    while (sibling.parentElement != selector.parentElement)
    	sibling = sibling.parentElement;
    let x = sibling.offsetLeft;
    let y = sibling.offsetTop;
    selector.style.transform = `translate(${x}px, ${y}px)`;
  }

  setupCustomTransform();
  
  for (let item of document.querySelectorAll('.grid > div')) {
    item.addEventListener('click', handleClick);
  }
}
