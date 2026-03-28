import { CheckCircle2, AlertCircle, Users, CreditCard, Phone } from 'lucide-react';
import PageHeader from '@components/layout/PageHeader';
import MemberForm from '@components/forms/MemberForm';

const CHECKLIST = [
  { icon: Users, label: 'Nom et prénom complets', required: true },
  { icon: Phone, label: 'Numéro de téléphone principal', required: true },
  { icon: Users, label: 'Quartier de résidence', required: true },
  { icon: CreditCard, label: 'Numéro Mobile Money (optionnel)', required: false },
  { icon: Users, label: 'Contact d\'urgence (optionnel)', required: false },
];

const NOTES = [
  'Un identifiant unique et un mot de passe temporaire seront générés automatiquement.',
  'Le membre devra changer son mot de passe lors de sa première connexion.',
  'L\'inscription à l\'exercice fiscal se fait séparément depuis la page Exercices.',
  'Le code membre est attribué automatiquement par le système.',
];

export default function NewMemberPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau membre"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Membres', href: '/members' },
          { label: 'Nouveau' },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Formulaire */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <MemberForm />
        </div>

        {/* Panneau d'aide */}
        <div className="space-y-4">
          {/* Checklist informations */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Informations à préparer</h3>
            <ul className="space-y-2.5">
              {CHECKLIST.map(({ icon: Icon, label, required }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm">
                  {required ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-gray-300 shrink-0" />
                  )}
                  <span className={required ? 'text-gray-700' : 'text-gray-400'}>
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Notes importantes */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              À noter
            </h3>
            <ul className="space-y-2">
              {NOTES.map((note) => (
                <li key={note} className="text-xs text-blue-700 flex gap-2">
                  <span className="text-blue-400 shrink-0 mt-0.5">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* Frais d'adhésion */}
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">Frais d&apos;adhésion</h3>
            <p className="text-xs text-amber-700">
              Les frais d&apos;inscription (nouveau ou réinscrit) sont définis dans la configuration
              de l&apos;exercice fiscal. Ils seront collectés lors de la première session du membre.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
