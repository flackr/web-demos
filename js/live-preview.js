(() => {
  const findExample = (code) => {
    while (code) {
      let example = code.querySelector('iframe');
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
    let textareas = area.querySelectorAll('textarea');
    let types = {};
    let updateTimer = null;
    const update = () => {
      let code = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Example</title>\n</head>\n<body>\n`;
      if (types.css) {
        code += `<style>\n${types.css.value}\n</style>\n`;
      }
      code += `${types.html.value}\n`;
      if (types.js) {
        code += `<script>\n${types.js.value}\n</script>\n`;
      }
      code += `</body>\n</html>`;
      example.srcdoc = code;
      // Alternative way to update doc (not sure if better)
      // const iframeDoc = example.contentDocument || example.contentWindow.document;
      // iframeDoc.open();
      // iframeDoc.write(code);
      // iframeDoc.close();
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
    update();
  }
})();
