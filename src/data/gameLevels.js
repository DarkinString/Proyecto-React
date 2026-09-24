import moonGarden from '../assets/images/memories/moon-garden.svg';
import sharedConstellation from '../assets/images/memories/shared-constellation.svg';
import lilacLetter from '../assets/images/memories/lilac-letter.svg';

export const GAME_LEVELS = [
  {
    id: 'recuerdo-1',
    title: 'Un jardín bajo la luna',
    description: 'Tu primer pequeño tesoro. Aquí irá una foto que elijamos juntos.',
    image: moonGarden,
    alt: 'Ilustración provisional de una luna creciente sobre un jardín azul y lila.',
    isPlaceholder: true,
  },
  {
    id: 'recuerdo-2',
    title: 'Una constelación para dos',
    description: 'Otra imagen por atesorar, una combinación a la vez.',
    image: sharedConstellation,
    alt: 'Ilustración provisional de una constelación en forma de corazón sobre un cielo violeta.',
    isPlaceholder: true,
  },
  {
    id: 'recuerdo-3',
    title: 'Palabras que florecen',
    description: 'Un lugar reservado para otro de nuestros momentos favoritos.',
    image: lilacLetter,
    alt: 'Ilustración provisional de un sobre con flores lilas y un sello de corazón.',
    isPlaceholder: true,
  },
];
