## Description

<!-- Décrivez brièvement les changements apportés -->

## Type de changement

- [ ] `feat` — Nouvelle fonctionnalité
- [ ] `fix` — Correction de bug
- [ ] `docs` — Documentation
- [ ] `test` — Tests
- [ ] `refactor` — Refactoring
- [ ] `chore` — Maintenance

## Module(s) impacté(s)

- [ ] auth
- [ ] config
- [ ] members
- [ ] fiscal-year
- [ ] sessions
- [ ] savings
- [ ] loans
- [ ] rescue-fund
- [ ] beneficiaries
- [ ] cassation
- [ ] reports
- [ ] notifications
- [ ] schema/database
- [ ] web
- [ ] mobile

## Invariants métier vérifiés

<!-- Listez les invariants métier couverts par cette PR -->

## Tests

- [ ] Tests unitaires ajoutés / mis à jour
- [ ] Tous les tests passent en local (`pnpm test`)
- [ ] Couverture ≥ 80% sur le module modifié

## Checklist

- [ ] Le code suit les conventions du projet (ESLint + Prettier)
- [ ] Aucune valeur `float`/`double` pour les montants financiers
- [ ] Aucune valeur calculable saisie en dur
- [ ] Le schéma Prisma est à jour si modification de données
- [ ] La documentation Swagger est à jour
