import { getSubjectArtwork } from './subjectArtwork';

const illustrations = ['books-cap', 'target-checklist', 'lesson-book', 'assessment-hero'];
const palettes = [
  ['#eee5ff', '#e1f8ff', '#7040ca'], ['#ffeadf', '#fff4cd', '#ad5c2f'],
  ['#e0f7f1', '#e9eaff', '#277f86'], ['#fbe4f0', '#eee6ff', '#a24f91'],
  ['#e2eeff', '#e2fbf4', '#416eb6'], ['#f4e6ff', '#ffecde', '#9b56ad'],
];

/** Identity comes from the saved ID, so sorting, language and availability never change the cover. */
export function getExamArtwork(examKey: string, subject?: unknown) {
  let seed = 2166136261;
  for (const char of examKey) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const subjectArt = getSubjectArtwork(subject);
  const pool = [subjectArt.src, ...illustrations.map(name => `/klevro/illustrations/ui/${name}.png`)];
  const [from, to, accent] = palettes[(seed >>> 5) % palettes.length];
  return {
    src: pool[seed % pool.length], from, to, accent,
    motif: (seed >>> 9) % 6,
    angle: (seed >>> 14) % 90 + 100,
    offset: (seed >>> 21) % 30,
    fingerprint: seed.toString(16).padStart(8, '0'),
  };
}

export function examArtworkKey(examId: unknown, childId?: unknown) {
  return childId ? `${examId}:${childId}` : String(examId);
}
