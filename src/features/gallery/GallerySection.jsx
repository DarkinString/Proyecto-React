import Section from '../../components/ui/Section.jsx';

export default function GallerySection() {
  return (
    <Section id="recuerdos" number="02" title="Instantes para quedarnos">
      <div className="surface-panel flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-violet/50 p-6 text-center">
        <p>Aquí guardaremos nuestra primera foto.<br /><span className="text-sm">Y todas las que vengan después.</span></p>
      </div>
    </Section>
  );
}
