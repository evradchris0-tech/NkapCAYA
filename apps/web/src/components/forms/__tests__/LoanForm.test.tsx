import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoanForm from '../LoanForm';

describe('LoanForm', () => {
  it('C01 — rend les champs obligatoires', () => {
    render(<LoanForm />);
    expect(screen.getByLabelText(/ID Membre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Montant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Taux/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Durée/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date de début/i)).toBeInTheDocument();
  });

  it('C02 — affiche les erreurs de validation si soumis vide', async () => {
    render(<LoanForm />);
    fireEvent.submit(screen.getByRole('button', { name: /Créer le prêt/i }));
    await waitFor(() => {
      expect(screen.getByText('Membre requis')).toBeInTheDocument();
    });
  });

  it('C03 — appelle onSuccess après soumission valide', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<LoanForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/ID Membre/i), 'mem-1');
    await user.type(screen.getByLabelText(/Montant/i), '100000');
    await user.type(screen.getByLabelText(/Taux/i), '4');
    await user.type(screen.getByLabelText(/Durée/i), '12');
    await user.type(screen.getByLabelText(/Date de début/i), '2025-01-01');

    await user.click(screen.getByRole('button', { name: /Créer le prêt/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });

  it('C04 — bouton submit présent et activé par défaut', () => {
    render(<LoanForm />);
    const btn = screen.getByRole('button', { name: /Créer le prêt/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });
});
