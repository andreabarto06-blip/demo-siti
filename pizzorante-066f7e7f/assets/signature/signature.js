/* Signature motion: the effects that make a business's own material move.
 *
 * Written for the rebrand-v2 generator. Patterns follow ui-ux-pro-max 2.15.0's
 * data/motion.csv (MIT, NextLevelBuilder): Scroll Reveal Standard (#5), Stagger List
 * Complex (#9, short headings only), Parallax Scroll Subtle (#13), Hover Complex (#3),
 * re-written in vanilla JavaScript with no library.
 *
 * Mark an element with data-sg="<effect>":
 *   spin      a round frame holding one photograph (a pizza, a plate, a cake seen from
 *             above): it turns as the page scrolls, up to data-sg-turn degrees (default 120)
 *   reveal    a group (a menu list, a row of cards): its children rise into place one after
 *             the other the first time the group comes on screen, at most 8 staggered
 *   split     a short heading (8 words or fewer): its words rise out of a mask, once
 *   wipe      a framed photograph: it is uncovered from the bottom edge, once
 *   parallax  a frame with overflow hidden around one photograph: the photograph moves a
 *             little slower than the page (data-sg-depth, 4 to 15, default 8)
 *   tilt      a card or framed photograph: it leans toward a fine pointer, at most 6 degrees
 *
 * Every effect shows its finished state without script, under prefers-reduced-motion, in
 * headless browsers (the generator's screenshots) and before the observer runs: only this
 * module adds html.sg-js, and the hidden starting states hang off that class.
 */
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const headless = /Headless/.test(navigator.userAgent) || navigator.webdriver;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

function each(name, fn) {
  document.querySelectorAll(`[data-sg="${name}"]`).forEach(fn);
}

function splitWords(heading) {
  if (heading.dataset.sgSplit) return;
  heading.dataset.sgSplit = '1';
  const label = heading.textContent.replace(/\s+/g, ' ').trim();
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const mask = document.createElement('span');
          mask.className = 'sg-word';
          mask.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.textContent = part;
          mask.append(inner);
          frag.append(mask);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(heading);
  heading.setAttribute('aria-label', label);
  heading.querySelectorAll('.sg-word > span').forEach((word, i) => {
    word.style.setProperty('--sg-i', String(Math.min(i, 12)));
  });
}

function stagger(group) {
  [...group.children].forEach((child, i) => {
    child.style.setProperty('--sg-i', String(Math.min(i, 7)));
  });
}

function start() {
  if (reduced || headless) {
    root.classList.add('sg-still');
    return;
  }
  each('split', splitWords);
  each('reveal', stagger);
  root.classList.add('sg-js');

  // Enter-once effects.
  const enter = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('sg-in');
      enter.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  ['reveal', 'split', 'wipe'].forEach((name) => each(name, (el) => enter.observe(el)));
  // Whatever is already above the fold on load enters at once.
  requestAnimationFrame(() => {
    ['reveal', 'split', 'wipe'].forEach((name) => each(name, (el) => {
      const box = el.getBoundingClientRect();
      if (box.top < innerHeight * 0.88 && box.bottom > 0) el.classList.add('sg-in');
    }));
  });
  // Nothing may stay hidden for good: everything shows after 4 s on screen at the latest.
  setTimeout(() => root.classList.add('sg-safe'), 4000);

  // Scroll-linked effects, only while on screen.
  const linked = [];
  each('spin', (el) => linked.push({ el, kind: 'spin', turn: Number(el.dataset.sgTurn) || 120 }));
  each('parallax', (el) => {
    const depth = Math.max(4, Math.min(15, Number(el.dataset.sgDepth) || 8));
    linked.push({ el, kind: 'parallax', depth, img: el.querySelector('img, picture, video') });
  });
  const visible = new Set();
  const watch = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const item = linked.find((l) => l.el === entry.target);
      if (entry.isIntersecting) visible.add(item); else visible.delete(item);
    });
    queue();
  });
  linked.forEach((item) => watch.observe(item.el));
  let ticking = false;
  function frame() {
    ticking = false;
    visible.forEach((item) => {
      const box = item.el.getBoundingClientRect();
      // 0 when the element's top meets the screen's foot, 1 when its foot leaves the top.
      const p = Math.min(1, Math.max(0, (innerHeight - box.top) / (innerHeight + box.height)));
      if (item.kind === 'spin') {
        item.el.style.setProperty('--sg-turn', `${(p - 0.5) * item.turn}deg`);
      } else if (item.img) {
        item.img.style.setProperty('--sg-shift', `${(p - 0.5) * -2 * item.depth}%`);
      }
    });
  }
  function queue() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);

  // Tilt toward a fine pointer.
  if (finePointer) {
    each('tilt', (el) => {
      el.addEventListener('pointermove', (event) => {
        const box = el.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        el.style.setProperty('--sg-rx', `${(-y * 6).toFixed(2)}deg`);
        el.style.setProperty('--sg-ry', `${(x * 6).toFixed(2)}deg`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--sg-rx', '0deg');
        el.style.setProperty('--sg-ry', '0deg');
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
