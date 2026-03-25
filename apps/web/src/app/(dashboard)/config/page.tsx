'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import { InfoTooltip } from '@components/ui/Tooltip';
import { useConfig, useUpdateConfig, useRescueEventAmounts, useUpdateRescueEventAmount } from '@lib/hooks/useConfig';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { RescueEventType } from '@/types/api.types';

const EVENT_TYPE_LABELS: Record<RescueEventType, string> = {
  MEMBER_DEATH:   'Décès du membre',
  RELATIVE_DEATH: "Décès d'un proche",
  MARRIAGE:       'Mariage',
  BIRTH:          'Naissance',
  ILLNESS:        'Maladie',
  PROMOTION:      'Promotion',
};

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}

export default function ConfigPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: config, isLoading } = useConfig();
  const { data: rescueAmounts } = useRescueEventAmounts();
  const updateConfig = useUpdateConfig();
  const updateRescueAmount = useUpdateRescueEventAmount();

  const isSuperAdmin = currentUser?.role === BureauRole.SUPER_ADMIN;

  // Local state for inline editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<string>('');
  const [editingEventType, setEditingEventType] = useState<RescueEventType | null>(null);
  const [eventAmountValue, setEventAmountValue] = useState('');

  const startEdit = (field: string, current: string | number) => {
    setEditingField(field);
    setFieldValue(String(current));
  };

  const saveField = async () => {
    if (!editingField) return;
    const numFields = [
      'foundedYear', 'shareUnitAmount', 'halfShareAmount', 'potMonthlyAmount',
      'maxSharesPerMember', 'mandatoryInitialSavings', 'loanMonthlyRate',
      'minLoanAmount', 'maxLoanAmount', 'maxLoanMultiplier', 'minSavingsToLoan',
      'maxConcurrentLoans', 'rescueFundTarget', 'rescueFundMinBalance',
      'registrationFeeNew', 'registrationFeeReturning',
    ];
    const value = numFields.includes(editingField) ? parseFloat(fieldValue) : fieldValue;
    try {
      await updateConfig.mutateAsync({ [editingField]: value });
      setEditingField(null);
    } catch {
      // toast handled by hook onError
    }
  };

  const saveRescueAmount = async () => {
    if (!editingEventType) return;
    try {
      await updateRescueAmount.mutateAsync({ eventType: editingEventType, amount: parseFloat(eventAmountValue) });
      setEditingEventType(null);
    } catch {
      // toast handled by hook onError
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Chargement…</div>
    );
  }

  if (!config) return null;

  const Field = ({
    label,
    field,
    value,
    rawValue,
    numeric = false,
    tooltip,
  }: {
    label: string;
    field: string;
    value: string | number;
    rawValue?: string | number;
    numeric?: boolean;
    tooltip?: string;
  }) => (
    <div className="flex justify-between items-center py-2.5">
      <span className="flex items-center gap-1.5 text-sm text-gray-500">
        {label}
        {tooltip && <InfoTooltip content={tooltip} />}
      </span>
      {isSuperAdmin && editingField === field ? (
        <div className="flex items-center gap-2">
          <input
            type={numeric ? 'number' : 'text'}
            value={fieldValue}
            step={field === 'loanMonthlyRate' ? '0.001' : undefined}
            onChange={(e) => setFieldValue(e.target.value)}
            aria-label={`Modifier ${label}`}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <Button type="button" size="sm" onClick={saveField} isLoading={updateConfig.isPending}>OK</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditingField(null)}>✕</Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => startEdit(field, rawValue ?? value)}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
            >
              Modifier
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration CAYA"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Configuration' }]}
      />

      {!isSuperAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Lecture seule — seul le Super Admin peut modifier la configuration.
        </div>
      )}

      <Section title="Identité de la tontine" subtitle="Informations générales sur l'association.">
        <Field label="Nom"                field="name"               value={config.name}                  tooltip="Nom complet officiel de la tontine, tel qu'enregistré officiellement." />
        <Field label="Acronyme"           field="acronym"            value={config.acronym}               tooltip="Sigle ou abréviation du nom de l'association (ex : CAYA)." />
        <Field label="Année de fondation" field="foundedYear"        value={config.foundedYear} numeric   tooltip="Année de création de la tontine. Utilisée à titre informatif." />
        <Field label="Devise"             field="motto"              value={config.motto ?? ''}           tooltip="Slogan ou devise de l'association. Apparaît dans certains rapports." />
        <Field label="Ville siège"        field="headquartersCity"   value={config.headquartersCity ?? ''} tooltip="Ville où se tient habituellement l'assemblée générale." />
        <Field label="N° d'enregistrement" field="registrationNumber" value={config.registrationNumber ?? ''} tooltip="Numéro officiel d'enregistrement de l'association auprès des autorités." />
      </Section>

      <Section title="Parts et cotisations" subtitle="Définit la structure financière des participations des membres.">
        <Field label="Montant part complète (XAF)"      field="shareUnitAmount"    value={parseFloat(config.shareUnitAmount).toLocaleString('fr-FR')}    rawValue={parseFloat(config.shareUnitAmount)}    numeric tooltip="Montant d'une part entière. Chaque membre peut détenir jusqu'à N parts selon le maximum configuré." />
        <Field label="Montant demi-part (XAF)"          field="halfShareAmount"    value={parseFloat(config.halfShareAmount).toLocaleString('fr-FR')}    rawValue={parseFloat(config.halfShareAmount)}    numeric tooltip="Montant d'une demi-part. Option pour les membres qui ne peuvent pas prendre une part complète." />
        <Field label="Contribution pot mensuelle (XAF)" field="potMonthlyAmount"   value={parseFloat(config.potMonthlyAmount).toLocaleString('fr-FR')}   rawValue={parseFloat(config.potMonthlyAmount)}   numeric tooltip="Montant fixe versé chaque mois dans la cagnotte collective (le pot), en plus de l'épargne." />
        <Field label="Parts max / membre"               field="maxSharesPerMember" value={config.maxSharesPerMember}                                      numeric tooltip="Nombre maximum de parts qu'un seul membre peut détenir simultanément dans un exercice." />
      </Section>

      <Section title="Épargne" subtitle="Règles d'épargne obligatoire à l'entrée dans un exercice.">
        <Field label="Épargne initiale obligatoire (XAF)" field="mandatoryInitialSavings" value={parseFloat(config.mandatoryInitialSavings).toLocaleString('fr-FR')} rawValue={parseFloat(config.mandatoryInitialSavings)} numeric tooltip="Montant minimum qu'un membre doit épargner pour être éligible à un prêt lors d'un exercice. Versé en début d'exercice ou rattrapage." />
      </Section>

      <Section title="Prêts" subtitle="Conditions d'octroi et de remboursement des prêts.">
        <Field label="Taux mensuel"                   field="loanMonthlyRate"    value={`${(parseFloat(config.loanMonthlyRate) * 100).toFixed(1)} %`}  rawValue={parseFloat(config.loanMonthlyRate)}    numeric tooltip="Taux d'intérêt appliqué mensuellement sur le capital restant dû. Saisir en décimal : 0.04 = 4 %/mois." />
        <Field label="Montant min (XAF)"              field="minLoanAmount"      value={parseFloat(config.minLoanAmount).toLocaleString('fr-FR')}      rawValue={parseFloat(config.minLoanAmount)}      numeric tooltip="Montant minimum en dessous duquel une demande de prêt est refusée." />
        <Field label="Montant max (XAF)"              field="maxLoanAmount"      value={parseFloat(config.maxLoanAmount).toLocaleString('fr-FR')}      rawValue={parseFloat(config.maxLoanAmount)}      numeric tooltip="Montant maximum qu'un membre peut emprunter en une seule demande." />
        <Field label="Multiplicateur max (épargne×N)" field="maxLoanMultiplier"  value={config.maxLoanMultiplier}                                       numeric tooltip="Le prêt ne peut pas dépasser N fois l'épargne du membre. Ex : épargne 100 000 × 5 = prêt max 500 000." />
        <Field label="Épargne min pour prêt (XAF)"   field="minSavingsToLoan"   value={parseFloat(config.minSavingsToLoan).toLocaleString('fr-FR')}   rawValue={parseFloat(config.minSavingsToLoan)}   numeric tooltip="Épargne cumulée minimale qu'un membre doit avoir avant de pouvoir faire une demande de prêt." />
        <Field label="Prêts simultanés max"           field="maxConcurrentLoans" value={config.maxConcurrentLoans}                                      numeric tooltip="Nombre maximum de prêts actifs (non remboursés) qu'un membre peut avoir en même temps." />
      </Section>

      <Section title="Caisse de secours" subtitle="Paramètres du fonds d'aide aux membres en difficulté.">
        <Field label="Cible / membre (XAF)"         field="rescueFundTarget"     value={parseFloat(config.rescueFundTarget).toLocaleString('fr-FR')}     rawValue={parseFloat(config.rescueFundTarget)}     numeric tooltip="Objectif de contribution à la caisse de secours par membre. Indicateur de bonne santé du fonds." />
        <Field label="Solde minimum / membre (XAF)" field="rescueFundMinBalance" value={parseFloat(config.rescueFundMinBalance).toLocaleString('fr-FR')} rawValue={parseFloat(config.rescueFundMinBalance)} numeric tooltip="Seuil d'alerte : si le solde moyen par membre descend en dessous de ce montant, le fonds est considéré en danger." />
      </Section>

      <Section title="Frais d'inscription" subtitle="Frais uniques prélevés lors de l'inscription à un exercice.">
        <Field label="Nouveaux membres (XAF)"   field="registrationFeeNew"       value={parseFloat(config.registrationFeeNew).toLocaleString('fr-FR')}       rawValue={parseFloat(config.registrationFeeNew)}       numeric tooltip="Frais d'inscription appliqués aux membres qui rejoignent la tontine pour la première fois." />
        <Field label="Membres revenant (XAF)"   field="registrationFeeReturning" value={parseFloat(config.registrationFeeReturning).toLocaleString('fr-FR')} rawValue={parseFloat(config.registrationFeeReturning)} numeric tooltip="Frais réduits pour les anciens membres qui reprennent leur participation après une absence." />
      </Section>

      {/* Montants événements secours */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Montants des événements secours</h2>
            <p className="text-xs text-gray-400 mt-0.5">Aide versée automatiquement lors des événements de vie déclarés par un membre.</p>
          </div>
        </div>
        {rescueAmounts && rescueAmounts.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Événement</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">
                  <span className="flex items-center justify-end gap-1.5">
                    Montant (XAF)
                    <InfoTooltip content="Montant versé depuis la caisse de secours au membre concerné lors de chaque type d'événement déclaré." position="left" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rescueAmounts.map((evt) => (
                <tr key={evt.eventType} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-800">{EVENT_TYPE_LABELS[evt.eventType]}</td>
                  <td className="px-6 py-3 text-right">
                    {editingEventType === evt.eventType ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          value={eventAmountValue}
                          onChange={(e) => setEventAmountValue(e.target.value)}
                          aria-label={`Montant ${EVENT_TYPE_LABELS[evt.eventType]}`}
                          className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <Button type="button" size="sm" onClick={saveRescueAmount} isLoading={updateRescueAmount.isPending}>OK</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditingEventType(null)}>✕</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        <span className="tabular-nums font-semibold">
                          {parseFloat(evt.amount).toLocaleString('fr-FR')}
                        </span>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => { setEditingEventType(evt.eventType); setEventAmountValue(evt.amount); }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            Aucun montant configuré.
          </div>
        )}
      </div>
    </div>
  );
}
