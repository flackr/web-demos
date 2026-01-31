/**
 * Live areas can be added either as iframes, e.g.
 * <iframe sandbox="allow-scripts"></iframe>
 * Or as a containing element which contains a set of <style>, <html>..., <script>
 */
(() => {
  const trimEmptyLines = (text) => {
    let start = 0;
    let lineStart = 0;
    while (start < text.length) {
      if (text[start] === '\n') {
        lineStart = start + 1;
      } else if (![' ', '\t'].includes(text[start])) {
        start = lineStart;
        break;
      }
      start++;
    }
    let end = text.length;
    while (end > start && [' ', '\n', '\t'].includes(text[end - 1])) {
      end--;
    }
    return text.substring(start, end);
  }
  const findExample = (code) => {
    while (code) {
      let example = code.querySelector('.live-edit');
      if (example)
        return example;
      code = code.parentElement;
    }
    return null;
  }
  let liveAreas = document.querySelectorAll('.live');
  for (const area of liveAreas) {
    const example = findExample(area);
    if (!example) continue;
    const isiframe = example instanceof HTMLIFrameElement;
    let textareas = area.querySelectorAll('textarea');
    let types = {};
    let updateTimer = null;
    const update = () => {
      let code = '';
      if (types.css) {
        code += `<style>\n${types.css.value}\n</style>\n`;
      }
      code += `${types.html.value}\n`;
      if (isiframe) {
        // Append script.
        if (types.js) {
          code += `<script>\n${types.js.value}\n</script>\n`;
        }
        // Alternative way to update doc (not sure if better)
        // const iframeDoc = example.contentDocument || example.contentWindow.document;
        // iframeDoc.open();
        // iframeDoc.write(code);
        // iframeDoc.close();
        example.srcdoc = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Example</title>\n</head>\n<body>\n${code}</body>\n</html>`;
      } else {
        example.innerHTML = code;
        if (types.js) {
          const scriptTag = document.createElement('script');
          scriptTag.textContent = types.js.value;
          example.appendChild(scriptTag);
        }
      }
      updateTimer = null;
    }
    for (const textarea of textareas) {
      types[textarea.getAttribute('title').toLowerCase()] = textarea;
      textarea.addEventListener('input', () => {
        if (updateTimer) {
          clearTimeout(updateTimer);
        }
        updateTimer = setTimeout(update, 100);
      });
    }
    // Find existing content
    if (!isiframe) {
      let css = example.querySelector('style');
      if (css) {
        types.css.value = trimEmptyLines(css.textContent);
      }
      let script = example.querySelector('script');
      if (script) {
        types.js.value = trimEmptyLines(script.textContent);
      }
      let html = ``;
      let child = css.nextSibling;
      while (child != script) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          html += child.outerHTML;
        } else {
          html += child.textContent;
        }
        child = child.nextSibling;
      }
      types.html.value = trimEmptyLines(html);
    } else {
      update();
    }
  }
})();
