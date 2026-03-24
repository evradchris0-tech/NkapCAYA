'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';
import { useRecordEntry } from '@lib/hooks/useSessions';
import { TransactionType, TRANSACTION_TYPE_LABELS } from '@/types/domain.types';
import type { Membership } from '@/types/api.types';

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
  onSuccess?: () => void;
}

export default function TransactionForm({ sessionId, memberships, onSuccess }: TransactionFormProps) {
  const recordEntry = useRecordEntry(sessionId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedType = watch('type');
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
      setSubmitError('Erreur lors de l\'enregistrement de la transaction.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Membre */}
      <div className="flex flex-col gap-1">
        <label htmlFor="membership-select" className="text-sm font-medium text-gray-700">
          Membre
        </label>
        <select
          id="membership-select"
          {...register('membershipId')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sélectionner un membre…</option>
          {memberships.map((m) => (
            <option key={m.id} value={m.id}>
              {m.profile?.lastName} {m.profile?.firstName} — {m.profile?.memberCode}
            </option>
          ))}
        </select>
        {errors.membershipId && (
          <p className="text-xs text-red-500">{errors.membershipId.message}</p>
        )}
      </div>

      {/* Type de transaction */}
      <div className="flex flex-col gap-1">
        <label htmlFor="type-select" className="text-sm font-medium text-gray-700">
          Type de transaction
        </label>
        <select
          id="type-select"
          {...register('type')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sélectionner un type…</option>
          {Object.values(TransactionType).map((t) => (
            <option key={t} value={t}>
              {TRANSACTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="text-xs text-red-500">{errors.type.message}</p>
        )}
      </div>

      {/* Montant */}
      <Input
        label="Montant (XAF)"
        type="number"
        placeholder="100000"
        {...register('amount')}
        error={errors.amount?.message}
      />

      {/* Loan ID — seulement pour remboursements */}
      {needsLoanId && (
        <Input
          label="ID du prêt (requis pour remboursement)"
          placeholder="uuid du prêt"
          {...register('loanId')}
          error={errors.loanId?.message}
        />
      )}

      <Input
        label="Notes (optionnel)"
        placeholder="Commentaire libre"
        {...register('notes')}
      />

      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{submitError}</p>
      )}

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Enregistrer la transaction
      </Button>
    </form>
  );
}
