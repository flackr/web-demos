// Parses CSS text into flattened selectors and property values
function parseCSS(str) {
  let result = [];
  let stack = [];
  let env = {selector: '', media: '', props: {}};

  function isspace(str) {
    return /\s/.exec(str);
  }
  function skipSpace(str, i) {
    while (i < str.length) {
      if (isspace(str[i])) {
        ++i;
        continue;
      }
      // Skip comments.
      if (str.substr(i, 2) == '/*') {
        i = str.indexOf('*/', i + 2);
        if (i == -1)
          i = str.length;
        else
          i += 2;
        continue;
      }
      break;
    }
    return i;
  }
  const blocks = {
    '{': '}',
    '"': '"',
    "'": "'"
  };
  function skipBlock(str, i) {
    const start = str[i];
    ++i;
    if (!blocks[start]) {
      return i;
    }
    while (i < str.length) {
      if (str[i] == '\\') {
        i += 2;
        continue;
      }
      if (str.substr(i, 2) == '/*') {
        i = str.indexOf('*/', i + 2);
        if (i == -1)
          i = str.length;
        else
          i += 2;
      }
      if (str[i] == blocks[start]) {
        ++i
        break;
      }
      if (blocks[str[i]]) {
        i = skipBlock(str, i);
        continue;
      }
      ++i;
    }
    return i;
  }
  function parseWord(str, i) {
    const start = i;
    while (i < str.length && /\w/.exec(str(i))) {
      ++i;
    }
    return {word: str.substring(start, i), next: i};
  }
  function skipUntil(str, i, re) {
    while (i < str.length && !re.exec(str[i])) {
      i = skipBlock(str, i);
    }
    return i;
  }
  let i = skipSpace(str, 0);
  while (i < str.length) {

    if (str[i] == '@') {
      let {word, next} = parseWord(str, ++i);
      i = next;
      switch(word) {
        case 'keyframes': {
          i = skipUntil(str, i, /[{]/);
          i = skipBlock(str, i);
          break;
        }
        case 'import': {
          // TODO: Read imported sheets
          i = skipUntil(str, i, /;/);
          i = skipBlock(str, i);
          break;
        }
        case 'media': {
          // TODO: Enter nested environment with media query.
          break;
        }
        default: {
          console.warn('Unrecognized @ query');
          i = skipUntil(str, i, /[{;]/);
          i = skipBlock(str, i);
          break;
        }
      }
    } else if (str[i] == '}') {
      result.push(env);
      env = stack.pop();
      ++i;
    } else if (str[i] == ';') {
      // TODO: End of property.
    } else {
      const start = i;
      i = skipUntil(str, i, /[{;}]/);
      if (str[i] == '{') {
        stack.push({...env});
        env.props = {};
        let selector = str.substring(start, i).trim();
        if (env.selector) {
          if (selector.indexOf('&') != -1) {
            selector = selector.replaceAll('&', env.selector);
          } else {
            // If not explicitly specifed, select a descendant of previous selector.
            selector = [env.selector, selector].join(' ');
          }
        }
        env.selector = selector;
        ++i;
      } else {
        // ; or } means end of property.
        if (stack.length == 0) {
          console.warn(`Bare property at ${i}`);
        }
        let splitter = str.indexOf(':', start);
        if (splitter == -1) {
          console.warn(`Missing : at ${i}: ${str.substring(start, i)}`);
        } else {
          env.props[str.substring(start, splitter).trim()] = str.substring(splitter + 1, i).trim();
        }
        if (str[i] == ';') {
          ++i;
        }
      }
      
    }
    i = skipSpace(str, i);
  }
  return result;
}

function isOffsetAncestor(anc, child) {
  while (child) {
    if (child == anc)
      return true;
    child = child.offsetParent;
  }
  return false;
}

function commonOffsetParent(e1, e2) {
  while (!isOffsetAncestor(e1, e2)) {
    e1 = e1.offsetParent;
  }
  return e1;
}

function relativeOffset(e1, e2) {
  let ancestor = commonOffsetParent(e1, e2);
  let offset = {
    offsetTop: 0,
    offsetLeft: 0,
  };
  while (e1 != ancestor) {
    offset.offsetLeft -= e1.offsetLeft;
    offset.offsetTop -= e1.offsetTop;
    e1 = e1.offsetParent;
  }
  while (e2 != ancestor) {
    offset.offsetLeft += e2.offsetLeft;
    offset.offsetTop += e2.offsetTop;
    e2 = e2.offsetParent;
  }
  return offset;
}

class FragmentNode {
  constructor(node) {
    this.node = node;
    this.children = [];
    let child = null;
    while (child = node.firstElementChild) {
      child.remove();
      this.children.push(child);
    }
    this.update();
    const resizeObserver = new ResizeObserver((entries) => {
      this.update();
    });
    resizeObserver.observe(node);
  }

  update() {
    while (this.node.firstChild) {
      this.node.firstChild.remove();
    }
    let remaining = this.children.slice();
    while (remaining.length > 0) {
      let fragment = document.createElement('div');
      fragment.className = 'fragment';
      fragment.appendChild(remaining[0]);
      this.node.appendChild(fragment);
      let i = 1;
      for (; i < remaining.length; ++i) {
        let child = remaining[i];
        fragment.appendChild(child);
        let cs = getComputedStyle(fragment);
        let space = {
          width: fragment.offsetWidth - parseFloat(cs.paddingRight),
          height: fragment.offsetHeight - parseFloat(cs.paddingBottom),
        }
        let pos = relativeOffset(fragment, child);
        if (pos.offsetLeft + child.offsetWidth > space.width ||
            pos.offsetTop + child.offsetHeight > space.height) {
          break;
        }
      }
      remaining = remaining.slice(i);
    }
  }
}

function updateSelectors(selector, forPseudo) {
  return selector.
      replaceAll('::fragment', '>.fragment').
      replace(/::grid-flow\(([^)]*)\)/g, '>.grid-flow-\$1').
      replace(/[^ >+,]*::scroll-marker$/, forPseudo?'.scroll-marker::before':'.scroll-marker').
      replace(/[^ >+,]*::scroll-marker:checked$/, forPseudo?'.scroll-marker:checked::before':'.scroll-marker:checked');
}

function getElems(selectors) {
  let elems = new Set();
  for (let selector of selectors) {
    for (let elem of document.querySelectorAll(selector)) {
      elems.add(elem);
    }
  }
  return elems;
}

function update() {
  let generated = document.createElement('style');
  generated.setAttribute('polyfill-generated', 'true');
  let stylesheets = document.querySelectorAll('style:not([polyfill-generated])');
  let blocks = [];
  for (let sheet of stylesheets) {
    blocks = blocks.concat(parseCSS(sheet.innerHTML));
  }
  let extraCSS = `
.scroll-marker {
  appearance: none;
  display: block;
}`;
  let fragmentSelectors = new Set();
  let flowContainers = {};
  let markers = new Set();
  let flowSelectors = new Set();
  for (let block of blocks) {
    let flow = /^(.*)::grid-flow\(([^)]*)\)$/.exec(block.selector);
    if (flow) {
      // Selector on which grid flow was added.
      const selector = updateSelectors(flow[1]);
      const name = flow[2];
      flowContainers[selector] = flowContainers[selector] || new Set();
      flowContainers[selector].add(name);
    }
    let marker = /^(.*)::scroll-marker$/.exec(block.selector);
    if (marker) {
      const selector = updateSelectors(marker[1]);
      markers.add(selector);
    }
    let mutatedSelector = updateSelectors(block.selector);
    if (mutatedSelector != block.selector) {
      let props = '';
      let pseudoProps = '';
      for (let prop in block.props) {
        if (prop == 'content') {
          pseudoProps += `  ${prop}: ${block.props[prop]};\n`;
        } else {
          props += `  ${prop}: ${block.props[prop]};\n`
        }
      };
      if (props)
        extraCSS += `\n${mutatedSelector} {\n${props}}`;
      if (pseudoProps)
        extraCSS += `\n${updateSelectors(block.selector, true)} {\n${pseudoProps}}`;

    }
    if (block.props['fragment']) {
      extraCSS += `\n${mutatedSelector} {\n  --fragment: ${block.props.fragment}}\n`;
      fragmentSelectors.add(mutatedSelector);
    }
    if (block.props['grid-flow']) {
      extraCSS += `\n${mutatedSelector} {\n  --grid-flow: ${block.props['grid-flow']}}\n`;
      flowSelectors.add(mutatedSelector);
    }
  }
  generated.innerHTML = extraCSS;
  document.head.appendChild(generated);
  for (let selector in flowContainers) {
    for (let elem of document.querySelectorAll(selector)) {
      elem.gridFlows = {};
      for (let area of flowContainers[selector]) {
        let div = document.createElement('div');
        div.className = `grid-flow-${area}`;
        elem.appendChild(div);
        elem.gridFlows[area] = div;
      }
    }
  }
  // Process fragmented elements.
  for (let elem of getElems(fragmentSelectors)) {
    const fragment = getComputedStyle(elem).getPropertyValue('--fragment');
    if (fragment == 'element') {
      new FragmentNode(elem);
    }
  }

  // TODO: Update scroll markers and grid flows when fragmented elements change.

  // Process elements with scroll-markers
  for (let elem of getElems(markers)) {
    let marker = document.createElement('input');
    marker.className = 'scroll-marker';
    marker.setAttribute('type', 'radio');
    // TODO: Auto-select marker that is currently scrolled into view.
    // TODO: Name radio buttons something unique per scrollable area.
    marker.setAttribute('name', 'scroll-marker');
    marker.addEventListener('input', () => {
      elem.scrollIntoView();
    });
    elem.parentElement.insertBefore(marker, elem.nextElementSibling);
  }

  // Process elements with grid-flow
  for (let elem of getElems(flowSelectors)) {
    const gridflow = getComputedStyle(elem).getPropertyValue('--grid-flow');
    const flows = elem.parentElement.gridFlows || {};
    const flow = flows[gridflow];
    if (flow) {
      flow.appendChild(elem);
    }
  }
}
document.addEventListener('DOMContentLoaded', update);
