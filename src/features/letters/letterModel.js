export const LETTERS_KEY = 'mirukaleta.letters.v1';

export function isLetter(value) {
  return Boolean(value && typeof value.id === 'string'
    && typeof value.title === 'string' && value.title.trim().length > 0 && value.title.length <= 80
    && typeof value.body === 'string' && value.body.trim().length > 0 && value.body.length <= 4000
    && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt)));
}
