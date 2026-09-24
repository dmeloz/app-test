#!/usr/bin/env bash
# Tests des hooks de garde-fous. Usage : .claude/hooks/test-guards.sh
# Code de sortie non nul si un cas ne donne pas le résultat attendu.
set -uo pipefail
dir="$(cd "$(dirname "$0")" && pwd)"
fail=0

json_cmd() { python3 -c 'import json,sys; print(json.dumps({"tool_input":{"command":sys.argv[1]}}))' "$1"; }
json_file() { python3 -c 'import json,sys; print(json.dumps({"tool_input":{"file_path":sys.argv[1]}}))' "$1"; }

check() { # attendu(0|2) hook entrée libellé
  local expected="$1" hook="$2" payload="$3" label="$4" got
  printf '%s' "$payload" | "$dir/$hook" >/dev/null 2>&1; got=$?
  if [[ "$got" == "$expected" ]]; then echo "ok   [$got] $label"; else echo "FAIL [$got≠$expected] $label"; fail=1; fi
}
bash_ok()    { check 0 guard-bash.sh "$(json_cmd "$1")" "$1"; }
bash_block() { check 2 guard-bash.sh "$(json_cmd "$1")" "$1"; }
file_ok()    { check 0 guard-files.sh "$(json_file "$1")" "$1"; }
file_block() { check 2 guard-files.sh "$(json_file "$1")" "$1"; }

bash_ok    "git push -u origin claude/feature-x"
bash_ok    "git status"
bash_ok    "git log --oneline main"
bash_ok    "pnpm test"
bash_ok    "rm -rf node_modules"
bash_ok    "tofu plan"
bash_ok    "env NODE_ENV=test pnpm test"
bash_ok    "cat .env.example"
bash_ok    $'cat > doc.md <<\'EOF\'\nne jamais lire .env ni faire git push --force\nEOF'
bash_ok    "printf '*.pem\n' > .gitignore"
bash_block "cat ~/.ssh/id_ed25519"
bash_block "cp certs/server.pem /tmp/"
bash_block "git push --force origin feat"
bash_block "git push -f"
bash_block "git push origin main"
bash_block "git push origin HEAD:main"
bash_block "git reset --hard HEAD~3"
bash_block "git commit --no-verify -m x"
bash_block "cat .env"
bash_block "cat .env.dev"
bash_block "cp .env.backup /tmp/x"
bash_block "cat apps/api/.env.prod"
bash_ok    "grep -n '\\.env' .claude/hooks/guard-bash.sh"
bash_ok    "cat apps/api/.env.example"
bash_ok    "cat .env.template"
bash_block "cat .env|head"
bash_block "cat .env;echo"
bash_block "cat <.env"
bash_block "cat .env.production.local"
bash_block "cat .env.development.local"
bash_block "cat .env.local.bak"
bash_block "cat .env.example.local"
bash_block "cat .env.sample.bak"
bash_block $'cat > doc.md <<EOF\ntexte\nEOF\ncat .env'
bash_block "env"
bash_block "rm -rf /"
bash_block "psql -c 'DROP TABLE orders'"
bash_block "tofu apply"
bash_block "terraform destroy"
bash_block "kubectl get pods"
file_ok    "/repo/src/main.ts"
file_ok    "/repo/.env.example"
file_block "/repo/.env"
file_block "/repo/apps/api/.env.local"
file_block "/repo/certs/server.pem"

exit "$fail"
