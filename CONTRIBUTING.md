# Guide de Contribution — NkapCAYA

## Stratégie de Branches

```
main          ← Production uniquement (tags semver)
  └── develop ← Branche d'intégration
        ├── feature/MOD-01-auth-jwt
        ├── feature/MOD-05-sessions-transactions
        ├── fix/loan-interest-calculation
        └── docs/schema-prisma-update
```

## Workflow Standard

```bash
# 1. Toujours partir de develop
git checkout develop && git pull origin develop

# 2. Créer une branche de fonctionnalité
git checkout -b feature/MOD-07-loans-accrual

# 3. Développer, tester localement
pnpm test

# 4. Committer avec convention
git commit -m "feat(loans): implémenter le calcul d'accrual mensuel glissant"

# 5. Pousser et ouvrir une PR vers develop
git push origin feature/MOD-07-loans-accrual
```

## Convention des Messages de Commit

Format : `type(scope): description courte`

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `test` | Ajout ou correction de tests |
| `refactor` | Refactoring sans changement de comportement |
| `chore` | Maintenance, dépendances |
| `perf` | Amélioration de performance |

**Scopes valides** : `auth`, `config`, `members`, `fiscal-year`, `sessions`,
`savings`, `loans`, `rescue-fund`, `beneficiaries`, `cassation`, `reports`,
`notifications`, `schema`, `api`, `web`, `mobile`

## Règles de Qualité

- Toute PR doit passer les tests automatisés (CI)
- Couverture de tests minimale : 80% par module
- Les invariants métier doivent avoir un test unitaire dédié
- Aucune valeur financière en `float` ou `double` — uniquement `Decimal`
- Aucune saisie manuelle d'une valeur calculable
