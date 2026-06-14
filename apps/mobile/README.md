# 📱 caya_mobile — Application membre NkapCAYA

Interface mobile **membre** de la tontine CAYA (Club des Amis de Yaoundé) : consultation de
son épargne, de ses prêts, du fonds de secours et de son profil. L'administration (bureau)
se fait via l'application web.

> Application en **consultation** : les écritures (paiements, demande de prêt) ne sont pas
> encore exposées. Voir la feuille de route en bas de page.

---

## Stack technique

| Domaine | Choix |
|---|---|
| Framework | Flutter 3.x / Dart 3.2+ |
| État | Riverpod (`flutter_riverpod`) |
| Navigation | `go_router` (avec redirections d'auth) |
| Réseau | `dio` (+ intercepteur de refresh token) |
| Stockage sécurisé | `flutter_secure_storage` (tokens) |
| Graphiques | `fl_chart` |
| Architecture | Clean Architecture par feature (`data` / `domain` / `presentation`) |

---

## Configuration (`.env`)

L'URL de l'API est résolue dans cet ordre (voir `lib/shared/providers/api_providers.dart`) :

1. `LOCAL_BASE_URL` — **uniquement en mode debug** (priorité absolue, pour un backend local) ;
2. l'URL de la tontine sélectionnée ;
3. `API_BASE_URL` (production) ;
4. repli : `AppConstants.prodBaseUrl`.

Fichier `.env` (chargé comme asset, voir `pubspec.yaml`) :

```dotenv
# Production (Hostinger)
API_BASE_URL=https://api.nkapzen.com/api/v1

# Développement local (décommenter ; prioritaire en debug)
# Device physique : adb reverse tcp:3000 tcp:3000
# LOCAL_BASE_URL=http://localhost:3000/api/v1
```

> ⚠️ L'API NestJS utilise un préfixe `/api` + versioning URI (`v1`) : l'URL de base doit
> donc se terminer par `/api/v1`. Le health-check (`/health`) est, lui, hors préfixe.

---

## Démarrage

```bash
flutter pub get
flutter run            # device/émulateur connecté
```

## Qualité

```bash
flutter analyze        # lint statique (doit rester vert)
flutter test           # tests unitaires + de contrat + widget
```

---

## Architecture (`lib/`)

```
core/            # constantes, thème, réseau (dio), router, utils, erreurs
features/<f>/    # une feature = data / domain / presentation
  data/          #   models (fromJson), datasources, repositories impl
  domain/        #   entities, repositories (interfaces), usecases
  presentation/  #   pages, widgets, providers Riverpod
shared/          # providers transverses (auth, tontine, membership courant)
```

Features : `auth`, `dashboard`, `savings`, `loans`, `rescue_fund`, `profile`,
`tontine`, `payments`, `splash`, `onboarding`.

### Tests de contrat

`test/features/**/models/*_test.dart` figent le format JSON attendu de l'API
(champs Prisma) pour détecter toute dérive de contrat — par ex. `LoanStatus`
(incl. `PARTIALLY_REPAID`), `SavingsLedger.lastUpdatedAt`, `Membership.profileId`
et `sharesCount` (relation `shareCommitment`).

---

## Parcours

`Splash → (Onboarding) → Sélection tontine → Login → Shell 6 onglets`
(Accueil · Épargne · Prêts · Paiements · Secours · Profil).

Le `membershipId` (clé des écrans Épargne/Prêts/Secours) est résolu par
`currentMembershipProvider` : `GET /members/me` → `GET /members/:id/memberships`
→ adhésion active.

---

## Feuille de route (hors périmètre actuel)

- Onglet **Paiements** : intégration Mobile Money (Orange / MTN) côté API.
- **Actions prêts** : demande / remboursement depuis le mobile.
- **Notifications push** : `firebase_messaging` (requiert `google-services.json`).
- **Position individuelle** du fonds de secours (endpoint API à exposer).
