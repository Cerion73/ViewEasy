import React from 'react';

// Simple emoji renderer that wraps native emojis in spans for consistent styling
export const AppleEmoji = ({ native, size = '22px' }) => {
  return <span style={{ fontSize: size, lineHeight: 1 }}>{native}</span>;
};

export const renderContentWithEmojis = (content) => {
  if (!content) return '';
  // Simplified emoji regex that covers most common emojis
  const emojiRegex = /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{1F700}-\u{1F77F}])/gu;
  return content.split(emojiRegex).map((part, index) => {
    if (part && part.match(emojiRegex)) {
      return <AppleEmoji key={index} native={part} size="18px" />;
    }
    return part;
  });
};

export const insertHTMLAtCursor = (html) => {
  const sel = window.getSelection();
  if (sel.getRangeAt && sel.rangeCount) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const el = document.createElement("div");
    el.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node, lastNode;
    while ((node = el.firstChild)) {
      lastNode = frag.appendChild(node);
    }
    range.insertNode(frag);
    if (lastNode) {
      range.setStartAfter(lastNode);
      range.setEndAfter(lastNode);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
};

export const convertHTMLToTextWithEmojis = (html) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Find all em-emoji elements (if any)
  const emojis = div.querySelectorAll('em-emoji');
  emojis.forEach(emoji => {
    const native = emoji.getAttribute('native');
    if (native) {
      // Replace the element with its native text
      emoji.parentNode.replaceChild(document.createTextNode(native), emoji);
    }
  });
  
  return div.textContent.replace(/\u200B/g, '');
};

export const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','😡','🙏','🔥','💯','🎉','💀','🤔'];