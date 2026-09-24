export default function Section({ id, number, title, children }) {
  return (
    <section id={id} data-poro-section aria-labelledby={`${id}-titulo`} className="story-section scroll-mt-8 border-t border-line/70 py-16 sm:py-24">
      <p className="mb-4 text-sm tracking-widest text-accent">CAPÍTULO {number}</p>
      <h2 id={`${id}-titulo`} className="mb-6 font-serif text-3xl text-ink sm:text-4xl">{title}</h2>
      <div className="max-w-2xl text-lg leading-8 text-muted">{children}</div>
    </section>
  );
}
