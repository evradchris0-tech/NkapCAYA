'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';

const loanSchema = z.object({
  memberId: z.string().min(1, 'Membre requis'),
  amount: z.coerce.number().positive('Montant positif requis'),
  interestRate: z.coerce
    .number()
    .min(0)
    .max(100, 'Taux entre 0 et 100'),
  durationMonths: z.coerce.number().int().positive('Durée en mois requise'),
  startDate: z.string().min(1, 'Date de début requise'),
  purpose: z.string().optional(),
});

type LoanFormValues = z.infer<typeof loanSchema>;

interface LoanFormProps {
  onSuccess?: () => void;
}

export default function LoanForm({ onSuccess }: LoanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoanFormValues>({ resolver: zodResolver(loanSchema) });

  const onSubmit = async (_data: LoanFormValues) => {
    // TODO: appel loans.api.ts
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

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Montant (XAF)"
          type="number"
          placeholder="100000"
          {...register('amount')}
          error={errors.amount?.message}
        />
        <Input
          label="Taux d'intérêt (%)"
          type="number"
          step="0.1"
          placeholder="5"
          {...register('interestRate')}
          error={errors.interestRate?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Durée (mois)"
          type="number"
          placeholder="12"
          {...register('durationMonths')}
          error={errors.durationMonths?.message}
        />
        <Input
          label="Date de début"
          type="date"
          {...register('startDate')}
          error={errors.startDate?.message}
        />
      </div>

      <Input
        label="Objet du prêt (optionnel)"
        placeholder="Achat matériel…"
        {...register('purpose')}
      />

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Créer le prêt
      </Button>
    </form>
  );
}
