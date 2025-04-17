
const features = {
  fps: {
    rafTimer: null,
    lastRaf: null,
    times: [],
    elem: document.getElementById('fps-indicator'),
    state: function() {
      return !!this.rafTimer;
    },
    raf: function(ts) {
      const last = this.lastRaf;
      this.lastRaf = ts;
      if (last) {
        this.times.push(ts - last);
        if (this.times.length > 10) {
          const avg = this.times.reduce((a, b) => a + b) / this.times.length;
          this.elem.textContent = Math.round(1000 / avg) + ' fps';
          this.times = [];
        }
      }
      this.rafTimer = requestAnimationFrame(this.raf.bind(this));
    },
    setState: function(s) {
      if (s == this.state()) {
        return;
      }
      if (s) {
        this.rafTimer = requestAnimationFrame(this.raf.bind(this));
        this.elem.style.display = '';
      } else {
        cancelAnimationFrame(this.rafTimer);
        this.rafTimer = null;
        this.elem.style.display = 'none';
      }
    },
  },
  transform: {
    state: function() {
      return document.body.classList.contains('transform-anims')
    },
    setState: function(s) {
      if (s == this.state()) {
        return;
      }
      document.body.classList.toggle('transform-anims');
    },
  },
  mainanim: {
    state: function() {
      return document.body.classList.contains('main-anims')
    },
    setState: function(s) {
      if (s == this.state()) {
        return;
      }
      document.body.classList.toggle('main-anims');
    },
  },
  jank: {
    interval: null,
    state: function() {
      return !!this.interval;
    },
    setState: function(s) {
      // Skip if no change
      if (s == this.state()) {
        return true;
      }
      if (s) {
        this.interval = setInterval(() => {
          const start = performance.now();
          while (performance.now() < start + 300);
        }, 300);
      } else {
        clearInterval(this.interval);
        this.interval = null;
      }
    },
  },
};
for (const id in features) { 
  const input = document.getElementById(id);
  input.addEventListener('change', () => {
    features[id].setState(input.checked);
    updateHash();
  });
  features[id].setState(input.checked);
}
function updateHash() {
  const parts = [];
  for (const id in features) {
    if (features[id].state()) {
      parts.push(id);
    }
  }
  window.location.hash = parts.join('&');
}
function updateFromHash() {
  const parts = window.location.hash.slice(1).split('&');
  for (const id in features) {
    const enabled = parts.includes(id);
    features[id].setState(enabled);
    document.getElementById(id).checked = enabled;
  }
}
window.addEventListener('hashchange', updateFromHash);
if (window.location.hash.length > 0) {
  updateFromHash();
}

const args = window.location.search.slice(1).split('&');
let argMap = {};
for (const arg of args) {
  const parts = arg.split('=');
  argMap[parts[0]] = parts[1];
}
const particleCount = argMap.n ? parseInt(argMap.n) : Math.round(window.innerWidth / 5);

for (let i = 0; i < particleCount; i++) {
  const flame = document.createElement('div');
  flame.classList.add('flame');
  flame.style.left = (Math.random() * 100) + '%';
  flame.style.animationDelay = (-Math.random() * 5000) + 'ms';
  document.body.appendChild(flame);
}
