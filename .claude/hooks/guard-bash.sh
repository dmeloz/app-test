#!/usr/bin/env bash
# PreToolUse (Bash) : bloque les commandes dangereuses, quelle que soit la décision du modèle.
# Entrée : JSON du hook sur stdin. Sortie code 2 = commande bloquée (message sur stderr).
set -euo pipefail

block() {
  echo "Bloqué par .claude/hooks/guard-bash.sh : $1" >&2
  echo "Si c'est réellement nécessaire, demande à l'humain de l'exécuter lui-même." >&2
  exit 2
}
# Échec fermé (N14, audit 5) : toute erreur inattendue du hook bloque la commande (code 2) au lieu
# de la laisser passer (un code ≠ 2 est une erreur non bloquante pour Claude Code).
trap 'exit 2' ERR

input="$(cat)"
# Extrait la commande et retire le corps des heredocs qui ne font qu'écrire un fichier (doc, message de
# commit), pour éviter les faux positifs quand un document mentionne « .env ». Le corps est CONSERVÉ
# (donc analysé) quand le heredoc alimente un interpréteur (bash, sh, python3, node…) — L-d, audit 5.
# « <<< » (here-string) et les décalages arithmétiques « $(( a<<b )) » ne sont pas des heredocs.
if ! cmd="$(printf '%s' "$input" | python3 -c '
import json, re, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(3)
ti = data.get("tool_input") if isinstance(data, dict) else None
cmd = ti.get("command") if isinstance(ti, dict) else None
if cmd is None:
    cmd = ""
if not isinstance(cmd, str):
    cmd = json.dumps(cmd)
interp = re.compile(r"(^|[\s;&|(])(bash|sh|zsh|dash|ksh|python3?|node|perl|ruby|php|ssh|eval|source|xargs)\b")
heredoc = re.compile(r"(?<!<)<<(?!<)-?\s*([\x27\x22]?)([A-Za-z_][A-Za-z0-9_]*)\1")
out, term, keep = [], None, False
for line in cmd.split("\n"):
    if term is not None:
        if line.strip() == term:
            term = None
            out.append(line)
        elif keep:
            out.append(line)
        continue
    out.append(line)
    m = heredoc.search(line)
    if m and "$((" not in line[: m.start()]:
        term = m.group(2)
        keep = bool(interp.search(line[: m.start()]))
sys.stdout.buffer.write("\n".join(out).encode("utf-8", "replace"))
')"; then
  block "analyse de la commande impossible (entrée malformée)"
fi

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
# Fichiers .env : toute variante (.env, .env.local, .env.production.local, .env.local.bak, globs .env*)
# sauf les modèles terminaux exacts (.env.example, .env.sample, .env.template). CHAQUE mention est examinée
# (pas seulement la première) dès qu'un verbe de lecture/copie ou un « source »/« . » est présent.
# Limite connue : liste de verbes = défense en profondeur, pas une garantie (voir .claude/rules/security.md).
if ! CMD="$cmd" python3 - <<'PY'
import os, re, sys
cmd = os.environ["CMD"]
verbs = r"(cat|less|more|head|tail|grep|rg|sed|awk|cp|mv|scp|rsync|curl|base64|xxd|od|strings|source|tac|nl|diff|cmp|vi|vim|nano|python3?|node)"
reader = re.search(r"(?<![\w.-])" + verbs + r"(\s|<|$)", cmd, re.I) or re.search(r"(^|[;&|]\s*)\.\s+\S", cmd)
if not reader:
    sys.exit(0)
for m in re.finditer(r"(?:^|[/\s\"'=<(`$@:])\.env((?:\.[\w-]+)*)(?=[\s\"'<>|;&)*?\[`]|$)", cmd, re.I):
    if m.group(1).lower() not in (".example", ".sample", ".template"):
        sys.exit(1)
sys.exit(0)
PY
then
  block "lecture ou copie d'un fichier .env"
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
