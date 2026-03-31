import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:3000/api/v1';

export const loan = (override: Record<string, unknown> = {}) => ({
  id: 'loan-1',
  membershipId: 'mem-1',
  fiscalYearId: 'fy-1',
  status: 'ACTIVE',
  outstandingBalance: '150000',
  totalRepaid: '50000',
  monthlyRate: '0.04',
  dueBeforeDate: '2025-12-31',
  ...override,
});

export const handlers = [
  http.get(`${BASE}/loans`, ({ request }) => {
    const url = new URL(request.url);
    const membershipId = url.searchParams.get('membershipId');
    const fiscalYearId = url.searchParams.get('fiscalYearId');
    if (membershipId === 'no-loans' || fiscalYearId === 'no-loans') {
      return HttpResponse.json([]);
    }
    return HttpResponse.json([loan()]);
  }),

  http.get(`${BASE}/loans/:id`, ({ params }) => {
    if (params.id === 'not-found') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(loan({ id: params.id as string }));
  }),

  http.post(`${BASE}/loans/request`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(loan({ membershipId: body.membershipId }), { status: 201 });
  }),

  http.patch(`${BASE}/loans/:id/approve`, ({ params }) => {
    return HttpResponse.json(loan({ id: params.id as string, status: 'ACTIVE' }));
  }),

  http.post(`${BASE}/loans/:id/repay`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: 'rep-1',
      loanId: params.id,
      amount: body.amount,
      paidAt: new Date().toISOString(),
    });
  }),
];
