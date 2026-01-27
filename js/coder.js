(() => {
  const unindent = (textarea) => {
    let firstLine = 0;
    let firstText = 0;
    const text = textarea.value;
    while (firstText < text.length) {
      if (![' ', '\n'].includes(text[firstText])) {
        break;
      }
      if (text[firstText] === '\n') {
        firstLine = firstText + 1;
      }
      firstText++;
    }
    let lastLine = text.length;
    while (lastLine > firstText && [' ', '\n'].includes(text[lastLine - 1])) {
      lastLine--;
    }
    textarea.value = text.slice(firstLine, lastLine);
    indent(textarea, firstLine - firstText, 0, textarea.value.length);
  }
  const findLineStart = (text, pos) => {
    while (pos > 0 && text[pos - 1] !== '\n') {
      pos--;
    }
    return pos;
  }
  // Indents or unindents code by |spaces|. If spaces is negatives, spaces are removed.
  const indent = (textarea, spaces, start, end) => {
    let result = '';
    let copied = 0;
    const interactive = start === undefined && end === undefined;
    if (interactive) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
    }
    const range = start != end;
    const text = textarea.value;
    let lineStart = findLineStart(text, start);
    let selstart = textarea.selectionStart;
    let selend = textarea.selectionEnd;
    if (range || spaces < 0) {
      // Align start with start of a line.
      start = lineStart;
      while (start < end && text[start] == ' ') {
        start++;
      }
    }
    let modificationStart = start;
    copied = modificationStart;
    // Find the start of each line and indent by spaces or remove if negative.
    while (!range || lineStart < end) {
      let amt = 0;
      if (spaces > 0) {
        // Align to the next |spaces| indent.
        amt = spaces - (start - lineStart) % spaces;
        result += text.slice(copied, start) + ' '.repeat(amt);
        copied = start;
        if (selstart >= start) selstart += amt;
        if (selend >= start) selend += amt;
      } else {
        let amt = 0;
        while (start + amt > 0 && amt > spaces && text[start + amt - 1] === ' ') {
          amt--;
        }
        result += text.slice(copied, start + amt);
        // Extend modification start if needed to outdent.
        modificationStart = Math.min(modificationStart, start + amt);
        copied = start;
        if (selstart > start + amt) selstart = Math.max(selstart + amt, start + amt);
        if (selend > start + amt) selend = Math.max(selend + amt, start + amt);
      }
      if (!range) {
        break;
      }
      while (start < end && text[start] !== '\n')
        start++;
      start++;
      lineStart = start;
      while (start < text.length && text[start] == ' ') {
        start++;
      }
    }
    if (interactive) {
      textarea.setSelectionRange(modificationStart, copied);
      document.execCommand('insertText', false, result);
    } else {
      textarea.value = text.slice(0, modificationStart) + result + text.slice(copied, text.length);
    }
    textarea.setSelectionRange(selstart, selend);
  }
  let codeAreas = document.querySelectorAll('.code textarea, textarea.code');
  for (const textarea of codeAreas) {
    // Remove extra indentation in source.
    unindent(textarea);
    // Helper indentation functions
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        indent(textarea, e.shiftKey ? -2 : 2);
      }
    });
  }
})();
