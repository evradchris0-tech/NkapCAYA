'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import { useConfig, useUpdateConfig, useRescueEventAmounts, useUpdateRescueEventAmount } from '@lib/hooks/useConfig';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { RescueEventType } from '@/types/api.types';

const EVENT_TYPE_LABELS: Record<RescueEventType, string> = {
  MEMBER_DEATH: 'Décès du membre',
  RELATIVE_DEATH: 'Décès d\'un proche',
  MARRIAGE: 'Mariage',
  BIRTH: 'Naissance',
  ILLNESS: 'Maladie',
  PROMOTION: 'Promotion',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => { if (saveSuccess) { const t = setTimeout(() => setSaveSuccess(false), 2000); return () => clearTimeout(t); } }, [saveSuccess]);

  const startEdit = (field: string, current: string | number) => {
    setEditingField(field);
    setFieldValue(String(current));
  };

  const saveField = async () => {
    if (!editingField) return;
    const numFields = ['foundedYear','shareUnitAmount','halfShareAmount','potMonthlyAmount','maxSharesPerMember',
      'mandatoryInitialSavings','loanMonthlyRate','minLoanAmount','maxLoanAmount','maxLoanMultiplier',
      'minSavingsToLoan','maxConcurrentLoans','rescueFundTarget','rescueFundMinBalance',
      'registrationFeeNew','registrationFeeReturning'];
    const value = numFields.includes(editingField) ? parseFloat(fieldValue) : fieldValue;
    await updateConfig.mutateAsync({ [editingField]: value });
    setEditingField(null);
    setSaveSuccess(true);
  };

  const saveRescueAmount = async () => {
    if (!editingEventType) return;
    await updateRescueAmount.mutateAsync({ eventType: editingEventType, amount: parseFloat(eventAmountValue) });
    setEditingEventType(null);
    setSaveSuccess(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Chargement…</div>
    );
  }

  if (!config) return null;

  const Field = ({ label, field, value, numeric = false }: { label: string; field: string; value: string | number; numeric?: boolean }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
      <span className="text-sm text-gray-500 sm:w-56 shrink-0">{label}</span>
      {isSuperAdmin && editingField === field ? (
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <input
            type={numeric ? 'number' : 'text'}
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            aria-label={`Modifier ${label}`}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <Button type="button" size="sm" onClick={saveField} isLoading={updateConfig.isPending}>OK</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditingField(null)}>✕</Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => startEdit(field, value)}
              className="text-xs text-blue-500 hover:text-blue-700 underline"
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

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
          Modification enregistrée.
        </div>
      )}

      <Section title="Identité de la tontine">
        <div className="space-y-3">
          <Field label="Nom" field="name" value={config.name} />
          <Field label="Acronyme" field="acronym" value={config.acronym} />
          <Field label="Année de fondation" field="foundedYear" value={config.foundedYear} numeric />
          <Field label="Devise" field="motto" value={config.motto ?? ''} />
          <Field label="Ville siège" field="headquartersCity" value={config.headquartersCity ?? ''} />
          <Field label="N° d'enregistrement" field="registrationNumber" value={config.registrationNumber ?? ''} />
        </div>
      </Section>

      <Section title="Parts et cotisations">
        <div className="space-y-3">
          <Field label="Montant part complète (XAF)" field="shareUnitAmount" value={parseFloat(config.shareUnitAmount).toLocaleString('fr-FR')} numeric />
          <Field label="Montant demi-part (XAF)" field="halfShareAmount" value={parseFloat(config.halfShareAmount).toLocaleString('fr-FR')} numeric />
          <Field label="Contribution pot mensuelle (XAF)" field="potMonthlyAmount" value={parseFloat(config.potMonthlyAmount).toLocaleString('fr-FR')} numeric />
          <Field label="Parts max / membre" field="maxSharesPerMember" value={config.maxSharesPerMember} numeric />
        </div>
      </Section>

      <Section title="Épargne">
        <div className="space-y-3">
          <Field label="Épargne initiale obligatoire (XAF)" field="mandatoryInitialSavings" value={parseFloat(config.mandatoryInitialSavings).toLocaleString('fr-FR')} numeric />
        </div>
      </Section>

      <Section title="Prêts">
        <div className="space-y-3">
          <Field label="Taux mensuel (%)" field="loanMonthlyRate" value={`${(parseFloat(config.loanMonthlyRate) * 100).toFixed(1)} %`} numeric />
          <Field label="Montant min (XAF)" field="minLoanAmount" value={parseFloat(config.minLoanAmount).toLocaleString('fr-FR')} numeric />
          <Field label="Montant max (XAF)" field="maxLoanAmount" value={parseFloat(config.maxLoanAmount).toLocaleString('fr-FR')} numeric />
          <Field label="Multiplicateur max (épargne × N)" field="maxLoanMultiplier" value={config.maxLoanMultiplier} numeric />
          <Field label="Épargne min pour prêt (XAF)" field="minSavingsToLoan" value={parseFloat(config.minSavingsToLoan).toLocaleString('fr-FR')} numeric />
          <Field label="Prêts simultanés max" field="maxConcurrentLoans" value={config.maxConcurrentLoans} numeric />
        </div>
      </Section>

      <Section title="Caisse de secours">
        <div className="space-y-3">
          <Field label="Cible / membre (XAF)" field="rescueFundTarget" value={parseFloat(config.rescueFundTarget).toLocaleString('fr-FR')} numeric />
          <Field label="Solde minimum / membre (XAF)" field="rescueFundMinBalance" value={parseFloat(config.rescueFundMinBalance).toLocaleString('fr-FR')} numeric />
        </div>
      </Section>

      <Section title="Frais d'inscription">
        <div className="space-y-3">
          <Field label="Nouveaux membres (XAF)" field="registrationFeeNew" value={parseFloat(config.registrationFeeNew).toLocaleString('fr-FR')} numeric />
          <Field label="Membres revenant (XAF)" field="registrationFeeReturning" value={parseFloat(config.registrationFeeReturning).toLocaleString('fr-FR')} numeric />
        </div>
      </Section>

      {/* Montants événements secours */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-800">Montants des événements secours</h2>
        </div>
        {rescueAmounts && rescueAmounts.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Événement</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Montant (XAF)</th>
                {isSuperAdmin && <th className="px-6 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rescueAmounts.map((evt) => (
                <tr key={evt.eventType} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-800">{EVENT_TYPE_LABELS[evt.eventType]}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-medium">
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
                      parseFloat(evt.amount).toLocaleString('fr-FR')
                    )}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-3 text-right">
                      {editingEventType !== evt.eventType && (
                        <button
                          type="button"
                          onClick={() => { setEditingEventType(evt.eventType); setEventAmountValue(evt.amount); }}
                          className="text-xs text-blue-500 hover:text-blue-700 underline"
                        >
                          Modifier
                        </button>
                      )}
                    </td>
                  )}
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
