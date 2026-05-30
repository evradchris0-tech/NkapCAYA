# Déploiement de l'API NkapZen sur un VPS (Docker)

Sur un VPS (vrai conteneur), le moteur Prisma fonctionne normalement — fini le
crash `PANIC: timer has gone away` de l'hébergement mutualisé.

Cette stack déploie **l'API + MySQL + Caddy** (HTTPS auto). Le **web reste sur Vercel**.

## 0. Pré-requis
- Un VPS Hostinger (Ubuntu 22.04+). Idéalement le template **« avec Docker »**.
- Son **IP publique** et l'accès **SSH root**.
- Ports **22, 80, 443** ouverts (firewall hPanel).

## 1. DNS — pointer l'API vers le VPS
Dans la zone DNS de `nkapzen.com` : enregistrement **A** `api` → **IP du VPS**
(baisse le TTL à 300 avant, pour une bascule rapide). Aujourd'hui `api.nkapzen.com`
pointe vers le mutualisé ; on le bascule sur le VPS.

## 2. Sur le VPS (SSH root)
```bash
# Docker (si absent)
curl -fsSL https://get.docker.com | sh

# Récupérer le code (master, une fois la PR vps-deploy mergée)
git clone https://github.com/evradchris0-tech/NkapCAYA.git
cd NkapCAYA && git checkout master
cd deploy/vps

# Config
cp .env.example .env
nano .env        # remplis mots de passe MySQL + secrets JWT (repris de la prod)

# Build + démarrage (migrations Prisma appliquées au boot)
docker compose up -d --build
```
*(Dépôt privé ? utilise un token : `git clone https://<TOKEN>@github.com/evradchris0-tech/NkapCAYA.git`.)*

## 3. Initialiser les données essentielles (une fois)
Base neuve = **0 exercice** (ce que tu voulais). On crée juste l'admin + la config :
```bash
docker compose exec api pnpm db:seed     # SEED_DEMO non défini → admin + config seulement
```
Identifiants admin créés : **admin / Caya@2026!** → **change le mot de passe** dès la 1ʳᵉ connexion.

## 4. Vérifier
```bash
curl -s https://api.nkapzen.com/api/v1/health    # doit répondre (≈ {"status":"ok"})
docker compose logs -f api                        # logs de l'API
```
Puis connecte-toi sur le web (Vercel) — il appelle déjà `https://api.nkapzen.com/api/v1`,
qui pointe maintenant vers le VPS. Rien à changer côté Vercel.

## 5. (Optionnel) Reprendre des données du mutualisé
Si tu veux garder des données de l'ancienne base :
```bash
# Exporte depuis phpMyAdmin (Export → SQL) → dump.sql, copie-le sur le VPS, puis :
docker compose exec -T mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" nkapzen < dump.sql
```
Sinon : base neuve (recommandé, vu que tu voulais 0 exercice).

## Exploitation
```bash
docker compose ps                 # état des services
docker compose restart api        # redémarrer l'API
docker compose pull && docker compose up -d --build   # mettre à jour après un git pull
docker compose logs -f caddy      # vérifier l'émission du certificat SSL
```

## Mises à jour futures
```bash
cd ~/NkapCAYA && git pull && cd deploy/vps && docker compose up -d --build
```
Les migrations Prisma s'appliquent automatiquement au redémarrage de l'API.
