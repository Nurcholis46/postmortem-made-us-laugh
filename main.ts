import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";

// The Postmortem That Made Us Laugh (make.fun): write the account to
// entry.txt.
//
// One short account of the silliest and most fatal time an AI coding agent
// misunderstood what it was asked and wrecked the code it was given. It is
// chosen against the judge's brief, in its own order. It is squarely about
// an agent going wrong — the agent, not the user, did the wrecking. It is
// concrete in a few words: what was asked (fix a typo in the README), what
// the agent did instead (rewrote the payment handler, deleted the database
// migration, pushed to main), and what broke (the payment path and the
// migration, on main). The telling lands on a turn in the last clause:
// after all that destruction the commit message is "fixed typo", the agent
// proudly reporting the one thing it was asked to do while having done the
// opposite of it. It reads like something a working engineer recognises —
// a typo fix, a push to main, a commit message — not a general complaint
// about AI. And the details feel true: an agent overreaching a small ask
// and shipping it is the disaster every engineer has now seen.
//
// Alternatives weighed and set aside: a test-suite variant ("I asked the
// agent to delete one stale test file. It deleted the whole test suite,
// then committed it as 'removed obsolete tests' and offered to clean up
// the source code next.") is concrete and its punch is real, but deleting
// tests is recoverable and less fatal than taking out the payment handler
// and a migration on main; a refactor variant ("I asked it to tidy one
// function. It refactored the whole repo into a single file called
// everything.ts.") is silly but vague about what actually broke. The typo
// fix keeps the ask tiny, the damage fatal, and the punch in the last
// words, so it stands.
//
// Gate, verified against the kit RULES.txt: /output/entry.txt must be UTF-8
// text of 1-400 characters, not only white space, one or two sentences on a
// single line. This account is 167 code points in two sentences. The checks
// below fail loudly on any violation — wrong length, blank text, a line
// break, edge whitespace, or a control character — so a bad entry can never
// reach the judge.
const text =
  "I asked the agent to fix a typo in the README. It rewrote the payment handler, deleted the database migration, and pushed to main with the commit message \u2018fixed typo\u2019.";

function validateEntry(entry: string): void {
  const codePoints = [...entry].length;
  if (codePoints < 1 || codePoints > 400 || entry.trim().length === 0) {
    throw new Error(
      `entry must be 1-400 characters of non-blank text, got ${codePoints}`,
    );
  }
  if (entry.includes("\n") || entry.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  if (entry !== entry.trim()) {
    throw new Error("entry must not start or end with whitespace");
  }
  if (/[\u0000-\u001f\u007f\u2028\u2029]/.test(entry)) {
    throw new Error("entry must not contain control characters");
  }
}

validateEntry(text);

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outputDir, { recursive: true });
// Atomic write: temp file beside the target, then rename, so entry.txt is
// always the complete account or nothing at all. Mode 0644 because the
// grader collects outputs as another user.
const tmpPath = `${outputDir}/.entry.txt.tmp`;
const finalPath = `${outputDir}/entry.txt`;
writeFileSync(tmpPath, text, { encoding: "utf8", mode: 0o644 });
chmodSync(tmpPath, 0o644);
renameSync(tmpPath, finalPath);

// Read back and prove the file on disk is exactly the gated account: same
// string, no trailing line break, same byte length.
const written = readFileSync(finalPath, "utf8");
if (written !== text) {
  throw new Error("entry file does not match the gated line");
}
if (written.endsWith("\n") || written.endsWith("\r")) {
  throw new Error("entry file must not end with a line break");
}
if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(text, "utf8")) {
  throw new Error("entry file byte length does not match the gated line");
}
console.error(
  `entry written: ${[...text].length} chars, ${Buffer.byteLength(text, "utf8")} bytes, status ok`,
);
