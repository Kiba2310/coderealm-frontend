import type { MentorContext, MentorLanguage } from './types.ts';

export function mentorLanguage(language?: string): MentorLanguage | undefined {
  switch ((language || 'python').toLowerCase()) {
    case 'python': case 'python3': return 'python';
    case 'javascript': case 'js': return 'javascript';
    case 'csharp': case 'c#': case 'cs': return 'csharp';
    default: return undefined;
  }
}

/** Explicit projection: excludes extra API fields, hidden tests and solutions. */
export function lessonMentorContext(
  lesson: { title: string; description: string; language?: string },
  studentCode: string,
  runFailure?: { code: string; message: string },
): Omit<MentorContext, 'hintLevel'> | undefined {
  const language = mentorLanguage(lesson.language);
  if (!language) return undefined;
  return {
    language, exerciseTitle: lesson.title, exerciseDescription: lesson.description,
    studentCode, errorMessage: runFailure?.code === studentCode ? runFailure.message : undefined,
  };
}
