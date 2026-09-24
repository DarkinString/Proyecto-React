import { relationship } from '../../data/relationship.js';
import LettersSection from '../letters/LettersSection.jsx';
import scrollToSection from '../../utils/scrollToSection.js';

export default function WelcomeSection() {
  return (
    <section id="inicio" data-poro-section aria-labelledby="titulo-principal" className="space-y-12 py-16 sm:py-24">
      <div>
        <p className="mb-6 text-sm tracking-widest text-accent">{relationship.dedication}</p>
        <h1 id="titulo-principal" className="max-w-3xl font-serif text-5xl leading-tight text-accent sm:text-7xl">{relationship.headline}</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{relationship.introduction}</p>
        <button type="button" onClick={() => scrollToSection('historia')} className="button-primary mt-8">Nuestra historia, poquito a poco <span aria-hidden="true">↓</span></button>
      </div>
      <LettersSection />
    </section>
  );
}
