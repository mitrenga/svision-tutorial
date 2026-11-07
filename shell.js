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

  function show(topicId, platformId, pushState) {
    var topic = topicOf(topicId);
    var platform = platformFor(topic, platformId);
    var src = 'demos/'+topic.id+'/'+platform+'/';
    if (frame.getAttribute('src') != src) {
      frame.setAttribute('src', src);
    }
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
