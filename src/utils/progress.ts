const PROGRESS_KEY = 'coderealm_progress';

export const getCompletedLessons = (): string[] => {
  const data = localStorage.getItem(PROGRESS_KEY) || localStorage.getItem('bootdevclone_progress');
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const markLessonComplete = (lessonId: string) => {
  const completed = getCompletedLessons();
  if (!completed.includes(lessonId)) {
    completed.push(lessonId);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(completed));
  }
};
