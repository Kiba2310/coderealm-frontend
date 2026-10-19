import { MentorService } from './service.ts';

/** One shared engine/store per browser tab; construction does no GPU/network work. */
export const aiMentor = new MentorService({
  modelId: import.meta.env?.VITE_AI_MENTOR_MODEL || undefined,
  compactModelId: import.meta.env?.VITE_AI_MENTOR_COMPACT_MODEL || undefined,
});

// Page exit cannot reliably await GPU cleanup; abort/terminate starts immediately.
const onPageHide = () => { void aiMentor.dispose(); };
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', onPageHide);
}
if (import.meta.hot) import.meta.hot.dispose(() => {
  window.removeEventListener('pagehide', onPageHide);
  void aiMentor.dispose();
});
