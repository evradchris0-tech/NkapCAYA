import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createElement } from 'react';
import { handlers, loan } from '@/test/handlers';
import {
  useLoansByMembership,
  useFiscalYearLoans,
  useLoan,
  useRequestLoan,
  useApproveLoan,
} from '../useLoans';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  }
  return Wrapper;
}

describe('useLoans hooks', () => {
  it('H01 — useLoansByMembership retourne la liste', async () => {
    const { result } = renderHook(() => useLoansByMembership('mem-1'), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].id).toBe('loan-1');
  });

  it('H02 — useLoansByMembership retourne [] si aucun prêt', async () => {
    const { result } = renderHook(() => useLoansByMembership('no-loans'), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });

  it('H03 — useFiscalYearLoans retourne la liste', async () => {
    const { result } = renderHook(() => useFiscalYearLoans('fy-1'), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('H04 — useLoan retourne un prêt par id', async () => {
    const { result } = renderHook(() => useLoan('loan-42'), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('loan-42');
  });

  it('H05 — useLoan passe en erreur si 404', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/loans/:id', ({ params }) => {
        if (params.id === 'not-found') {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        }
        return HttpResponse.json(loan({ id: params.id as string }));
      }),
    );
    const { result } = renderHook(() => useLoan('not-found'), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('H06 — useRequestLoan.mutateAsync renvoie le prêt créé', async () => {
    const { result } = renderHook(() => useRequestLoan(), {
      wrapper: wrapper(),
    });
    const created = await result.current.mutateAsync({
      membershipId: 'mem-2',
      amount: 200000,
      dueBeforeDate: '2026-01-01',
    });
    expect(created.membershipId).toBe('mem-2');
  });
});
