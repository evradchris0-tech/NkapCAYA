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
- [ ] Aucune valeur `float`/`double` pour les montants financiers (utiliser `Decimal`)
- [ ] Aucune valeur calculable saisie en dur
- [ ] Le schéma Prisma est à jour si modification de données
- [ ] Une migration a été créée si le schéma a changé (`pnpm db:migrate`)
- [ ] La documentation Swagger est à jour (`@ApiOperation`, `@ApiResponse`)

## Sécurité

- [ ] Aucun secret / token / mot de passe dans le code ou les logs
- [ ] Les routes protégées ont `@UseGuards(JwtAuthGuard)`
- [ ] Les routes à rôle restreint ont `@Roles(...)` + `RolesGuard`
- [ ] Les inputs utilisateur sont validés par `class-validator`

## Tests manuels

<!-- Commande curl ou scénario Swagger pour vérifier le comportement -->

```bash
# Exemple :
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "admin", "password": "Caya@2026!"}'
```
