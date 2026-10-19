/** Heuristic only: cannot guarantee that a model never reveals a solution. */
export function guardResponse(text: string): { allowed: boolean } {
  const code = /```|~~~|(?:^|\n)\s*(?:def |class |(?:async\s+)?function\s)|\bfunction\s*\w*\s*\(|\b(?:public|private|protected)\s+(?:static\s+)?\w+\s+\w+\s*\(|=>\s*\{|(?:^|\n)\s*(?:for|while|if)\s*\(|(?:^|\n)\s*(?:for|while|if)\b[^\n]*:/m;
  const implementation = /=>|(?:^|\n)\s*(?:return\b|(?:print|console\.log)\s*\(|(?:const|let|var)\s+\w+\s*=)|(?:^|\n)\s*(?:(?:static|async|internal)\s+)*(?:void|int|string|bool|double|float|Task)\s+\w+\s*\(/m;
  return { allowed: !!text.trim() && text.length <= 2_500 && !code.test(text) && !implementation.test(text) };
}

/** Publish complete sentences/lines only, so unfinished code fences stay buffered. */
export function streamableText(text: string): string {
  const boundary = Math.max(text.lastIndexOf('\n'), text.lastIndexOf('. '),
    text.lastIndexOf('?'), text.lastIndexOf('!'));
  return boundary < 0 ? '' : text.slice(0, boundary + 1);
}
