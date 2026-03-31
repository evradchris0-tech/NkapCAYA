import { z } from 'zod';

export const loanSchema = z.object({
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

export type LoanFormValues = z.infer<typeof loanSchema>;
