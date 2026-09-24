export default function Footer({ motionReduced, systemReduced, onToggleMotion }) {
  return (
    <footer className="page-footer border-t border-line/60 px-6 py-8 text-center text-sm text-muted">
      Hecho con amor, un recuerdo a la vez. <span aria-hidden="true">♥</span>
      <label className="mt-4 flex items-center justify-center gap-2">
        <input type="checkbox" checked={motionReduced} disabled={systemReduced} onChange={onToggleMotion} />
        Reducir movimiento
      </label>
    </footer>
  );
}
