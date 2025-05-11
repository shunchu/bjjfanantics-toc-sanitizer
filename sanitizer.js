/**
 * Converts a string to title case, keeping small words lowercase unless they're the first or last word
 * @param {string} str - The string to convert to title case
 * @returns {string} The title-cased string
 */
const titleCase = (str) => {
  const smallWords = ['a','an','the','and','but','or','for','nor','so','yet','at','by','in','of','on','to','up','with','as','for','per','vs'];
  const words = str.toLowerCase().split(' ').filter(Boolean);
  
  return words.map((word, i) => {
    if (i !== 0 && i !== words.length - 1 && smallWords.includes(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

/**
 * Sanitizes and formats BJJ Fanatics table of contents text
 */
const sanitizeText = () => {
  const input = document.getElementById('inputText').value;
  const outputEl = document.getElementById('output');
  const lines = input.split(/\r?\n/);

  // Preprocess: remove keywords, trim
  let preLines = [];
  for (let line of lines) {
    line = line.replace(/CHAPTER TITLE/g, '')
               .replace(/START TIME/g, '')
               .trim();
    preLines.push(line);
  }

  // Split into blocks
  let blocks = [];
  let cur = [];
  preLines.forEach(line => {
    if (line === '') {
      blocks.push(cur);
      blocks.push(['']);
      cur = [];
    } else {
      cur.push(line);
    }
  });
  if (cur.length) blocks.push(cur);

  // Process each block
  let outLines = [];
  // Track header status across blocks for blank-line suppression
  let prevWasHeader = false;
  blocks.forEach(block => {
    // Find all timestamps in this block and determine if any are H:MM:SS
    let hasLongTs = block.some(line => /\b\d{1,2}:\d{2}:\d{2}\b/.test(line));
    block.forEach(line => {
      if (!line.trim()) {
        // remove blank immediately after header (skip blank)
        if (prevWasHeader) {
          // do not reset prevWasHeader here, so consecutive blanks after header are all skipped
          return;
        }
        // normal blank separator
        if (outLines.length && outLines[outLines.length - 1] !== '') {
          outLines.push('');
        }
        return;
      }
      // Header line
      if (/^(Volume|DVD)\s*\d+/i.test(line)) {
        // blank above header
        if (outLines.length && outLines[outLines.length - 1] !== '') {
          outLines.push('');
        }
        outLines.push(titleCase(line));
        prevWasHeader = true;
        return;
      }
      // Timestamped line
      // Also match any 3-digit timestamp (e.g., 123)
      let m = line.match(/\d{1,2}(?::\d{2}){1,2}|\b\d{3}\b/);
      if (m) {
        let tsRaw = m[0];
        // If it's a 3-digit number (no colon), pad with leading zero
        if (/^\d{3}$/.test(tsRaw)) {
          tsRaw = '0' + tsRaw;
        }
        let parts = tsRaw.split(':');
        // Pad to H:MM:SS if needed for uniformity in this block
        if (hasLongTs && parts.length === 2) {
          tsRaw = `0:${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}`;
        } else if (parts.length === 2) {
          // Always pad MM:SS to 00:00
          tsRaw = `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}`;
        }
        let content = line.slice(0, m.index)
          .replace(/[-–+\(\)]*$/, '')
          .trim()
          .replace(/\s+/g, ' ');
        outLines.push(`${tsRaw} - ${titleCase(content)}`);
      }
      prevWasHeader = false;
    });
  });

  let result = outLines.join('\n').trim();
  outputEl.textContent = result;
  // Show copy button and setup clipboard functionality
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.style.display = 'inline-flex';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(result)
        .then(() => showNotification())
        .catch(err => console.error('Could not copy text: ', err));
    };
  }
};

/**
 * Shows a notification that text has been copied to clipboard
 */
const showNotification = () => {
  const notification = document.getElementById('notification');
  notification.classList.add('show');
  
  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
};

// Initialize event listeners when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const sanitizeBtn = document.getElementById('sanitizeBtn');
  if (sanitizeBtn) {
    sanitizeBtn.addEventListener('click', sanitizeText);
  }
});
