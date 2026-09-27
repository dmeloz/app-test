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
# N16 (audit 6) : les expressions régulières ont un coût quadratique ; une entrée démesurée pourrait
# dépasser le délai du hook (échec ouvert). On refuse d'emblée au-delà de 64 Ko.
(( ${#input} > 65536 )) && block "commande trop longue pour être analysée (> 64 Ko)"

# Extraction de la commande (N14 : échec fermé).
#   mode « raw »      : commande brute, utilisée par TOUTES les règles (N15, audit 6) ;
#   mode « stripped » : corps des heredocs qui ne font qu'écrire un fichier retirés, utilisé UNIQUEMENT
#                       par la règle des fichiers de secrets (évite les faux positifs quand un document
#                       mentionne ces fichiers). En cas de doute (marqueur entre guillemets, dans un
#                       commentaire, arithmétique, délimiteur suivi d'autre chose qu'un métacaractère,
#                       interpréteur où que ce soit sur la ligne), le corps est CONSERVÉ.
extract() {
  printf '%s' "$input" | python3 -c '
import json, re, sys
mode = sys.argv[1]
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
if mode == "raw":
    sys.stdout.buffer.write(cmd.encode("utf-8", "replace"))
    sys.exit(0)
interp = re.compile(r"(?<![\w.-])(bash|sh|zsh|dash|ksh|python3?|node|perl|ruby|php|ssh|eval|source|xargs|env)\b")
# N17 (audit-7) : groupe dedie pour le tiret de `<<-` (tabulations de tete tolerees cote
# terminateur, seule variante autorisee par bash) -- voir `real_terminator_match` ci-dessous.
# (Commentaires Python de ce bloc sans accent ni apostrophe : ce bloc reste dans une chaine bash
# entre apostrophes simples, ligne 28 -- une apostrophe ici romprait la chaine, cf. correctif N17.)
heredoc = re.compile(r"(?<!<)<<(?!<)(-)?\s*([\x27\x22]?)([A-Za-z_][A-Za-z0-9_]*)\2(?=[\s;&|<>)]|$)")
def real_heredoc(prefix):
    if prefix.count("\x27") % 2 or prefix.count("\x22") % 2:
        return False
    if re.search(r"(^|\s)#", prefix) or "((" in prefix:
        return False
    return True
# N17 (audit-7) : bash exige une correspondance EXACTE de la ligne de terminaison pour un `<<`
# simple (aucun espace de tete ni de fin tolere -- verifie dans cet environnement : `bash <<EOF` avec
# un EOF indente ou suivi d espaces ne termine PAS le heredoc, seule la ligne strictement egale au
# delimiteur le fait). Seul `<<-` tolere des tabulations de tete (et uniquement celles-ci, jamais des
# espaces ni de fin de ligne). L ancien `line.strip() == term` (tolerant a tort les deux, pour les
# deux variantes) provoquait de faux marqueurs de fin : un texte de heredoc mentionnant une ligne
# ressemblant au delimiteur (indentee, ou suivie d espaces) terminait le heredoc prematurement, faisant
# fuiter le reste du corps (potentiellement une mention de .env) hors de la zone retiree par ce mode
# stripped, et declenchant un faux positif de blocage sur une commande legitime (ex. rediger un
# document qui mentionne .env). Correspondance stricte = moins de faux marqueurs, fidele a bash.
def real_terminator_match(line, term, dash):
    if dash:
        return line.lstrip("\t") == term
    return line == term
out, term, keep, dash = [], None, False, False
for line in cmd.split("\n"):
    if term is not None:
        if real_terminator_match(line, term, dash):
            term = None
            out.append(line)
        elif keep:
            out.append(line)
        continue
    out.append(line)
    m = heredoc.search(line)
    if m and real_heredoc(line[: m.start()]):
        dash = bool(m.group(1))
        term = m.group(3)
        keep = bool(interp.search(line))
sys.stdout.buffer.write("\n".join(out).encode("utf-8", "replace"))
' "$1"
}
if ! cmd="$(extract raw)"; then
  block "analyse de la commande impossible (entrée malformée)"
fi
if ! env_cmd="$(extract stripped)"; then
  block "analyse de la commande impossible (entrée malformée)"
fi

shopt -s nocasematch

# Git : historique partagé et branche principale
[[ "$cmd" =~ git[[:space:]].*push.*(--force|[[:space:]]-f([[:space:]]|$)|--force-with-lease|\+[a-z0-9/_-]+) ]] && block "push forcé interdit"
[[ "$cmd" =~ git[[:space:]].*push[[:space:]].*[[:space:]](origin[[:space:]]+)?(main|master)([[:space:]]|$|:) ]] && block "push direct sur main interdit"
[[ "$cmd" =~ git[[:space:]].*push[[:space:]].*:(main|master)([[:space:]]|$) ]] && block "push direct sur main interdit"
[[ "$cmd" =~ git[[:space:]]+(reset[[:space:]]+--hard|clean[[:space:]]+-[a-z]*f|filter-branch|filter-repo) ]] && block "commande git destructive"
[[ "$cmd" =~ git[[:space:]].*(--no-verify) ]] && block "contournement des hooks git interdit"

# G4 (audit-7, gouvernance) : la règle 11 du CLAUDE.md interdit de contourner les checks obligatoires
# avant fusion (audit indépendant APPROVED, checks `ci`/`docker-api` verts) — bloqué ici aussi, pas
# seulement dans le texte de la règle. `gh pr merge --admin` outrepasse la protection de branche ;
# modifier ou supprimer un ruleset/une protection de branche via l'API GitHub a le même effet que
# désactiver les checks. GET reste autorisé (lecture seule, pas de contournement).
[[ "$cmd" =~ gh[[:space:]]+pr[[:space:]]+merge.*(--admin) ]] && block "fusion de PR via --admin (contournement des checks) interdite"
[[ "$cmd" =~ gh[[:space:]]+api ]] && [[ "$cmd" =~ (rulesets|branches/[^[:space:]]*/protection) ]] && [[ "$cmd" =~ (-X|--method)[[:space:]]+(PUT|PATCH|POST|DELETE) ]] && block "modification du ruleset ou de la protection de branche via gh api interdite"
[[ "$cmd" =~ gh[[:space:]]+ruleset[[:space:]]+(create|edit|update|delete|import) ]] && block "modification de ruleset via gh ruleset interdite"

# Suppression massive
[[ "$cmd" =~ rm[[:space:]]+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)[a-z]*[[:space:]]+(/|~|\$HOME|\.|\*)([[:space:]]|$) ]] && block "suppression récursive dangereuse"

# Secrets
# Fichiers .env : toute variante (.env, .env.local, .env.production.local, .env.local.bak, globs .env*)
# sauf les modèles terminaux exacts (.env.example, .env.sample, .env.template). CHAQUE mention est examinée
# (pas seulement la première) dès qu'un verbe de lecture/copie ou un « source »/« . » est présent.
# Limite connue : liste de verbes = défense en profondeur, pas une garantie (voir .claude/rules/security.md).
if ! CMD="$env_cmd" python3 - <<'PY'
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
