import type { MentorContext } from './types.ts';
import { guardResponse } from './responseGuard.ts';

const languageHints = {
  python: 'Pythonban ellenőrizd a behúzásokat, a változók kezdőértékét és a bejárt értékeket.',
  javascript: 'JavaScriptben gondold végig a változók értékét, típusát és az összehasonlításokat.',
  csharp: 'C# esetén gondold végig a változók típusát, kezdőértékét és a vezérlés menetét.',
} as const;

export function fallbackHint(context: MentorContext): string {
  const hints = context.publicHints?.filter(hint => guardResponse(hint).allowed);
  if (hints?.length) return hints[Math.min(context.hintLevel - 1, hints.length - 1)];

  const observed = context.errorMessage?.trim()
    ? 'A kapott hibaüzenet melyik sorra utal? Hasonlítsd össze azt a sort a nyelv szabályaival.'
    : context.failedTests?.some(test => test.trim())
      ? 'Válassz ki egy látható sikertelen tesztet, és kézzel kövesd végig a megadott bemenetet.'
      : '';
  const level = {
    1: 'Fogalmazd meg saját szavaiddal, milyen bemenetből milyen kimenetet vár a feladat.',
    2: 'Kövess végig egy kis példát: hol változik először másképp egy érték, mint amire számítasz?',
    3: 'Írd le egy kis példa minden lépésében az aktuális változóértékeket. Mit várnál az egyes lépésektől?',
    4: 'Bontsd a megoldást lépésekre: bemenet értelmezése, kezdőértékek, feldolgozás, majd kimenet. Ellenőrizd külön a szélső eseteket.',
  }[context.hintLevel];
  if (!context.exerciseDescription.trim() && !context.studentCode.trim() && !observed) return level;
  return [observed || languageHints[context.language], level].join(' ');
}
