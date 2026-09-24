export default function scrollToSection(id) {
  const target = document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paused = document.querySelector('[data-motion="off"]');
  target?.scrollIntoView({ behavior: reduceMotion || paused ? 'instant' : 'smooth', block: 'start' });
}
