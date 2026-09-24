import { useEffect, useRef, useState } from 'react';
import { createGameAmbience } from './gameAmbience.js';

export default function useGameAmbience(phase) {
  const audioRef = useRef(null);
  const player = useRef(null);
  const mounted = useRef(true);
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(55);
  const [status, setStatus] = useState('ready');
  const [yieldedToMusic, setYieldedToMusic] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const preferences = useRef({ enabled, volume, phase });
  preferences.current = { enabled, volume, phase };

  function ensurePlayer() {
    if (!player.current && audioRef.current) {
      player.current = createGameAmbience(audioRef.current, {
        volume: preferences.current.volume,
        onStatus: (next) => { if (mounted.current) setStatus(next); },
        onStart: () => window.dispatchEvent(new CustomEvent('mirukaleta:audio-start', { detail: { source: 'game' } })),
      });
    }
    return player.current;
  }

  function startFromGesture() {
    if (!preferences.current.enabled || document.hidden) return;
    setPreviewing(false);
    setYieldedToMusic(false);
    ensurePlayer()?.startFromGesture();
  }

  useEffect(() => {
    // Cada cambio a una fase inactiva detiene la música. La muestra se inicia solo por clic.
    if (phase !== 'playing') {
      player.current?.pause();
      setPreviewing(false);
    }
  }, [phase]);

  useEffect(() => {
    mounted.current = true;
    ensurePlayer();
    function stopWhenHidden() {
      if (!document.hidden) return;
      player.current?.pause();
      setPreviewing(false);
    }
    function anotherSourceStarted(event) {
      if (event.detail?.source !== 'youtube') return;
      // Ceder el audio es temporal: NO cambia la preferencia de música para la siguiente partida.
      setYieldedToMusic(preferences.current.enabled);
      setPreviewing(false);
      player.current?.pause();
    }
    document.addEventListener('visibilitychange', stopWhenHidden);
    window.addEventListener('mirukaleta:audio-start', anotherSourceStarted);
    return () => {
      mounted.current = false;
      document.removeEventListener('visibilitychange', stopWhenHidden);
      window.removeEventListener('mirukaleta:audio-start', anotherSourceStarted);
      player.current?.dispose();
      player.current = null;
    };
  }, []);

  function toggle() {
    const reclaiming = yieldedToMusic || status === 'blocked' || status === 'error';
    const next = reclaiming || !preferences.current.enabled;
    preferences.current.enabled = next;
    setEnabled(next);
    setYieldedToMusic(false);
    if (next && preferences.current.phase === 'playing') startFromGesture();
    else if (next && preferences.current.phase === 'setup') listen();
    else if (!next) {
      player.current?.pause();
      setPreviewing(false);
    }
  }

  function listen() {
    if (document.hidden) return;
    if (previewing && status === 'playing') {
      player.current?.pause();
      setPreviewing(false);
      return;
    }
    preferences.current.enabled = true;
    setEnabled(true);
    setYieldedToMusic(false);
    setPreviewing(true);
    ensurePlayer()?.startFromGesture();
  }

  function changeVolume(value) {
    const next = Math.max(0, Math.min(100, Number(value) || 0));
    preferences.current.volume = next;
    setVolume(next);
    ensurePlayer()?.setVolume(next);
  }

  return { audioRef, enabled, volume, status, yieldedToMusic, previewing, toggle, listen, changeVolume, startFromGesture };
}
