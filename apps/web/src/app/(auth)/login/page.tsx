'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@lib/hooks/useAuth';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Identifiant requis (username ou téléphone)'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md p-10 bg-background rounded-lg shadow-elevated border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            CAYA
          </h1>
          <p className="text-muted-foreground font-medium">
            Accédez à votre espace tontine
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Identifiant"
            {...register('identifier')}
            type="text"
            placeholder="Username ou numéro de téléphone"
            error={errors.identifier?.message}
          />

          <Input
            label="Mot de passe"
            {...register('password')}
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
          />

          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </main>
  );
}
