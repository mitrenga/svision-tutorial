/* The shell's behaviour: a topic from the list and a platform from the bar
   pick the demo; the iframe and the address change without a reload, the
   browser's back and forward follow, the platform chosen is remembered and
   kept across topics where the topic has it. On a narrow screen the menu
   button opens the list over the content. */

(function() {
  var shell = window.shell || {platforms: {}, topics: []};
  var frame = document.getElementById('demoFrame');
  var list = document.getElementById('demoList');
  var bar = document.getElementById('platformBar');
  var blurb = document.getElementById('blurb');
  var openLink = document.getElementById('openLink');
  var currentTitle = document.getElementById('currentTitle');
  var menuButton = document.getElementById('menuButton');
  var backdrop = document.getElementById('backdrop');
  var STORAGE = 'svision-tutorial.platform';

  function topicOf(id) {
    for (var i = 0; i < shell.topics.length; i++) {
      if (shell.topics[i].id == id) {
        return shell.topics[i];
      }
    }
    return shell.topics[0];
  }

  function remembered() {
    try { return localStorage.getItem(STORAGE); } catch (e) { return null; }
  }

  function remember(platform) {
    try { localStorage.setItem(STORAGE, platform); } catch (e) {}
  }

  /** the platform for a topic: the one asked for, else the remembered one, else the topic's first */
  function platformFor(topic, wanted) {
    if (wanted && topic.platforms.indexOf(wanted) >= 0) {
      return wanted;
    }
    var kept = remembered();
    if (kept && topic.platforms.indexOf(kept) >= 0) {
      return kept;
    }
    return topic.platforms[0];
  }

  var WAIT_LIMIT = 8000;   // ms; a demo that never draws is shown anyway, with whatever it says
  var waiting = 0;         // the number of the current wait; a newer one cancels the older

  function frameDocument() {
    try { return frame.contentDocument; } catch (e) { return null; }
  }

  /** hide the iframe — the linen of .frame shows — until the document that
      replaces the present one has its canvas or svg, i.e. the demo has drawn */
  function waitForDemo() {
    var wait = ++waiting;
    var previous = frameDocument();
    var started = Date.now();
    frame.classList.add('waiting');
    function check() {
      if (wait != waiting) {
        return;
      }
      var doc = frameDocument();
      var drawn = doc && doc !== previous && doc.body && doc.body.querySelector('canvas, svg');
      if (drawn || Date.now()-started > WAIT_LIMIT) {
        frame.classList.remove('waiting');
        return;
      }
      requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  }

  function show(topicId, platformId, pushState) {
    var topic = topicOf(topicId);
    var platform = platformFor(topic, platformId);
    var src = 'demos/'+topic.id+'/'+platform+'/';
    if (frame.getAttribute('src') != src) {
      waitForDemo();
      frame.setAttribute('src', src);
    }
    shown = {topic: topic, platform: platform, src: src};
    blurb.textContent = (topic.blurbs && topic.blurbs[platform]) || topic.blurb;
    openLink.setAttribute('href', src);
    currentTitle.textContent = topic.title+' · '+shell.platforms[platform];
    document.title = topic.title+' ('+shell.platforms[platform]+') — svision tutorial';

    var links = list.querySelectorAll('a[data-topic]');
    for (var i = 0; i < links.length; i++) {
      var active = links[i].getAttribute('data-topic') == topic.id;
      links[i].classList.toggle('active', active);
      if (active) {
        links[i].setAttribute('aria-current', 'page');
      } else {
        links[i].removeAttribute('aria-current');
      }
      links[i].setAttribute('href', '?demo='+links[i].getAttribute('data-topic')+'&platform='+platform);
    }
    var buttons = bar.querySelectorAll('button[data-platform]');
    for (var j = 0; j < buttons.length; j++) {
      var id = buttons[j].getAttribute('data-platform');
      var has = topic.platforms.indexOf(id) >= 0;
      buttons[j].hidden = !has;
      buttons[j].classList.toggle('active', id == platform);
      buttons[j].setAttribute('aria-pressed', id == platform ? 'true' : 'false');
    }
    remember(platform);
    if (pushState) {
      history.pushState({topic: topic.id, platform: platform}, '', '?demo='+topic.id+'&platform='+platform);
    }
  }

  // ---- the source viewer: the files of the demo shown as a tree (source.php),
  // the chosen one beside it. The tree is read when the dialog opens, a file
  // when it is picked; a picture comes from the demo's own address.

  var shown = null;        // {topic, platform, src} of the demo in the iframe
  var sourceLoad = 0;      // the number of the current read; a newer one cancels the older
  var sourceButton = document.getElementById('sourceButton');
  var sourceDialog = document.getElementById('sourceDialog');
  var sourceClose = document.getElementById('sourceClose');
  var sourceTitle = document.getElementById('sourceTitle');
  var sourceTree = document.getElementById('sourceTree');
  var sourcePath = document.getElementById('sourcePath');
  var sourceView = document.getElementById('sourceView');

  var ICONS = {
    chevron: 'M6 9l6 6 6-6',
    dir: 'M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
    file: 'M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v4h4',
    image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5h.01',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'
  };

  function icon(name, size) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('aria-hidden', 'true');
    if (name == 'chevron') {
      svg.setAttribute('class', 'chevron');
    }
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', ICONS[name]);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }

  function sourceURL(file) {
    return 'source.php?demo='+encodeURIComponent(shown.topic.id)+'&platform='+encodeURIComponent(shown.platform)+
      (file ? '&file='+encodeURIComponent(file) : '');
  }

  function sourceMessage(text) {
    var p = document.createElement('p');
    p.className = 'message';
    p.textContent = text;
    sourceView.replaceChildren(p);
  }

  function sizeText(bytes) {
    return bytes < 1024 ? bytes+' B' : (bytes/1024).toFixed(1)+' KB';
  }

  /** the entries of one directory as a list; a directory holds the list of its own */
  function treeList(entries) {
    var ul = document.createElement('ul');
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var li = document.createElement('li');
      var row;
      var name = document.createElement('span');
      name.textContent = entry.name;
      if (entry.type == 'dir') {
        li.className = 'dir';
        row = document.createElement('button');
        row.type = 'button';
        row.setAttribute('aria-expanded', 'true');
        row.appendChild(icon('chevron', 14));
        row.appendChild(icon('dir', 16));
        name.textContent = entry.name+'/';
        row.appendChild(name);
        li.appendChild(row);
        li.appendChild(treeList(entry.children));
      } else if (entry.type == 'link') {
        row = document.createElement('div');
        row.classList.add('link');
        row.appendChild(icon('link', 16));
        var note = document.createElement('span');
        note.className = 'note';
        note.textContent = entry.note;
        name.textContent = entry.name+'/';
        name.appendChild(note);
        row.appendChild(name);
        li.appendChild(row);
      } else {
        row = document.createElement('button');
        row.type = 'button';
        row.setAttribute('data-file', entry.path);
        row.setAttribute('data-kind', entry.kind);
        row.setAttribute('data-size', entry.size);
        row.appendChild(icon(entry.kind == 'image' ? 'image' : 'file', 16));
        row.appendChild(name);
        if (entry.generated) {
          // made by a tool, not written: marked in the tree, explained over the file
          row.setAttribute('data-generated', entry.generated);
          row.title = entry.generated;
          var tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = 'generated';
          row.appendChild(tag);
        }
        li.appendChild(row);
      }
      row.classList.add('entry');
      ul.appendChild(li);
    }
    return ul;
  }

  function generatedNote(text) {
    var p = document.createElement('p');
    p.className = 'generated';
    p.textContent = text;
    return p;
  }

  function showFile(row) {
    var load = ++sourceLoad;
    var file = row.getAttribute('data-file');
    var active = sourceTree.querySelector('.entry.active');
    if (active) {
      active.classList.remove('active');
      active.removeAttribute('aria-current');
    }
    row.classList.add('active');
    row.setAttribute('aria-current', 'true');
    var generated = row.getAttribute('data-generated');
    sourcePath.textContent = file+' · '+sizeText(Number(row.getAttribute('data-size')));
    sourceView.scrollTop = 0;
    sourceView.scrollLeft = 0;

    if (row.getAttribute('data-kind') == 'image') {
      var box = document.createElement('div');
      box.className = 'picture';
      var img = document.createElement('img');
      img.alt = file;
      img.src = shown.src+file;
      box.appendChild(img);
      if (generated) {
        sourceView.replaceChildren(generatedNote(generated), box);
      } else {
        sourceView.replaceChildren(box);
      }
      return;
    }
    sourceMessage('Loading…');
    fetch(sourceURL(file)).then(function(response) {
      return response.text().then(function(text) {
        if (load != sourceLoad) {
          return;
        }
        if (!response.ok) {
          sourceMessage(text || 'The file cannot be shown.');
          return;
        }
        var pre = document.createElement('pre');
        if (window.sourceTokens && window.sourceHighlights(file)) {
          // coloured as an editor would (sourceHighlight.js): a span a token, plain text between
          var tokens = window.sourceTokens(text, file);
          for (var i = 0; i < tokens.length; i++) {
            if (tokens[i][0] === null) {
              pre.appendChild(document.createTextNode(tokens[i][1]));
            } else {
              var span = document.createElement('span');
              span.className = 't-'+tokens[i][0];
              span.textContent = tokens[i][1];
              pre.appendChild(span);
            }
          }
        } else {
          pre.textContent = text;
        }
        sourceView.replaceChildren(pre);
      });
    }).catch(function() {
      if (load == sourceLoad) {
        sourceMessage('The file cannot be read.');
      }
    });
  }

  function openSources() {
    if (!shown || !sourceDialog.showModal) {
      return;
    }
    var load = ++sourceLoad;
    sourceTitle.textContent = 'Source files — '+shown.topic.title+' · '+shell.platforms[shown.platform];
    sourceTree.replaceChildren();
    sourcePath.textContent = shown.src;
    sourceMessage('Loading…');
    sourceDialog.showModal();
    fetch(sourceURL(null)).then(function(response) {
      if (!response.ok) {
        throw new Error('source');
      }
      return response.json();
    }).then(function(data) {
      if (load != sourceLoad) {
        return;
      }
      sourceTree.replaceChildren(treeList(data.tree));
      // the place to start reading an application is its main.js
      var first = sourceTree.querySelector('[data-file="app/main.js"]') || sourceTree.querySelector('[data-file]');
      if (first) {
        showFile(first);
      } else {
        sourceMessage('The demo has no files to show.');
      }
    }).catch(function() {
      if (load == sourceLoad) {
        sourceMessage('The list of files cannot be read.');
      }
    });
  }

  sourceButton.addEventListener('click', openSources);
  sourceClose.addEventListener('click', function() { sourceDialog.close(); });
  sourceDialog.addEventListener('click', function(event) {
    if (event.target === sourceDialog) {     // a click on the backdrop, outside the dialog's box
      sourceDialog.close();
    }
  });
  sourceDialog.addEventListener('close', function() {
    sourceLoad++;
    try { frame.contentWindow.focus(); } catch (e) {}   // the keyboard back to the demo
  });
  sourceTree.addEventListener('click', function(event) {
    var row = event.target.closest('button.entry');
    if (!row) {
      return;
    }
    if (row.hasAttribute('data-file')) {
      showFile(row);
    } else {
      var closed = row.parentNode.classList.toggle('closed');
      row.setAttribute('aria-expanded', closed ? 'false' : 'true');
    }
  });

  function openMenu() {
    document.body.classList.add('menu-open');
    menuButton.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }

  list.addEventListener('click', function(event) {
    var link = event.target.closest('a[data-topic]');
    if (!link) {
      return;
    }
    event.preventDefault();
    show(link.getAttribute('data-topic'), null, true);
    closeMenu();
  });

  bar.addEventListener('click', function(event) {
    var button = event.target.closest('button[data-platform]');
    if (!button) {
      return;
    }
    var state = history.state || {};
    show(state.topic || shell.topic, button.getAttribute('data-platform'), true);
    closeMenu();
  });

  menuButton.addEventListener('click', function() {
    if (document.body.classList.contains('menu-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  backdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function(event) {
    if (event.key == 'Escape') {
      closeMenu();
    }
  });

  window.addEventListener('popstate', function(event) {
    var params = new URLSearchParams(location.search);
    var state = event.state || {};
    show(state.topic || params.get('demo') || shell.topic, state.platform || params.get('platform'), false);
  });

  // the demo takes the keyboard once it is loaded
  frame.addEventListener('load', function() {
    try { frame.contentWindow.focus(); } catch (e) {}
  });

  // the page came with the server's choice; the remembered platform wins when the address names none
  var params = new URLSearchParams(location.search);
  var start = platformFor(topicOf(shell.topic), params.get('platform'));
  history.replaceState({topic: shell.topic, platform: start}, '', '?demo='+shell.topic+'&platform='+start);
  show(shell.topic, start, false);
})();
