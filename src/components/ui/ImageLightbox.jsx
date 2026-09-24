import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import './imageLightbox.css';

export default function ImageLightbox({ src, alt, title, caption, onClose }) {
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });

    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog ref={dialog} className="image-lightbox" aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="image-lightbox-content">
        <header className="image-lightbox-header">
          <div><p>NUESTRO PEQUEÑO TESORO</p><h2 id={titleId}>{title}</h2></div>
          <button ref={closeButton} type="button" className="button-secondary" aria-label="Cerrar imagen ampliada" onClick={onClose}>
            Cerrar <span aria-hidden="true">×</span>
          </button>
        </header>
        <img className="image-lightbox-image" src={src} alt={alt} />
        {caption && <p className="image-lightbox-caption">{caption}</p>}
      </div>
    </dialog>, document.body,
  );
}
