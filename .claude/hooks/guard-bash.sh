#!/usr/bin/env bash
# PreToolUse (Bash) : bloque les commandes dangereuses, quelle que soit la décision du modèle.
# Entrée : JSON du hook sur stdin. Sortie code 2 = commande bloquée (message sur stderr).
set -euo pipefail

input="$(cat)"
# Extrait la commande et retire le corps des heredocs (contenu écrit dans un fichier, pas exécuté),
# pour éviter les faux positifs quand un document mentionne par exemple « .env ».
cmd="$(printf '%s' "$input" | python3 -c '
import json, re, sys
cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "") or ""
out, term = [], None
for line in cmd.split("\n"):
    if term is not None:
        if line.strip() == term:
            term = None
        continue
    out.append(line)
    m = re.search(r"<<-?\s*([\x27\x22]?)([A-Za-z_][A-Za-z0-9_]*)\1", line)
    if m:
        term = m.group(2)
print("\n".join(out))
')"

block() {
  echo "Bloqué par .claude/hooks/guard-bash.sh : $1" >&2
  echo "Si c'est réellement nécessaire, demande à l'humain de l'exécuter lui-même." >&2
  exit 2
}

shopt -s nocasematch

# Git : historique partagé et branche principale
[[ "$cmd" =~ git[[:space:]].*push.*(--force|[[:space:]]-f([[:space:]]|$)|--force-with-lease|\+[a-z0-9/_-]+) ]] && block "push forcé interdit"
[[ "$cmd" =~ git[[:space:]].*push[[:space:]].*[[:space:]](origin[[:space:]]+)?(main|master)([[:space:]]|$|:) ]] && block "push direct sur main interdit"
[[ "$cmd" =~ git[[:space:]].*push[[:space:]].*:(main|master)([[:space:]]|$) ]] && block "push direct sur main interdit"
[[ "$cmd" =~ git[[:space:]]+(reset[[:space:]]+--hard|clean[[:space:]]+-[a-z]*f|filter-branch|filter-repo) ]] && block "commande git destructive"
[[ "$cmd" =~ git[[:space:]].*(--no-verify) ]] && block "contournement des hooks git interdit"

# Suppression massive
[[ "$cmd" =~ rm[[:space:]]+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)[a-z]*[[:space:]]+(/|~|\$HOME|\.|\*)([[:space:]]|$) ]] && block "suppression récursive dangereuse"

# Secrets
# Fichiers .env : toute variante (.env, .env.local, .env.dev, .env.backup…) sauf les modèles sans secret.
env_re='(cat|less|more|head|tail|grep|sed|awk|cp|mv|scp|curl|base64|xxd|strings|source)[[:space:]]([^;&|]*[/[:space:]"'"'"'=])?\.env(\.[A-Za-z0-9_-]+)?([[:space:]"'"'"']|$)'
if [[ "$cmd" =~ $env_re ]]; then
  case "${BASH_REMATCH[3]}" in
    .example|.sample|.template) ;;
    *) block "lecture ou copie d'un fichier .env" ;;
  esac
fi
[[ "$cmd" =~ (^|[[:space:]])(printenv|env)([[:space:]]|$) ]] && [[ ! "$cmd" =~ env[[:space:]]+[A-Z_]+= ]] && block "affichage de l'environnement (secrets possibles)"
key_re='(cat|less|more|head|tail|grep|sed|awk|cp|mv|scp|curl|base64|xxd|strings|openssl)[[:space:]][^|;&]*(id_rsa|id_ed25519|\.pem|\.p12|\.pfx|credentials\.json|service-account)'
[[ "$cmd" =~ $key_re ]] && block "lecture ou copie d'une clé ou d'un identifiant"

# SQL destructif et production
[[ "$cmd" =~ (drop[[:space:]]+(database|schema|table)|truncate[[:space:]]+table|truncate[[:space:]]+[a-z_]+) ]] && block "SQL destructif (DROP/TRUNCATE) hors migration relue"
[[ "$cmd" =~ (prod|production)[^[:space:]]*\.(postgres|database|db)|DATABASE_URL=.*prod ]] && block "accès base de production"
[[ "$cmd" =~ (tofu|terraform)[[:space:]]+(apply|destroy|import|state[[:space:]]+rm) ]] && block "modification d'infrastructure réservée à l'humain"
[[ "$cmd" =~ (kubectl|helm)[[:space:]] ]] && block "Kubernetes hors périmètre"
[[ "$cmd" =~ stripe[[:space:]].*(--live|live_) ]] && block "opération Stripe en mode live"
[[ "$cmd" =~ (sk_live_|rk_live_) ]] && block "clé Stripe live dans une commande"

exit 0
