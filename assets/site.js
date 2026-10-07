/* Theme switch stores one preference shared by the portfolio and archive pages. */
(() => {
  'use strict';
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  const key = 'jasbir-jassi-theme';
  const meta = document.querySelector('meta[name="theme-color"]');
  function apply(theme) {
    const light = theme === 'light';
    root.dataset.theme = light ? 'light' : 'dark';
    button?.setAttribute('aria-checked', String(light));
    button?.setAttribute('title', light ? 'Switch to dark theme' : 'Switch to light theme');
    if (meta) meta.setAttribute('content', light ? '#f5f3ef' : '#08090b');
  }
  apply(root.dataset.theme || 'dark');
  button?.addEventListener('click', () => {
    const theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    apply(theme);
    try {localStorage.setItem(key, theme);} catch (_) { /* Theme still works if storage is unavailable. */ }
  });
})();

/* Keep both artwork carousels in one compact, keyboard-accessible tab group. */
(() => {
  'use strict';
  document.querySelectorAll('[data-music-catalogue]').forEach(catalogue => {
    const panels = Array.from(catalogue.querySelectorAll('[data-music-panel]'));
    const tabs = Array.from(catalogue.querySelectorAll('[data-music-tab]'));
    const positions = panels.map(() => 0);
    let active = 0;
    function select(index, focus = false) {
      const next = (index + panels.length) % panels.length;
      positions[active] = panels[active].querySelector('.carousel-track').scrollLeft;
      if (next !== active) {
        panels[active].classList.remove('is-entering');
      }
      active = next;
      panels.forEach((panel,i) => {panel.hidden = i !== active;});
      tabs.forEach((tab,i) => {
        tab.setAttribute('aria-selected', String(i === active));
        tab.tabIndex = i === active ? 0 : -1;
      });
      const track = panels[active].querySelector('.carousel-track');
      // Read layout after unhiding, then restore this category's own position.
      void track.offsetWidth;
      track.scrollTo({left:positions[active],behavior:'instant'});
      track.dispatchEvent(new Event('carousel:refresh'));
      panels[active].classList.remove('is-entering');
      void panels[active].offsetWidth;
      panels[active].classList.add('is-entering');
      if (focus) tabs[active].focus();
    }
    tabs.forEach((tab,index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();select(active + (event.key === 'ArrowRight' ? 1 : -1),true);
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();select(event.key === 'Home' ? 0 : panels.length - 1,true);
        }
      });
    });
    panels.forEach(panel => panel.addEventListener('animationend', () => panel.classList.remove('is-entering')));
    select(0);
  });
})();

/* Jasbir Jassi portfolio — no frameworks or automatic carousel movement. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionBehavior = () => reducedMotion.matches ? 'instant' : 'smooth';
  const links = Array.from(document.querySelectorAll('.nav-link'));
  const localLinks = links.filter(link => link.getAttribute('href').startsWith('#'));
  const sections = localLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const nav = document.querySelector('.side-nav');
  const label = document.getElementById('current-section');
  const progress = document.querySelector('.reading-progress');
  const menu = document.querySelector('.menu-toggle');
  const backdrop = document.querySelector('.menu-backdrop');
  let activeId = '';
  let sectionFrame = 0;

  function activate(id) {
    const current = links.find(link => link.getAttribute('href') === '#' + id);
    if (!current) return;
    if (activeId !== id) {
      activeId = id;
      links.forEach(link => {
        const active = link === current;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      label.textContent = current.textContent.trim();
    }
    nav.style.setProperty('--marker-y', current.offsetTop + 'px');
    nav.style.setProperty('--marker-h', current.offsetHeight + 'px');
  }
  function updateSection() {
    sectionFrame = 0;
    const max = Math.max(0, root.scrollHeight - window.innerHeight);
    const anchor = window.scrollY + Math.min(window.innerHeight * .32, 260);
    let active = sections[0];
    sections.forEach(section => {
      if (section.getBoundingClientRect().top + window.scrollY <= anchor) active = section;
    });
    if (sections.length > 1 && max > 0 && window.scrollY >= max - 6) active = sections.at(-1);
    if (active) activate(active.id);
    progress.style.transform = 'scaleX(' + (max ? Math.min(1, Math.max(0, window.scrollY / max)) : 0) + ')';
  }
  function scheduleSection() {
    if (!sectionFrame) sectionFrame = requestAnimationFrame(updateSection);
  }
  function setMenu(open, focusBack = false) {
    document.body.dataset.menuOpen = String(open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (open) (links.find(link => link.classList.contains('is-active')) || links[0]).focus();
    else if (focusBack) menu.focus();
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      setMenu(false);
      target.scrollIntoView({ behavior: motionBehavior(), block:'start' });
      target.focus({ preventScroll:true });
      activate(target.id);
      try { history.replaceState(null, '', href); } catch (_) { /* Local previews can restrict history writes. */ }
    });
  });
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  backdrop.addEventListener('click', () => setMenu(false, true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.dataset.menuOpen === 'true') setMenu(false, true);
    if (event.key === 'Tab' && document.body.dataset.menuOpen === 'true') {
      const first = menu, last = links.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('scroll', scheduleSection, {passive:true});
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) setMenu(false);
    scheduleSection();
  }, {passive:true});
  window.addEventListener('load', scheduleSection, {once:true});
  if (document.fonts?.ready) document.fonts.ready.then(scheduleSection);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleSection).observe(document.querySelector('.page'));
  updateSection();

  /* Every carousel responds only to arrows, keys, dragging, scrolling or swipe. */
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const items = Array.from(track.querySelectorAll('.carousel-item'));
    const previous = carousel.querySelector('[data-prev]');
    const next = carousel.querySelector('[data-next]');
    const counter = carousel.querySelector('.carousel-counter');
    let scrollFrame = 0;
    let drag = null;
    let suppressClickUntil = 0;

    function update() {
      scrollFrame = 0;
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      previous.disabled = track.scrollLeft <= 3;
      next.disabled = track.scrollLeft >= max - 3;
      const rect = track.getBoundingClientRect();
      const visible = items.map((item,index) => ({rect:item.getBoundingClientRect(),index}))
        .filter(item => item.rect.right > rect.left + 8 && item.rect.left < rect.right - 8);
      const first = visible.length ? visible[0].index + 1 : 1;
      const last = visible.length ? visible.at(-1).index + 1 : items.length;
      counter.textContent = first + '–' + last + ' / ' + items.length;
    }
    function schedule() { if (!scrollFrame) scrollFrame = requestAnimationFrame(update); }
    function move(direction) {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 18;
      track.scrollBy({left:direction * (track.clientWidth + gap),behavior:motionBehavior()});
    }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', schedule, {passive:true});
    track.addEventListener('carousel:refresh', schedule);
    track.addEventListener('keydown', event => {
      if (event.target !== track) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        track.scrollTo({left:event.key === 'Home' ? 0 : track.scrollWidth,behavior:motionBehavior()});
      }
    });
    track.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('.carousel-arrow')) return;
      drag = {x:event.clientX,left:track.scrollLeft,id:event.pointerId,moved:false};
    });
    track.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const delta = event.clientX - drag.x;
      if (!drag.moved && Math.abs(delta) > 6) {
        drag.moved = true;
        track.setPointerCapture(event.pointerId);
        track.classList.add('is-dragging');
      }
      if (drag.moved) {
        event.preventDefault();
        track.scrollLeft = drag.left - delta;
        schedule();
      }
    });
    function stopDrag(event) {
      if (!drag || event.pointerId !== drag.id) return;
      if (drag.moved) suppressClickUntil = performance.now() + 300;
      track.classList.remove('is-dragging');
      if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
      drag = null;
      schedule();
    }
    track.addEventListener('pointerup', stopDrag);
    track.addEventListener('pointercancel', stopDrag);
    track.addEventListener('pointerleave', event => { if (drag && !drag.moved) stopDrag(event); });
    track.addEventListener('click', event => {
      if (performance.now() < suppressClickUntil) {event.preventDefault();event.stopPropagation();}
    }, true);
    track.addEventListener('dragstart', event => event.preventDefault());
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(track);
    else window.addEventListener('resize', schedule, {passive:true});
    window.addEventListener('load', schedule, {once:true});
    update();
  });

  /* Archive category filters preserve all downloaded items. */
  document.querySelectorAll('[data-archive]').forEach(archive => {
    const filters = Array.from(archive.querySelectorAll('[data-filter]'));
    const items = Array.from(archive.querySelectorAll('[data-category]'));
    const result = archive.querySelector('.archive-result');
    filters.forEach(button => {
      button.addEventListener('click', () => {
        filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
        const selected = button.dataset.filter;
        items.forEach(item => {item.hidden = selected !== 'all' && item.dataset.category !== selected;});
        const visible = items.filter(item => !item.hidden).length;
        result.textContent = visible + (archive.dataset.archive === 'press' ? ' clippings' : ' photos');
      });
    });
  });

  /* Full-size photos and press scans stay inside these new pages. */
  const dialog = document.querySelector('.lightbox');
  if (dialog) {
    const image = dialog.querySelector('.lightbox-image');
    const title = dialog.querySelector('.lightbox-title');
    const frame = dialog.querySelector('.lightbox-frame');
    const close = dialog.querySelector('[data-close-lightbox]');
    const previous = dialog.querySelector('[data-lightbox-prev]');
    const next = dialog.querySelector('[data-lightbox-next]');
    const counter = dialog.querySelector('.carousel-counter');
    const zoom = dialog.querySelector('.lightbox-zoom');
    const original = dialog.querySelector('.lightbox-original');
    const triggers = Array.from(document.querySelectorAll('[data-lightbox]'));
    let group = [], index = 0, openedFrom = null;
    function show() {
      const item = group[index];
      const full = item.dataset.full || item.querySelector('img').src;
      image.src = full;
      image.alt = item.dataset.caption || 'Jasbir Jassi';
      title.textContent = item.dataset.caption || 'Jasbir Jassi';
      original.href = full;
      const sourceLink = dialog.querySelector('.lightbox-source');
      sourceLink.hidden = !item.dataset.article;
      sourceLink.href = item.dataset.article || '#';
      counter.textContent = (index + 1) + ' / ' + group.length;
      previous.disabled = index === 0;
      next.disabled = index === group.length - 1;
      frame.classList.remove('is-zoomed');
      zoom.textContent = 'Zoom in';
      zoom.setAttribute('aria-pressed','false');
      frame.scrollTop = 0;
      frame.scrollLeft = 0;
    }
    function move(direction) {index = Math.max(0,Math.min(group.length - 1,index + direction));show();}
    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const type = trigger.dataset.lightbox;
        group = triggers.filter(item => item.dataset.lightbox === type && !item.closest('[hidden]'));
        index = group.indexOf(trigger);
        openedFrom = trigger;
        show();
        dialog.showModal();
        close.focus();
      });
    });
    close.addEventListener('click', () => dialog.close());
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    zoom.addEventListener('click', () => {
      const enlarged = frame.classList.toggle('is-zoomed');
      zoom.textContent = enlarged ? 'Fit image' : 'Zoom in';
      zoom.setAttribute('aria-pressed',String(enlarged));
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {event.preventDefault();move(-1);}
      if (event.key === 'ArrowRight') {event.preventDefault();move(1);}
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {image.removeAttribute('src');openedFrom?.focus();});
  }

  /* Progressive entry animation; static content stays visible without JS. */
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    root.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}
      });
    }, {threshold:.04,rootMargin:'0px 0px -25px 0px'});
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }

  /* A quiet trailing ring follows fine mouse pointers, never touch or reduced motion. */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const ring = document.querySelector('.cursor-ring');
  const dot = document.querySelector('.cursor-dot');
  if (ring && dot && finePointer.matches && !reducedMotion.matches) {
    let mouseX = -100, mouseY = -100, x = -100, y = -100, cursorFrame = 0;
    function follow() {
      x += (mouseX - x) * .18;
      y += (mouseY - y) * .18;
      ring.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
      dot.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0) translate(-50%,-50%)';
      if (Math.abs(mouseX - x) + Math.abs(mouseY - y) > .15) cursorFrame = requestAnimationFrame(follow);
      else cursorFrame = 0;
    }
    window.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
      if (!ring.classList.contains('is-visible')) {x = event.clientX;y = event.clientY;}
      mouseX = event.clientX;mouseY = event.clientY;
      ring.classList.add('is-visible');dot.classList.add('is-visible');
      const target = event.target.closest('a,button,[data-cursor]');
      ring.classList.toggle('is-interactive',Boolean(target));
      ring.textContent = target?.dataset.cursor || '';
      if (!cursorFrame) cursorFrame = requestAnimationFrame(follow);
    }, {passive:true});
    document.addEventListener('pointerleave', () => {ring.classList.remove('is-visible');dot.classList.remove('is-visible');});
    window.addEventListener('blur', () => {ring.classList.remove('is-visible');dot.classList.remove('is-visible');});
    reducedMotion.addEventListener('change', event => {
      if (event.matches) {cancelAnimationFrame(cursorFrame);cursorFrame = 0;ring.classList.remove('is-visible');dot.classList.remove('is-visible');}
    });
  }
})();


      /* Show once per browser session; the sidebar/footer can reopen it. */
      (() => {
        "use strict";
        const dialog = document.getElementById("development-notice");
        const root = document.documentElement;
        const storageKey = "jasbir-jassi-development-notice-v1";
        let previouslyFocused = null;
        let backdropPressed = false;
        if (!dialog || typeof dialog.showModal !== "function") return;

        function rememberDismissal() {
          try { sessionStorage.setItem(storageKey, "dismissed"); }
          catch (_) { /* Storage may be unavailable in private/local previews. */ }
        }
        function openNotice() {
          if (dialog.open) return;
          previouslyFocused = document.activeElement;
          root.dataset.developmentOpen = "true";
          dialog.showModal();
        }
        function closeNotice() {
          rememberDismissal();
          delete root.dataset.developmentOpen;
          if (dialog.open) dialog.close();
        }
        document.querySelectorAll("[data-open-development]").forEach((button) => {
          button.addEventListener("click", openNotice);
        });
        document.querySelectorAll("[data-close-development]").forEach((control) => {
          control.addEventListener("click", closeNotice);
        });
        dialog.addEventListener("cancel", (event) => {
          event.preventDefault();
          closeNotice();
        });
        dialog.addEventListener("close", () => {
          delete root.dataset.developmentOpen;
          rememberDismissal();
          // Preserve focus set by the bookings link instead of moving it back.
          if (dialog.contains(document.activeElement) && previouslyFocused instanceof HTMLElement) {
            previouslyFocused.focus({ preventScroll: true });
          }
        });
        function outsidePanel(event) {
          const rect = dialog.getBoundingClientRect();
          return event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom;
        }
        dialog.addEventListener("pointerdown", (event) => {
          backdropPressed = event.target === dialog && outsidePanel(event);
        });
        dialog.addEventListener("click", (event) => {
          if (backdropPressed && event.target === dialog && outsidePanel(event)) closeNotice();
          backdropPressed = false;
        });
        let shouldShow = true;
        try { shouldShow = sessionStorage.getItem(storageKey) !== "dismissed"; }
        catch (_) { /* Still show the notice when session storage is blocked. */ }
        if (shouldShow) requestAnimationFrame(openNotice);
      })();

