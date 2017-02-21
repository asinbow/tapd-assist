let patchURLLink = function (root) {
  let replaceLinkInText = function (node) {
    let text = node.data;
    let splits = text.split(/[ \t\r\n]+/);

    let children = [];
    let index0 = 0;
    splits.forEach(function (split) {
      let index = text.indexOf(split, index0);
      if (index < 0) { // should not
        console.error('[tapd_assist] find sub string failed', text, split);
        return;
      }
      let url;
      try {
        url = new URL(split);
      } catch (err) {
        return;
      }

      if (index > index0) {
        let str = text.substring(index0, index);
        children.push(document.createTextNode(str));
      }

      let a = document.createElement('a');
      a.href = split;
      a.textContent = decodeURIComponent(split);
      if (['https:', 'http:'].indexOf(a.protocol)) {
        a.title = '点击打开' + a.protocol + '//协议';
      }
      children.push(a);

      index0 = index + split.length;
    });

    if (children.length === 0) {
      return; // no matched url
    }

    let span = document.createElement('span');
    children.forEach(function (child) {
      span.appendChild(child);
    });

    if (text.length > index0) {
      let str = text.substring(index0);
      span.appendChild(document.createTextNode(str));
    }
    return span;
  };


  let detectAndReplaceLink;
  
  detectAndReplaceLink = function (parent) {
    let childNodes = parent.childNodes;
    childNodes.forEach(function (node) {
      detectAndReplaceLink(node);

      if (parent.nodeName.toLowerCase() !== 'a' && node.nodeName.toLowerCase() === '#text') {
        let newNode = replaceLinkInText(node);
        if (newNode) {
          parent.insertBefore(newNode, node);
          parent.removeChild(node);
        }
      }
    });
  };

  detectAndReplaceLink(root);
}

let PROJECT_SHORTCUTS = {};

let patchProjects = function () {
  let root = document.getElementById('myprojects-list');
  if (!root) {
    console.warn('[tapd_assist] #myprojects-list not found');
    return;
  }

  let projects = $(root).children('li');
  let shortcuts = {};
  for (let i = 0; i < projects.length; i++) {
    let index = i + 1;
    let li = projects[i];
    if ($(li).hasClass('iamloaded')) {
      continue;
    }
    li.style.position = 'relative';

    let span = document.createElement('span');
    span.className = 'assist-project-index';
    span.textContent = index;
    li.appendChild(span);

    let anchor = $(li).children('a')[0];
    if (anchor) {
      anchor.setAttribute('project-index', i + 1);
      shortcuts['Alt+' + index] = function () {
        anchor.click();
        span.textContent = '\u2713';
        li.style.backgroundColor = '#303236';
      }
    }
  }
  PROJECT_SHORTCUTS = shortcuts;
}

patchProjects();

let bodyDOMObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.target.id === 'General_div' && mutation.addedNodes.length) {
      let root = document.getElementById('description_div');
      if (root) {
        patchURLLink(root);
      } else {
        console.warn('[tapd_assist] #description_div not found');
      }
    } else if (mutation.target.id === 'myprojects-list' && mutation.addedNodes.length) {
      patchProjects();
    }
  });
});

bodyDOMObserver.observe(document.body, {
  childList: true,
  subtree: true
});

const SHORTCUTS = {
  'Alt+Escape': '#left-tree-handle2',
  'Alt+C': '#create-project',
  'Alt+W': '#top_nav_worktable',
  'Alt+M': '#top_nav_worktable_msg',
  'Alt+H|Alt+ArrowLeft': function () {
    let element = $('.page-btn.page-prev');
    let anchor = element.children('a');
    if (anchor.length) {
      element = anchor;
    }
    let element1 = element[0];
    if (element1) {
      element1.click();
    }
  },
  'Alt+L|Alt+ArrowRight': function () {
    let element = $('.page-btn.page-next');
    let anchor = element.children('a');
    if (anchor.length) {
      element = anchor;
    }
    let element1 = element[0];
    if (element1) {
      element1.click();
    }
  },
  'Alt+F': function (e) {
    e.preventDefault();
    $('#search-keyword').focus().select();
  },
};

let executeShortcuts = function (shortcuts, e) {
  for (let key in shortcuts) {
    let handler = shortcuts[key];
    let keys = key.split('|');
    keys.forEach(function (key) {
      let splits = key.split('+').map(function (split) {return split.toLowerCase()});
      let checkFKey = function (key) {
        let index = splits.indexOf(key);
        let down = e[key + 'Key'];
        if (index >= 0) {
          splits.splice(index, 1);
          return down;
        }
        return !down;
      };
      let code = e.code;
      if (code.startsWith('Key')) {
        code = code.substr(3);
      } else if (code.startsWith('Digit')) {
        code = code.substr(5);
      }
      let matched = checkFKey('alt')
        && checkFKey('shift')
        && checkFKey('ctrl')
        && checkFKey('meta')
        && splits.length === 1
        && splits[0] === code.toLowerCase()
      ;
      if (!matched) {
        return;
      }
      if (typeof handler === 'string') {
        let element = $(handler)[0];
        if (element) {
          element.click();
        } else {
          console.warn('Invalid shortcut handler: document.getElementById empty', handler);
        }
      } else if (typeof handler === 'function') {
        handler(e);
      } else {
        console.warn('Invalid shortcut handler', typeof handler, handler);
      }
    });
  }
}

document.addEventListener('keydown', function (e) {
  executeShortcuts(SHORTCUTS, e);
  executeShortcuts(PROJECT_SHORTCUTS, e);
});

// bodyDOMObserver.disconnect();

chrome.extension.sendMessage({
  type: 'setTabIcon',
  path: {
      "16": "image/main_icon_16.png",
      "24": "image/main_icon_24.png",
      "32": "image/main_icon_32.png"
  }
});

