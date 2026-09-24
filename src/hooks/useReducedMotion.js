import { useEffect, useState } from 'react';

// Un hook compartido permite respetar la preferencia de movimiento del dispositivo.
export default function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    function updatePreference() {
      setReducedMotion(preference.matches);
    }
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  return reducedMotion;
}
