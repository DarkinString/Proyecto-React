import { useState } from 'react';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import InteractiveBackground from '../components/effects/InteractiveBackground.jsx';
import PoroCompanion from '../features/poro/PoroCompanion.jsx';
import useReducedMotion from '../hooks/useReducedMotion.js';
import useTheme from '../hooks/useTheme.js';
import WelcomeSection from '../features/welcome/WelcomeSection.jsx';
import StorySection from '../features/story/StorySection.jsx';
import GallerySection from '../features/gallery/GallerySection.jsx';
import MusicSection from '../features/music/MusicSection.jsx';
import GamesSection from '../features/games/GamesSection.jsx';
import CollectiblesSection from '../features/collectibles/CollectiblesSection.jsx';
import useGameProgress from '../hooks/useGameProgress.js';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { records, saveResult, storageError } = useGameProgress();
  const [gameMessage, setGameMessage] = useState('');
  const [gameDock, setGameDock] = useState(null);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const animate = motionEnabled && !prefersReducedMotion;

  return (
    <div className="page-shell" data-motion={animate ? 'on' : 'off'}>
      <InteractiveBackground animate={animate} />
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main id="contenido" className="page-content mx-auto max-w-6xl px-6 sm:px-10">
        <WelcomeSection />
        <StorySection />
        <GallerySection />
        <MusicSection />
        <GamesSection records={records} saveResult={saveResult} storageError={storageError} onPoroMessage={setGameMessage} poroDockRef={setGameDock} />
        <CollectiblesSection records={records} storageError={storageError} />
      </main>
      <Footer motionReduced={!animate} systemReduced={prefersReducedMotion} onToggleMotion={() => setMotionEnabled((enabled) => !enabled)} />
      <PoroCompanion gameMessage={gameMessage} gameDock={gameDock} />
    </div>
  );
}
