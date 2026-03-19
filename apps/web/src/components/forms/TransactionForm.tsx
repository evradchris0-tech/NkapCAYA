'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';

const transactionSchema = z.object({
  memberId: z.string().min(1, 'Membre requis'),
  type: z.enum(['EPARGNE', 'TONTINE', 'INTERET', 'SECOURS', 'PRET_REMBOURSEMENT']),
  amount: z.coerce.number().positive('Montant positif requis'),
  note: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess?: () => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({ resolver: zodResolver(transactionSchema) });

  const onSubmit = async (_data: TransactionFormValues) => {
    // TODO: appel API sessions.api.ts
    reset();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="ID Membre"
        placeholder="uuid du membre"
        {...register('memberId')}
        error={errors.memberId?.message}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Type</label>
        <select
          {...register('type')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="EPARGNE">Épargne</option>
          <option value="TONTINE">Tontine</option>
          <option value="INTERET">Intérêt</option>
          <option value="SECOURS">Caisse de secours</option>
          <option value="PRET_REMBOURSEMENT">Remboursement prêt</option>
        </select>
        {errors.type && (
          <p className="text-xs text-red-500">{errors.type.message}</p>
        )}
      </div>

      <Input
        label="Montant (XAF)"
        type="number"
        placeholder="5000"
        {...register('amount')}
        error={errors.amount?.message}
      />

      <Input
        label="Note (optionnel)"
        placeholder="Commentaire libre"
        {...register('note')}
      />

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Enregistrer la transaction
      </Button>
    </form>
  );
}
