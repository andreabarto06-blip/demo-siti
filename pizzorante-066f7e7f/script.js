/* Pizzorante: shared script. Two plain jobs, nothing else:
   1. the phone navigation: .nav__toggle opens and closes .nav__links (.nav.is-open);
   2. the one quiet thing of our own: the header gains a hairline foot (.is-scrolled)
      once the page has scrolled past 40% of the first screen.
   Without this file the links stay visible (styles.css shows them unless html.mo-js). */
(function () {
  var nav = document.querySelector('.nav');
  var toggle = nav && nav.querySelector('.nav__toggle');
  var links = nav && nav.querySelector('.nav__links');

  if (nav && toggle && links) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false);
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (q) {
      if (q.matches) setOpen(false);
    });
  }

  var header = document.querySelector('.site-header');
  if (header) {
    var ticking = false;
    var update = function () {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.4);
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
})();
