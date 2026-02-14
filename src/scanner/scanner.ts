import * as path from 'path';
import { PATTERNS, Finding } from './pattern';
import { hasIgnoreEntry } from '../ignore/ignoreStore';

export function isOnceIgnored(
  lineOffset: number,
  lines: string[],
  filePath?: string
): boolean {
  if (lineOffset <= 0) {
    return false;
  }

  const prevLine = lines[lineOffset - 1].trim();

  // Determine comment style based on file extension
  let commentStyles = ["// dont-commit-that: ignore-once"];
  if (filePath) {
    const fileExt = path.extname(filePath).toLowerCase();
    switch (fileExt) {
      case '.js':
      case '.ts':
      case '.mjs':
      case '.cjs':
      case '.go':
        commentStyles = ["// dont-commit-that: ignore-once"];
        break;
      case '.py':
      case '.rb':
        commentStyles = ["# dont-commit-that: ignore-once"];
        break;
      default:
        commentStyles = ["// dont-commit-that: ignore-once", "# dont-commit-that: ignore-once"];
    }
  } else {
    // fallback: check both styles
    commentStyles = ["// dont-commit-that: ignore-once", "# dont-commit-that: ignore-once"];
  }

  return commentStyles.some(style => prevLine === style);
}

export function scanContent(text: string, file: string): Finding[] {
  const result: Finding[] = [];
  const capturedLines = new Set<number>();

  const lines = text.split("\n");

  for (const p of PATTERNS) {
    // Create a global regex to find all matches
    const globalRegex = new RegExp(p.regex.source, p.regex.flags + (p.regex.flags.includes('g') ? '' : 'g'));
    const matches = text.matchAll(globalRegex);

    for (const match of matches) {
      if (!match || /example|dummy|test|changeme/i.test(match[0])) {
        continue;
      }

      // Determine line number from position in the full text
      const beforeMatch = text.slice(0, match.index ?? 0);
      const lineNumber = beforeMatch.split("\n").length; 

      // Skip if this line was already captured
      if (capturedLines.has(lineNumber)) {
        continue;
      }

      // Skip lines that are only comments
      const trimmedLine = lines[lineNumber - 1].trim();
      if (/^\s*(#|\/\/)/.test(trimmedLine)) {
        continue;
      }

      if (isOnceIgnored(lineNumber - 1, lines, file)) {
        continue;
      }

      const actualLine = trimmedLine;

      let key: string;
      let value: string;

      // Try to extract key=value from the actual line first
      const keyValueMatch = actualLine.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/i);
      if (keyValueMatch) {
        key = keyValueMatch[1].trim();
        value = keyValueMatch[2].trim();
      } else if (match[0].includes("=")) {
        [key, value] = match[0].split("=");
        key = key.trim();
        value = value.trim();
      } else {
        key = p.type.replace(/[^A-Z0-9_]/gi, '_').toUpperCase();
        value = match[0];
      }

      const lineContent = key + "=" + value;
      if (hasIgnoreEntry(file, lineContent)) { continue; }

      result.push({
        file,
        line: lineNumber,
        type: p.type,
        key,
        value,
        severity: p.severity
      });
      capturedLines.add(lineNumber);
    }
  }

  return result;
}