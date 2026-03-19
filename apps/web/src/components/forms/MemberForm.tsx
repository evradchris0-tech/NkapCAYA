'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';

const memberSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  phone: z.string().min(9, 'Téléphone invalide'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  joinDate: z.string().min(1, 'Date d\'adhésion requise'),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface MemberFormProps {
  defaultValues?: Partial<MemberFormValues>;
  onSuccess?: () => void;
}

export default function MemberForm({ defaultValues, onSuccess }: MemberFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues,
  });

  const onSubmit = async (_data: MemberFormValues) => {
    // TODO: appel members.api.ts
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Prénom"
          placeholder="Jean"
          {...register('firstName')}
          error={errors.firstName?.message}
        />
        <Input
          label="Nom"
          placeholder="Dupont"
          {...register('lastName')}
          error={errors.lastName?.message}
        />
      </div>

      <Input
        label="Téléphone"
        type="tel"
        placeholder="+237 6XX XXX XXX"
        {...register('phone')}
        error={errors.phone?.message}
      />

      <Input
        label="Email (optionnel)"
        type="email"
        placeholder="jean@exemple.com"
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Date d'adhésion"
        type="date"
        {...register('joinDate')}
        error={errors.joinDate?.message}
      />

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Enregistrer le membre
      </Button>
    </form>
  );
}
