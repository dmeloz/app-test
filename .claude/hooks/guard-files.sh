#!/usr/bin/env bash
# PreToolUse (Read/Edit/Write) : bloque l'accès aux fichiers de secrets.
set -euo pipefail
input="$(cat)"
if command -v jq >/dev/null 2>&1; then
  path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')"
else
  path="$(printf '%s' "$input" | python3 -c 'import json,sys; t=json.load(sys.stdin).get("tool_input",{}); print(t.get("file_path") or t.get("path") or "")')"
fi
base="$(basename -- "${path:-x}")"
case "$base" in
  .env.example|.env.sample|.env.template) exit 0 ;;
  .env|.env.*|*.pem|*.key|*.p12|*.pfx|id_rsa*|id_ed25519*|credentials.json|*service-account*.json)
    echo "Bloqué par .claude/hooks/guard-files.sh : fichier de secrets ($base). Utilise .env.example." >&2
    exit 2 ;;
esac
exit 0
