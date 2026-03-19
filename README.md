# 🏦 NkapCAYA — Club des Amis de Yaoundé

> Application de gestion complète de la tontine CAYA — dématérialisation intégrale du système d'épargne rotative, prêts, caisse de secours et cassation.

---

## Architecture du Dépôt (Monorepo)

```
NkapCAYA/
├── apps/
│   ├── api/          → Backend NestJS (TypeScript) — 12 modules DDD
│   ├── web/          → Frontend Next.js (React/TypeScript) — interface bureau
│   └── mobile/       → Application Flutter (Dart) — interface membres
├── database/
│   ├── schema.prisma → Schéma Prisma (source de vérité MySQL)
│   ├── migrations/   → Migrations versionnées
│   └── seeds/        → Données initiales
├── docs/
│   ├── cahier_des_charges_CAYA.tex
│   ├── cahier_de_conception_CAYA.tex
│   └── cahier_des_diagrammes_CAYA.tex
├── .github/
│   └── workflows/    → CI/CD GitHub Actions
└── packages/
    └── shared-types/ → Types TypeScript partagés (API ↔ Web)
```

---

## Stack Technique

| Couche | Technologie | Version |
|---|---|---|
| Backend API | NestJS + TypeScript | 10.x |
| Base de données | MySQL | 8.0 |
| ORM | Prisma | 5.x |
| Frontend Web | Next.js + React | 14.x |
| Mobile | Flutter + Dart | 3.x |
| Authentification | JWT + Refresh Token | — |
| Notifications | WhatsApp Business API + SMS | — |

---

## Modules Applicatifs

| # | Module | Responsabilité |
|---|---|---|
| 01 | `auth` | Authentification, rôles RBAC, sessions |
| 02 | `config` | Paramètres CAYA, snapshot exercice |
| 03 | `members` | Profils membres, parrainage |
| 04 | `fiscal-year` | Exercice fiscal, adhésions, parts |
| 05 | `sessions` | Réunions mensuelles, transactions |
| 06 | `savings` | Épargne, redistribution des intérêts |
| 07 | `loans` | Prêts, accrual mensuel, remboursements |
| 08 | `rescue-fund` | Caisse de secours, événements |
| 09 | `beneficiaries` | Planning bénéficiaires, désignation |
| 10 | `cassation` | Clôture exercice, rollover prêts |
| 11 | `reports` | PDF, Excel, graphiques, tableau de bord |
| 12 | `notifications` | WhatsApp, SMS, rappels automatiques |

---

## Démarrage Rapide

```bash
# Prérequis : Node 20+, pnpm 8+, MySQL 8.0, Flutter 3.x

# 1. Installer les dépendances
pnpm install

# 2. Configurer les variables d'environnement
cp apps/api/.env.example apps/api/.env
# Éditer apps/api/.env avec vos paramètres MySQL

# 3. Initialiser la base de données
cd database && pnpm prisma migrate dev

# 4. Lancer l'API en développement
cd apps/api && pnpm dev

# 5. Lancer le web en développement
cd apps/web && pnpm dev

# 6. Lancer le mobile Flutter
cd apps/mobile && flutter run
```

---

## Stratégie de Branches

```
main          → Production (tags de release)
develop       → Intégration continue
feature/MOD-XX-nom   → Fonctionnalités par module
fix/description      → Corrections de bugs
docs/description     → Documentation
```

## Conventions de Commit

```
feat(auth): ajouter la garde JWT pour les routes protégées
fix(loans): corriger le calcul de l'encours glissant au mois 3
docs(schema): mettre à jour le schéma Prisma — entité MemberProfile
test(savings): ajouter les tests de redistribution des intérêts
refactor(sessions): extraire la logique de référencement des transactions
```

---

## Licence

Projet privé — Club des Amis de Yaoundé © 2026
