'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@components/ui/Input';
import Select from '@components/ui/Select';
import Button from '@components/ui/Button';
import { clsx } from 'clsx';
import { useRecordEntry } from '@lib/hooks/useSessions';
import { useLoansByMembership } from '@lib/hooks/useLoans';
import { TransactionType, TRANSACTION_TYPE_LABELS, LoanStatus } from '@/types/domain.types';
import type { Membership, SessionEntry, FiscalYearConfig } from '@/types/api.types';

// Types pouvant apparaître plusieurs fois par membre par session
const REPEATABLE_TYPES = new Set([TransactionType.RBT_PRINCIPAL, TransactionType.RBT_INTEREST]);

// Types dont le montant est verrouillé (calculé depuis la config)
const LOCKED_AMOUNT_TYPES = new Set([
  TransactionType.INSCRIPTION,
  TransactionType.COTISATION,
  TransactionType.SECOURS,
]);

const schema = z.object({
  membershipId: z.string().min(1, 'Membre requis'),
  type: z.nativeEnum(TransactionType),
  amount: z.coerce.number().positive('Montant positif requis'),
  loanId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TransactionFormProps {
  sessionId: string;
  memberships: Membership[];
  config?: FiscalYearConfig;
  existingEntries?: SessionEntry[];
  onSuccess?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function TransactionForm({
  sessionId,
  memberships,
  config,
  existingEntries = [],
  onSuccess,
  onDirtyChange,
}: TransactionFormProps) {
  const recordEntry = useRecordEntry(sessionId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedMembershipId = watch('membershipId');
  const selectedType = watch('type');

  // Notifier le parent dès qu'un membre est sélectionné (pour confirmation fermeture)
  useEffect(() => {
    onDirtyChange?.(Boolean(selectedMembershipId));
  }, [selectedMembershipId, onDirtyChange]);

  // Prêts actifs du membre sélectionné
  const { data: memberLoans, isLoading: loansLoading } = useLoansByMembership(
    selectedMembershipId ?? '',
  );
  const activeLoans = (memberLoans ?? []).filter(
    (l) => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.PARTIALLY_REPAID,
  );

  // Types déjà utilisés par ce membre dans cette session (non répétables)
  const usedTypes = new Set(
    existingEntries
      .filter((e) => e.membershipId === selectedMembershipId)
      .filter((e) => !REPEATABLE_TYPES.has(e.type as TransactionType))
      .map((e) => e.type as TransactionType),
  );

  // Types disponibles dans le dropdown
  const availableTypes = Object.values(TransactionType).filter((t) => {
    if (usedTypes.has(t)) return false;
    if (
      (t === TransactionType.RBT_PRINCIPAL || t === TransactionType.RBT_INTEREST) &&
      activeLoans.length === 0 &&
      !loansLoading
    )
      return false;
    return true;
  });

  // Membership sélectionné
  const selectedMembership = memberships.find((m) => m.id === selectedMembershipId);

  // Réinitialiser le type et le montant au changement de membre
  useEffect(() => {
    if (selectedMembershipId) {
      setValue('type', '' as TransactionType, { shouldValidate: false });
      setValue('amount', 0 as unknown as number, { shouldValidate: false });
      setValue('loanId', undefined, { shouldValidate: false });
    }
  }, [selectedMembershipId, setValue]);

  // Auto-fill du montant selon le type sélectionné
  useEffect(() => {
    if (!selectedType || !config) return;

    let computed: number | null = null;

    if (selectedType === TransactionType.INSCRIPTION && selectedMembership) {
      const fee =
        selectedMembership.enrollmentType === 'RETURNING'
          ? config.registrationFeeReturning
          : config.registrationFeeNew;
      computed = parseFloat(fee || '0');
    } else if (selectedType === TransactionType.COTISATION && selectedMembership?.shareCommitment) {
      const shares = parseFloat(selectedMembership.shareCommitment.sharesCount || '0');
      const unit = parseFloat(config.shareUnitAmount || '0');
      computed = shares * unit;
    } else if (selectedType === TransactionType.SECOURS) {
      computed = parseFloat(config.rescueFundMinBalance || '0');
    }

    if (computed !== null && computed > 0) {
      setValue('amount', computed, { shouldValidate: false });
    }
  }, [selectedType, config, selectedMembership, setValue]);

  // Montant verrouillé uniquement si config disponible ET type à montant fixe
  const isAmountLocked = Boolean(config) && LOCKED_AMOUNT_TYPES.has(selectedType as TransactionType);
  const needsLoanId =
    selectedType === TransactionType.RBT_PRINCIPAL ||
    selectedType === TransactionType.RBT_INTEREST;

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      await recordEntry.mutateAsync({
        membershipId: data.membershipId,
        type: data.type,
        amount: data.amount,
        loanId: data.loanId || undefined,
        notes: data.notes || undefined,
      });
      reset();
      onSuccess?.();
    } catch {
      setSubmitError("Erreur lors de l'enregistrement de la transaction.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Membre */}
      <Select
        id="membership-select"
        label="Membre"
        {...register('membershipId')}
        value={watch('membershipId') ?? ''}
        error={errors.membershipId?.message}
      >
        <option value="">Sélectionner un membre…</option>
        {memberships.map((m) => (
          <option key={m.id} value={m.id}>
            {m.profile?.lastName} {m.profile?.firstName} — {m.profile?.memberCode}
          </option>
        ))}
      </Select>

      {/* Type de transaction */}
      <div>
        <Select
          id="type-select"
          label="Type de transaction"
          {...register('type')}
          value={watch('type') ?? ''}
          error={errors.type?.message}
          disabled={!selectedMembershipId}
        >
          <option value="">
            {!selectedMembershipId ? 'Sélectionner d\'abord un membre…' : 'Choisir un type…'}
          </option>
          {availableTypes.map((t) => (
            <option key={t} value={t}>
              {TRANSACTION_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
        {selectedMembershipId && (
          <>
            {loansLoading && (
              <p className="text-xs text-gray-400 mt-1 animate-pulse">Vérification des prêts…</p>
            )}
            {!loansLoading && usedTypes.size > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {usedTypes.size} type{usedTypes.size > 1 ? 's' : ''} déjà enregistré{usedTypes.size > 1 ? 's' : ''} pour ce membre
              </p>
            )}
          </>
        )}
      </div>

      {/* Montant (XAF) */}
      <Input
        label="Montant (XAF)"
        type="number"
        placeholder="0"
        {...register('amount')}
        disabled={!selectedType}
        readOnly={isAmountLocked}
        className={clsx(
          (isAmountLocked || !selectedType) && 'bg-gray-50 text-gray-500 cursor-not-allowed'
        )}
        helperText={isAmountLocked ? 'Montant fixé par la configuration' : undefined}
        error={errors.amount?.message}
      />

      {/* Sélection du prêt pour remboursements */}
      {needsLoanId && (
        <Select
          id="loan-select"
          label="Prêt concerné"
          {...register('loanId')}
          value={watch('loanId') ?? ''}
          error={errors.loanId?.message}
          disabled={activeLoans.length === 0}
        >
          <option value="">
            {activeLoans.length === 0 ? 'Aucun prêt actif trouvé' : 'Sélectionner un prêt…'}
          </option>
          {activeLoans.map((l) => (
            <option key={l.id} value={l.id}>
              {parseFloat(l.outstandingBalance).toLocaleString('fr-FR')} XAF restants
              {l.disbursedAt
                ? ` — ${new Date(l.disbursedAt).toLocaleDateString('fr-FR')}`
                : ''}
            </option>
          ))}
        </Select>
      )}

      {/* Notes et bouton */}
      <Input
        label="Notes (optionnel)"
        placeholder="Commentaire libre"
        {...register('notes')}
        disabled={!selectedType}
      />

      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{submitError}</p>
      )}

      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={!selectedType || !selectedMembershipId}
        className="w-full"
      >
        Enregistrer la transaction
      </Button>
    </form>
  );
}
