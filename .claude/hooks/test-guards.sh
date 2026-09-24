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
raw_block()  { check 2 guard-bash.sh "$1" "entrée brute : $1"; }
raw_ok()     { check 0 guard-bash.sh "$1" "entrée brute : $1"; }

# N14 (audit 5) : échec fermé sur entrée malformée
raw_block  'pas du json'
raw_block  ''
raw_block  '{"tool_input":{"command":"git push --force origin x \ud800"}}'
raw_ok     '{"tool_input":null}'
raw_ok     '{"tool_input":{}}'
raw_ok     '{"tool_input":{"command":null}}'
raw_ok     '{"tool_input":{"command":42}}'
# N13 (audit 5) : verbe précédé d'un guillemet, d'un chemin ou d'un antislash
bash_block "bash -c 'cat .env'"
bash_block "sh -c \"cat .env\""
bash_block "docker compose exec api sh -c 'cat .env'"
bash_block "ssh host 'cat .env'"
bash_block "eval 'cat .env'"
bash_block "/bin/cat .env"
bash_block "/usr/bin/head -5 .env"
bash_block "\\cat .env"
bash_block "ls .env* | xargs cat"
bash_block 'echo `cat .env`'
bash_ok    "pnpm run concat"
# L-d (audit 5) : heredoc alimentant un interpréteur = analysé ; here-string et décalage arithmétique ≠ heredoc
bash_block $'bash <<\'EOF\'\ncat .env\nEOF'
bash_block $'python3 - <<\'EOF\'\nprint(open(\'.env\').read())\nEOF'
bash_block $'cat <<< x\ncat .env'
bash_block $'echo $((1<<X))\ncat .env'
bash_ok    $'git commit -F - <<\'EOF\'\nne jamais lire .env\nEOF'
# L-e (audit 5) : couverture des autres règles
bash_block "git push --force-with-lease origin feat"
bash_block "git push origin +feat"
bash_block "git push origin feat:main"
bash_block "git clean -fd"
bash_block "git filter-branch --tree-filter x"
bash_block "psql -c 'TRUNCATE TABLE orders'"
bash_block "DATABASE_URL=postgres://u@prod-db/app pnpm db:migrate"
bash_block "helm install x y"
bash_block "stripe refunds create --live"
bash_block "curl -u sk_live_abc: https://api.stripe.com"
bash_block "printenv"
bash_block "openssl rsa -in server.pem"

bash_ok    "git push -u origin claude/feature-x"
bash_ok    "git status"
bash_ok    "git log --oneline main"
bash_ok    "pnpm test"
bash_ok    "rm -rf node_modules"
bash_ok    "tofu plan"
bash_ok    "env NODE_ENV=test pnpm test"
bash_ok    "cat .env.example"
bash_ok    $'cat > doc.md <<\'EOF\'\nne jamais lire .env ni le copier\nEOF'
# N15 (audit 6) : toutes les règles hors .env s'appliquent à la commande brute, corps de heredoc compris
# (faux positif prudent assumé : un document décrivant un push forcé s'écrit avec l'outil Write).
bash_block $'cat > doc.md <<\'EOF\'\nne jamais faire git push --force\nEOF'
bash_block $'echo \'<<EOF\'\ncat .env\nEOF'
bash_block $'echo "<<EOF"\ngit push --force origin feat\nEOF'
bash_block $'true # <<EOF\ngit push origin main\nEOF'
bash_block $'(( x = 1<<Y ))\ncat .env\nY'
bash_block $'cat >/dev/null <<EOF-X\nEOF-X\ncat .env\nEOF'
bash_block $'cat >/dev/null <<\'EOF\'X\nEOFX\ngit reset --hard HEAD~3\nEOF'
# L-d résiduel (audit 6) : interpréteur en chemin absolu ou après le heredoc
bash_block $'/bin/bash <<\'EOF\'\ncat .env\nEOF'
bash_block $'cat <<\'EOF\' | bash\ncat .env\nEOF'
bash_block $'cat <<\'EOF\' | sh\ngit push --force origin feat\nEOF'
# N16 (audit 6) : entrée démesurée refusée d'emblée
raw_block  "$(python3 -c 'import json; print(json.dumps({"tool_input":{"command":"git push x "*7000}}))')"
# Branches sans test relevées par l'audit 6
bash_block "git filter-repo --path x"
bash_block "curl -u rk_live_abc: https://api.stripe.com"
bash_block "source .env"
bash_block ". .env"
bash_block "psql -h prod-main.database -c 'select 1'"
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
bash_block "cat .env.example; cat .env"
bash_block "head .env.sample; tail .env.production"
bash_block "cat .env.example; cat apps/api/.env.local"
bash_block "cat .env.example && cat .env"
bash_block "cat .env.example | cat .env"
bash_block "cat .env .env.example"
bash_block "cat .env.local .env.template"
bash_block "diff .env.example .env"
bash_block "cat .env*"
bash_ok    "git diff -- .env.example"
bash_ok    "ls -la .env.example"
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
