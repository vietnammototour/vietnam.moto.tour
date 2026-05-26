#!/usr/bin/env bash
# Preflight guard for Claude Code tool calls.
# Reads hook event JSON from stdin, returns:
#   exit 0 — allow
#   exit 2 — block (stderr shown to model)
#
# Purpose: defense-in-depth against prompt-injection. Even if the
# model is tricked into trying to run a sensitive command or touch a
# sensitive path, this hook stops it.
#
# Triggered by .claude/settings.json -> hooks.PreToolUse.

set -u

# Read full event JSON from stdin (CC passes structured hook input).
input="$(cat)"

# Extract fields with a minimal jq-free parser. We tolerate jq missing.
get() {
  # $1 = jq path like .tool_name or .tool_input.command
  if command -v jq >/dev/null 2>&1; then
    jq -r "$1 // empty" <<<"$input"
  else
    # Fallback: crude grep. Enough for matcher checks.
    python3 -c "import json,sys; d=json.loads(sys.stdin.read());
parts='$1'.lstrip('.').split('.')
cur=d
for p in parts:
  if isinstance(cur,dict) and p in cur: cur=cur[p]
  else: cur=''
print(cur if isinstance(cur,str) else '')" <<<"$input" 2>/dev/null || echo ""
  fi
}

tool="$(get .tool_name)"
cmd="$(get .tool_input.command)"
fpath="$(get .tool_input.file_path)"
url="$(get .tool_input.url)"

block() {
  echo "BLOCKED by preflight guard: $1" >&2
  echo "If this is intentional, edit .claude/hooks/preflight.sh or run the command manually." >&2
  exit 2
}

# ---- Path-based denies (Read / Edit / Write / NotebookEdit) ----
case "$tool" in
  Read|Edit|Write|NotebookEdit|MultiEdit)
    case "$fpath" in
      */.env|*/.env.*|.env|.env.*) block "access to env file: $fpath" ;;
      */.git/config|*/.git/hooks/*) block "git internals: $fpath" ;;
      /etc/shadow|/etc/sudoers*|/etc/passwd) block "system file: $fpath" ;;
      */.ssh/*|*/.aws/credentials|*/.gnupg/*) block "credential store: $fpath" ;;
      */.npmrc|*/.pypirc|*/.netrc) block "credential file: $fpath" ;;
    esac
    # Block writes to protected project files unless user explicitly invoked.
    if [ "$tool" = "Edit" ] || [ "$tool" = "Write" ] || [ "$tool" = "MultiEdit" ]; then
      case "$fpath" in
        */CLAUDE.md|*/.github/workflows/*|*/.claude/settings.json)
          # Allow only if env var is set by user-facing slash command.
          [ "${CLAUDE_ALLOW_PROTECTED_WRITE:-0}" = "1" ] || \
            block "protected file write: $fpath (set CLAUDE_ALLOW_PROTECTED_WRITE=1 to override)"
          ;;
      esac
    fi
    ;;
esac

# ---- Bash command pattern denies ----
if [ "$tool" = "Bash" ] && [ -n "$cmd" ]; then
  # Pipe-to-shell from network
  if echo "$cmd" | grep -Eiq '(curl|wget|fetch)[^|]*\|[[:space:]]*(bash|sh|zsh|python|node)'; then
    block "remote-pipe-to-shell pattern in: $cmd"
  fi
  # Secret/env exfil patterns
  if echo "$cmd" | grep -Eiq '(^|[^a-z])(env|printenv)([^a-z]|$)'; then
    block "env dump: $cmd"
  fi
  if echo "$cmd" | grep -Eq '\$(SECRET|TOKEN|PASSWORD|API_KEY|AWS_|GITHUB_TOKEN)'; then
    block "secret-var reference: $cmd"
  fi
  # Outbound exfil to arbitrary hosts via curl POST (heuristic)
  if echo "$cmd" | grep -Eiq 'curl[^|;]*-X[[:space:]]*POST.*(\.env|/etc/|\.ssh)'; then
    block "potential exfil via curl: $cmd"
  fi
  # Reading credential files via cat/less/head
  if echo "$cmd" | grep -Eq '(cat|less|head|tail|more|bat)[[:space:]]+[^|;&]*(\.env($|\.|/)|\.ssh/|\.aws/credentials|/etc/shadow|/etc/passwd)'; then
    block "reading credential file via shell: $cmd"
  fi
  # git push --force / hard reset / branch -D without explicit user override
  if echo "$cmd" | grep -Eq 'git[[:space:]]+(push[[:space:]]+.*--force|reset[[:space:]]+--hard|branch[[:space:]]+-D|clean[[:space:]]+-[fd])'; then
    [ "${CLAUDE_ALLOW_DESTRUCTIVE_GIT:-0}" = "1" ] || \
      block "destructive git op: $cmd (set CLAUDE_ALLOW_DESTRUCTIVE_GIT=1 to override)"
  fi
  # Bypass flags
  if echo "$cmd" | grep -Eq -- '--no-verify|--no-gpg-sign'; then
    block "safety-bypass flag in: $cmd"
  fi
fi

# ---- WebFetch / WebSearch global block (already in deny, belt+braces) ----
case "$tool" in
  WebFetch|WebSearch)
    block "$tool disabled by policy (CLAUDE.md)"
    ;;
esac

exit 0
