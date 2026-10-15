/*
 * Shimmer border: plays the effect from shimmer-border.css.
 * Add data-shimmer to an element, then call initShimmer(). Modes:
 *   data-shimmer          plays once when scrolled into view (default)
 *   data-shimmer="always" plays every time it scrolls into view
 *   data-shimmer="hover"  plays on hover or keyboard focus
 *   data-shimmer="manual" only plays when you call shimmer(el)
 */
const DEFAULTS = {
  selector: '[data-shimmer]',
  threshold: 0.5,
  rootMargin: '0px 0px -10% 0px',
  stagger: 120, // ms between elements that enter the viewport together
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const bound = new WeakSet();

/** Play the shimmer on one element, restarting it if it is already running. */
export function shimmer(el, delay = 0) {
  if (reducedMotion.matches) return;
  el.style.setProperty('--shimmer-delay', `${delay}ms`);
  el.classList.remove('is-shimmering');
  void el.offsetWidth;
  el.classList.add('is-shimmering');
}

function onAnimationEnd(e) {
  if (e.animationName === 'shimmer-sweep') e.currentTarget.classList.remove('is-shimmering');
}

function onHover(e) {
  if (!e.currentTarget.classList.contains('is-shimmering')) shimmer(e.currentTarget);
}

/** Wire up every [data-shimmer] element under root. Safe to call again for new content. */
export function initShimmer(options = {}, root = document) {
  const opts = { ...DEFAULTS, ...options };
  const els = [...root.querySelectorAll(opts.selector)].filter((el) => !bound.has(el));
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        shimmer(entry.target, i++ * opts.stagger);
        if ((entry.target.dataset.shimmer || 'once') === 'once') io.unobserve(entry.target);
      }
    },
    { threshold: opts.threshold, rootMargin: opts.rootMargin },
  );
  for (const el of els) {
    bound.add(el);
    el.classList.add('shimmer');
    el.addEventListener('animationend', onAnimationEnd);
    const mode = el.dataset.shimmer || 'once';
    if (mode === 'hover') {
      el.addEventListener('pointerenter', onHover);
      el.addEventListener('focusin', onHover);
    } else if (mode !== 'manual') {
      io.observe(el);
    }
  }
}
