#!/usr/bin/env node
// PreToolUse hook: deny a build/lint/test command whose verdict is read through a pipe.
//
// `npm run build | grep error` exits with grep's status, not npm's, so a failed build reports as
// success and a PR gets opened on a broken branch. Same for `npm test | tail`, `npx tsc | grep
// error`, `npx vite build | head`. This is the single most expensive mistake available in a
// hackathon with no test suite backstopping the build gate, and prose in a skill has a poor record
// against it — so it is a hook.
//
// The fix carried in the denial is always the same shape: redirect to a log, echo the exit code,
// then grep the log.
//
// Deliberately narrow: only the gate-shaped commands, only when a pipe follows, only when what
// follows is a *reader* rather than a legitimate consumer. A redirect to a file with a later grep
// carries no pipe and passes.
//
// Fails open: any parse trouble, unknown shape or unexpected error exits 0 with no output.

const fs = require("fs");

const SHELL_TOOLS = new Set(["Bash", "PowerShell"]);

// The commands whose exit code is the verdict. Deliberately does NOT include a bare
// `node <file>.js`: piping a utility script (a seed, a one-off) into grep is legitimate, and
// `npm start` already covers booting the server.
const GATE =
  /(?:^|[;&|(]\s*|\s)(?:npm\s+(?:run\s+)?(?:build|test|lint|start)|npx\s+(?:tsc|vite|prisma|eslint))\b/;

// Pipe targets that only read text — piping into these throws the exit code away.
const READER =
  /\|\s*(?:grep|egrep|fgrep|rg|tail|head|more|less|findstr|sed|awk|cat|sort|uniq|wc|tee|Select-String|Select-Object|Out-String|Out-Host|Format-List|Format-Table|ForEach-Object|%|\?|Where-Object)\b/i;

// A pipe inside quotes is not a shell pipe. Strip quoted spans before looking for one.
function stripQuoted(text) {
  return text
    .replace(/'[^']*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/@'[\s\S]*?'@/g, "''")
    .replace(/@"[\s\S]*?"@/g, '""');
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    })
  );
}

try {
  const input = fs.readFileSync(0, "utf8");
  if (!input.trim()) process.exit(0);

  const payload = JSON.parse(input);
  if (!SHELL_TOOLS.has(payload?.tool_name)) process.exit(0);

  const raw = payload?.tool_input?.command;
  if (typeof raw !== "string" || !raw) process.exit(0);

  const command = stripQuoted(raw);
  if (!GATE.test(command) || !READER.test(command)) process.exit(0);

  deny(
    "Un comando de gate (build/lint/test) no se puede juzgar leyendo su salida por un pipe: el " +
      "exit code que se reporta es el del lector, no el del comando real, así que un build roto " +
      "reporta como éxito.\n\n" +
      "Redirigir a un log, chequear el código, después grepear el log:\n\n" +
      "  npm run build --workspace client > /tmp/gate-client.log 2>&1; echo EXIT=$?\n" +
      "  grep -iE 'error' /tmp/gate-client.log | tail -20"
  );
} catch {
  process.exit(0);
}
