'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import { useCreateFiscalYear } from '@lib/hooks/useFiscalYear';

const schema = z
  .object({
    label: z.string().min(1, 'Libellé requis'),
    startDate: z.string().min(1, 'Date de début requise'),
    endDate: z.string().min(1, 'Date de fin requise'),
    cassationDate: z.string().min(1, 'Date de cassation requise'),
    loanDueDate: z.string().min(1, 'Date limite prêts requise'),
    notes: z.string().optional(),
  })
  .refine((d) => new Date(d.startDate) < new Date(d.loanDueDate), {
    message: 'La date limite prêts doit être après le début',
    path: ['loanDueDate'],
  })
  .refine((d) => new Date(d.loanDueDate) < new Date(d.cassationDate), {
    message: 'La cassation doit être après la date limite prêts',
    path: ['cassationDate'],
  })
  .refine((d) => new Date(d.cassationDate) <= new Date(d.endDate), {
    message: 'La cassation doit être avant ou égale à la date de fin',
    path: ['cassationDate'],
  });

type FormValues = z.infer<typeof schema>;

export default function NewFiscalYearPage() {
  const router = useRouter();
  const create = useCreateFiscalYear();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: '2025-2026',
      startDate: '2025-10-01',
      endDate: '2026-09-30',
      cassationDate: '2026-08-31',
      loanDueDate: '2026-06-30',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const fy = await create.mutateAsync(data);
      router.push(`/fiscal-year/${fy.id}`);
    } catch {
      setError('root', { message: 'Erreur lors de la création de l\'exercice.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Nouvel exercice fiscal"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Exercices fiscaux', href: '/fiscal-year' },
          { label: 'Nouveau' },
        ]}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Libellé (ex: 2025-2026)"
            placeholder="2025-2026"
            {...register('label')}
            error={errors.label?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              {...register('startDate')}
              error={errors.startDate?.message}
            />
            <Input
              label="Date de fin"
              type="date"
              {...register('endDate')}
              error={errors.endDate?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date limite remboursement prêts"
              type="date"
              {...register('loanDueDate')}
              error={errors.loanDueDate?.message}
            />
            <Input
              label="Date de cassation"
              type="date"
              {...register('cassationDate')}
              error={errors.cassationDate?.message}
            />
          </div>

          <div className="bg-blue-50 rounded-lg px-4 py-3 text-xs text-blue-700">
            Contrainte : Début &lt; Limite prêts &lt; Cassation ≤ Fin
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Notes (optionnel)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Remarques sur cet exercice..."
            />
          </div>

          {errors.root && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {errors.root.message}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Créer l&apos;exercice
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
