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

function update() {
  let generated = document.createElement('style');
  generated.setAttribute('polyfill-generated', 'true');
  let stylesheets = document.querySelectorAll('style:not([polyfill-generated])');
  let blocks = [];
  for (let sheet of stylesheets) {
    blocks = blocks.concat(parseCSS(sheet.innerHTML));
  }
  let extraCSS = '';
  let fragmentElems = new Set();
  for (let block of blocks) {
    if (block.selector.indexOf('::fragment') != -1) {
      let props = '';
      for (let prop in block.props) {
        props += `  ${prop}: ${block.props[prop]};\n`
      };
      extraCSS += `\n${block.selector.replaceAll('::fragment', '>.fragment')} {\n${props}}`;
    }
    if (block.props['fragment']) {
      extraCSS += `\n${block.selector} {\n  --fragment: ${block.props.fragment}}\n`;
      for (let elem of document.querySelectorAll(block.selector)) {
        fragmentElems.add(elem);
      }
    }
  }
  generated.innerHTML = extraCSS;
  document.head.appendChild(generated);
  for (let elem of fragmentElems) {
    const fragment = getComputedStyle(elem).getPropertyValue('--fragment');
    if (fragment == 'node') {
      new FragmentNode(elem);
    }
  }
}
document.addEventListener('DOMContentLoaded', update);
