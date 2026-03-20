# Guide Complet d'Interaction avec V0 - Projet CAYA

## 1. STRUCTURE DU PROJET

### Architecture Monorepo (pnpm workspaces)
```
nkap-caya/
├── apps/
│   ├── api/              # Backend NestJS
│   └── web/              # Frontend Next.js 14 + React 18
├── packages/             # Packages partagés
├── database/             # Prisma schema et migrations
└── scripts/              # Scripts d'exécution
```

### Stack Technologique
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: NestJS, Prisma ORM, PostgreSQL
- **Package Manager**: pnpm 8.15.4+
- **Node Version**: 20.0.0+

### Dossiers Clés Frontend (`apps/web/src/`)
```
├── app/
│   ├── (auth)/           # Routes non authentifiées (login)
│   ├── (dashboard)/      # Routes authentifiées (protection middleware)
│   │   ├── members/      # Gestion des membres
│   │   ├── sessions/     # Gestion des sessions
│   │   ├── loans/        # Gestion des prêts
│   │   ├── savings/      # Gestion de l'épargne
│   │   ├── rescue-fund/  # Caisse de secours
│   │   ├── beneficiaries/ # Bénéficiaires
│   │   ├── reports/      # Rapports
│   │   └── config/       # Configuration admin
│   ├── globals.css       # Styles globaux + design tokens
│   └── layout.tsx        # Root layout
├── components/
│   ├── layout/           # Sidebar, Header, PageHeader
│   ├── ui/               # Card, Button, Input, Table, Modal, Badge
│   └── forms/            # MemberForm, TransactionForm, etc.
├── lib/
│   ├── hooks/            # useAuth, custom hooks
│   ├── utils/            # Fonctions utilitaires
│   └── api.ts            # Client API
└── types/                # Types TypeScript globaux
```

---

## 2. SYSTÈME DE DESIGN (Design Tokens)

### Palette de Couleurs
```
Primary (Bleu professionnel):
- --primary: #0066cc
- --primary-dark: #0052a3

Neutres:
- --background: #ffffff (fond)
- --foreground: #1a1a1a (texte principal)
- --secondary: #f5f5f5 (fond secondaire)

Accents:
- --accent: #10b981 (vert succès)
- --muted: #e0e0e0 (gris léger)
- --muted-foreground: #666666 (texte gris)
- --border: #e5e7eb (bordures)
```

### Classes Tailwind Personnalisées
```
- bg-background, text-foreground, text-muted-foreground
- border-border
- shadow-soft (léger)
- shadow-elevated (profond)
- transition-smooth (300ms)
```

### Typographie
- **Headings**: Font-weight 600, letter-spacing -0.02em
  - h1: 2.25rem | h2: 1.875rem | h3: 1.5rem | h4: 1.25rem
- **Body**: Inter (système), line-height 1.5-1.6
- **Buttons**: font-semibold, transitions 200ms

---

## 3. STRUCTURE DES FICHIERS À MODIFIER

### Fichiers de Configuration Principaux
```
apps/web/
├── src/app/globals.css         ← Styles globaux + design tokens
├── src/app/layout.tsx          ← Root layout + metadata
├── tailwind.config.ts          ← Config Tailwind + extensions
├── next.config.js              ← Config Next.js
└── tsconfig.json               ← Config TypeScript
```

### Composants UI Réutilisables
```
apps/web/src/components/ui/
├── Button.tsx          ← Boutons (primary, secondary, danger, ghost)
├── Card.tsx            ← Cartes (padding: sm/md/lg)
├── Input.tsx           ← Inputs avec label/error/helperText
├── Table.tsx           ← Tableaux génériques
├── Modal.tsx           ← Modales
├── Badge.tsx           ← Badges (success, warning, danger, info, neutral)
└── [autres].tsx
```

### Composants Layout
```
apps/web/src/components/layout/
├── Sidebar.tsx         ← Navigation principale
├── Header.tsx          ← Header avec user/logout
└── PageHeader.tsx      ← Titre page + breadcrumbs
```

---

## 4. COMMENT FORMULER VOS DEMANDES OPTIMALEMENT

### Format Recommandé pour les Requêtes

#### A. Modifications de Style/Design
```
[TYPE] Améliorer [COMPOSANT] 

Changements souhaités:
- [Détail 1]
- [Détail 2]
- [Détail 3]

Fichier(s) concerné(s): [Chemin exact ou composant]
Cascade: [Y/N] - Affecte d'autres pages?
```

**Exemple:**
```
[STYLE] Améliorer le Sidebar

Changements souhaités:
- Augmenter la padding de 3 à 6
- Changer la couleur du hover de bg-gray-800 à bg-blue-600
- Ajouter une transition smooth de 300ms

Fichier(s) concerné(s): apps/web/src/components/layout/Sidebar.tsx
Cascade: Oui - Affecte l'ensemble du dashboard
```

#### B. Nouvelles Fonctionnalités
```
[FEATURE] Ajouter [DESCRIPTION]

Requirements:
- Composant: [nom]
- Emplacement: [chemin]
- Données: [Où viennent-elles?]
- Interactions: [Détails du comportement]
- Pages affectées: [liste]
```

**Exemple:**
```
[FEATURE] Ajouter bouton d'export Excel

Requirements:
- Composant: ExportButton
- Emplacement: apps/web/src/components/ui/ExportButton.tsx
- Données: Récupérées via /api/export
- Interactions: 
  * Au clic, télécharge un fichier .xlsx
  * Affiche un loading spinner pendant
  * Toast de succès/erreur
- Pages affectées: Reports, Dashboard
```

#### C. Corrections de Bugs
```
[BUG] [DESCRIPTION du bug]

Symptôme: [Que se passe-t-il?]
Fichier(s): [Où chercher]
Contexte: [Quand/Comment reproduire]
Comportement attendu: [Que devrait-il se passer?]
```

#### D. Refactoring/Optimisation
```
[REFACTOR] [DESCRIPTION]

Objectif: [Quoi améliorer?]
Scope: [Fichiers/Composants affectés]
Patterns à appliquer: [Si vous en avez]
```

---

## 5. BONNES PRATIQUES POUR VOS PROMPTS

### ✅ À FAIRE

1. **Soyez Spécifique**
   - ❌ "Améliore le design"
   - ✅ "Augmente le padding de Card de 16px à 24px et ajoute une ombre douce"

2. **Fournissez du Contexte**
   - ❌ "Change les couleurs"
   - ✅ "Change la couleur primaire du bouton de #0066cc à #0052a3 pour un meilleur contraste"

3. **Mentionnez les Fichiers**
   - ✅ "apps/web/src/components/ui/Button.tsx"
   - Évite que v0 cherche au mauvais endroit

4. **Décrivez l'Impact**
   - ✅ "Cascade: Oui - Affecte tous les boutons du projet"
   - Permet à v0 d'identifier les dépendances

5. **Utilisez des Exemples**
   - ✅ "Comme dans [composant similaire], ajoute..."
   - Facilite la cohérence

### ❌ À ÉVITER

- Demandes vagues ("Rends ça mieux")
- Modifications sans contexte business
- Demandes très complexes sans découpage
- Oublier de mentionner les fichiers impliqués
- Changer trop de choses en une demande

---

## 6. PROCESSUS DE COMMUNICATION OPTIMAL

### Étape 1: Préparer la Demande
```
□ Identifier exactement ce qui doit changer
□ Trouver les fichiers concernés
□ Vérifier les dépendances
□ Écrire la demande en suivant les formats ci-dessus
```

### Étape 2: Fournir les Détails
```
[TYPE] Titre clair

Changements demandés:
- Point 1
- Point 2
- Point 3

Fichiers: [Chemin exact]
Cascade: [Oui/Non]
Priorité: [Haute/Moyenne/Basse]
```

### Étape 3: Attendre + Vérifier
```
□ v0 explore le codebase
□ v0 modifie les fichiers
□ v0 affiche un résumé
□ Vérifiez dans la preview
```

### Étape 4: Feedback
```
Si erreur ou non-conforme:
"[FEEDBACK] [Détail du problème]"

Si parfait:
"Validé! Passons à [prochaine tâche]"
```

---

## 7. COMMANDES PNPM COURANTES

```bash
# Développement
pnpm dev:web              # Lancer le frontend (http://localhost:3000)
pnpm dev:api              # Lancer le backend

# Construction
pnpm build:web            # Builder le frontend
pnpm build:api            # Builder le backend

# Database
pnpm db:migrate           # Appliquer les migrations
pnpm db:generate          # Générer le client Prisma
pnpm db:seed              # Seeder la DB
pnpm db:studio            # Ouvrir Prisma Studio

# Linting
pnpm lint                 # Linter tous les packages

# Testing
pnpm test                 # Tests API
pnpm test:e2e             # Tests E2E
```

---

## 8. PATTERNS ET CONVENTIONS

### Nommage des Fichiers
```
components/ui/Button.tsx       ← PascalCase
components/forms/memberForm.tsx ← camelCase ou kebab-case
hooks/useAuth.ts               ← use + PascalCase
lib/api.ts                      ← camelCase
pages/[id]/page.tsx            ← kebab-case pour dossiers dynamiques
```

### Structure des Composants
```tsx
// ✅ BON - Composant fonctionnel avec types
import { ReactNode } from 'react';

interface ComponentProps {
  children: ReactNode;
  className?: string;
}

export default function Component({ children, className }: ComponentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
```

### Utilisation de Tailwind
```tsx
// ✅ BON - Design tokens + classes Tailwind
<div className="bg-background border border-border rounded-lg p-6 shadow-soft">
  <h2 className="text-2xl font-semibold text-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ MAUVAIS - Classes hardcoded
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
```

### Responsive Design
```tsx
// ✅ Mobile-first avec breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  
// ❌ Desktop-first
<div className="grid grid-cols-3 gap-4">
```

---

## 9. EXEMPLE COMPLET DE DEMANDE BIEN STRUCTURÉE

```
[STYLE] Moderniser la page Dashboard

Changements demandés:
1. KPI Cards: Augmenter l'espacement entre les cartes de 4 à 6
2. KPI Cards: Ajouter une ombre au hover
3. Title "Tableau de bord": Augmenter la taille de 2xl à 3xl
4. Tout le contenu: Utiliser le token --muted-foreground au lieu de gris

Fichiers concernés:
- apps/web/src/app/(dashboard)/page.tsx
- apps/web/src/components/ui/Card.tsx

Cascade: Oui - Affecte toutes les cartes du projet

Détails additionnels:
- Conserver la cohérence avec les autres pages
- Tester la responsivité mobile
- Vérifier que le contraste reste conforme (WCAG AA)
```

---

## 10. CHECKLIST POUR DÉBOGUER LES PROBLÈMES

Si une demande échoue ou produit une erreur:

```
□ Vérifier le fichier exactement modifié dans les logs d'erreur
□ Lire le contenu du fichier après modification
□ Chercher les références dépendantes (imports, cascades)
□ Vérifier les erreurs TypeScript ou Tailwind
□ Tester dans la preview après correction
□ Signaler le problème spécifique avec fichier + ligne
```

---

## 11. RESSOURCES ET DOCUMENTATION

### Documentation Officielle
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs
- Prisma: https://www.prisma.io/docs

### Fichiers de Référence du Projet
- Design tokens: `apps/web/src/app/globals.css`
- Config Tailwind: `apps/web/tailwind.config.ts`
- Composants UI: `apps/web/src/components/ui/`
- Types: `apps/web/src/types/`

---

## 12. MODÈLE SIMPLIFIÉ POUR FUTURES DEMANDES

Copiez-collez ce modèle pour vos futures demandes:

```
[TYPE: STYLE/FEATURE/BUG/REFACTOR] Titre de la demande

Description:
[Contexte et objectif]

Changements/Requirements:
- Point 1
- Point 2
- Point 3

Fichiers: [chemins]
Cascade: [Oui/Non]
Priorité: [Haute/Moyenne/Basse]

Notes additionnelles:
[Toute info utile]
```

---

## 13. QUESTIONS FRÉQUENTES

**Q: Pourquoi v0 change plusieurs fichiers?**
A: Si une modification affecte plusieurs composants interconnectés, v0 modifie tous les fichiers concernés pour maintenir la cohérence.

**Q: Comment minimiser les erreurs?**
A: En fournissant le plus de contexte possible et en spécifiant exactement les fichiers et les changements.

**Q: Peut-on revenir en arrière si on n'aime pas?**
A: Oui! v0 peut revenir à la version précédente ou modifier à nouveau. Signalez le problème clairement.

**Q: Comment tester mes changements?**
A: La preview en bas à gauche se met à jour automatiquement. Accédez-la via le port détecté.

---

## Résumé Final

Pour les meilleures résultats:
1. Utilisez le format structuré ci-dessus
2. Soyez spécifique et fournissez du contexte
3. Mentionnez les fichiers exactement
4. Décrivez l'impact (cascade)
5. Attendez les modifications et testez
6. Donnez un feedback clair

Bonne chance avec votre projet CAYA! 🚀
