import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';

const SUFFIX = '?code';

/**
 * Removes comments from source shown in the code panel.
 *
 * The repo's own files are heavily commented and stay that way — this strips
 * them only on the way to the screen. The page already carries the explanation
 * in prose beside the walkthrough, and a reader who has come to see *what the
 * algorithm does* is served better by twenty lines of cipher than by sixty
 * lines of cipher-and-commentary.
 *
 * Deliberately conservative: it will not touch anything that might be inside a
 * string literal, so at worst a comment survives. Silently deleting a `#` from
 * inside a string would corrupt the sample, which is far worse than leaving a
 * stray comment in.
 */
export function stripComments(text: string, lang: 'py' | 'ts'): string {
  const out: string[] = [];
  let inBlock = false;
  let inDocstring: string | null = null;

  for (const raw of text.split('\n')) {
    let line = raw;

    // Python docstrings are strings rather than comments, but they read as
    // commentary and are the bulk of what the panel would otherwise show.
    if (lang === 'py') {
      if (inDocstring) {
        if (line.includes(inDocstring)) inDocstring = null;
        continue;
      }
      const trimmed = line.trim();
      const delim = trimmed.startsWith('"""')
        ? '"""'
        : trimmed.startsWith("'''")
          ? "'''"
          : null;
      // Only when the string is the whole statement — `x = """…"""` is a value.
      if (delim) {
        const rest = trimmed.slice(delim.length);
        if (!rest.includes(delim)) inDocstring = delim;
        continue;
      }
    }

    if (lang === 'ts') {
      if (inBlock) {
        const end = line.indexOf('*/');
        if (end === -1) continue;
        line = line.slice(end + 2);
        inBlock = false;
      }
      const open = indexOutsideString(line, '/*');
      if (open !== -1) {
        const close = line.indexOf('*/', open + 2);
        if (close === -1) {
          inBlock = true;
          line = line.slice(0, open);
        } else {
          line = line.slice(0, open) + line.slice(close + 2);
        }
      }
      const slash = indexOutsideString(line, '//');
      if (slash !== -1) line = line.slice(0, slash);
    } else {
      const hash = indexOutsideString(line, '#');
      if (hash !== -1) line = line.slice(0, hash);
    }

    // A line that was nothing but a comment goes entirely; a line that was
    // already blank stays, because it is part of the code's shape.
    if (line.trim() === '' && raw.trim() !== '') continue;
    out.push(line.trimEnd());
  }

  const body = lang === 'py' ? dropPythonHarness(out) : out;
  return collapseBlankRuns(body).join('\n').replace(/\s+$/, '') + '\n';
}

/**
 * Drops the parts of a Python sample that exist for the repo rather than for
 * the reader: the `run()` adapter the shared vector tests call through, and the
 * `if __name__ == "__main__"` demo block.
 *
 * Both have to stay in the file — the first is how `tests/test_samples.py`
 * checks the sample against the same vectors as the engine, and the second is
 * how you run it yourself — but neither is part of the cipher, and the panel is
 * there to show the cipher.
 *
 * A block ends at the next line that starts in column zero, which is exactly
 * what Python's own indentation rules mean by the end of a block.
 */
function dropPythonHarness(lines: string[]): string[] {
  const out: string[] = [];
  let skipping = false;

  for (const line of lines) {
    if (skipping) {
      // Blank lines and indented lines still belong to the block being dropped.
      if (line.trim() === '' || /^\s/.test(line)) continue;
      skipping = false;
    }
    if (/^def run\s*\(/.test(line) || /^if __name__\s*==/.test(line)) {
      skipping = true;
      continue;
    }
    out.push(line);
  }
  return out;
}

/** First index of `token` in `line` that is not inside a quoted string. */
function indexOutsideString(line: string, token: string): number {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (line.startsWith(token, i)) return i;
  }
  return -1;
}

/** Removing whole comment blocks leaves runs of blank lines behind. */
function collapseBlankRuns(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if (line.trim() === '' && out.length > 0 && out[out.length - 1].trim() === '') {
      continue;
    }
    out.push(line);
  }
  while (out.length && out[0].trim() === '') out.shift();
  return out;
}

/**
 * Serves `import x from './engine.ts?code'` as `{ source, path }`.
 *
 * Vite's built-in `?raw` would give the text unchanged; this exists to apply
 * the comment stripping above at build time rather than in the browser.
 */
export function codeSamples(): Plugin {
  return {
    name: 'cryptolab:code-samples',
    enforce: 'pre',

    async load(id) {
      if (!id.endsWith(SUFFIX)) return null;

      const file = id.slice(0, -SUFFIX.length);
      const text = await readFile(file, 'utf8');
      const lang = file.endsWith('.py') ? 'py' : 'ts';

      this.addWatchFile(file);

      const rel = path.relative(process.cwd(), file).split(path.sep).join('/');
      return `export default ${JSON.stringify({
        source: stripComments(text, lang),
        path: rel,
      })};`;
    },
  };
}
