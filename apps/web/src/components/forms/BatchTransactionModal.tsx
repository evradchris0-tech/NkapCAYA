'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from '@components/ui/Modal';
import Button from '@components/ui/Button';
import Select from '@components/ui/Select';
import { useRecordEntry } from '@lib/hooks/useSessions';
import { useLoansByMembership } from '@lib/hooks/useLoans';
import { TransactionType, TRANSACTION_TYPE_LABELS, LoanStatus } from '@/types/domain.types';
import type { Membership, SessionEntry, FiscalYearConfig } from '@/types/api.types';

interface BatchRow {
  type: TransactionType;
  enabled: boolean;
  amount: string;
  loanId?: string;
  locked: boolean; // montant calculé automatiquement
}

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  memberships: Membership[];
  config?: FiscalYearConfig;
  entries?: SessionEntry[];
}

const ALL_TYPES: TransactionType[] = [
  TransactionType.COTISATION,
  TransactionType.INSCRIPTION,
  TransactionType.SECOURS,
  TransactionType.POT,
  TransactionType.EPARGNE,
  TransactionType.RBT_PRINCIPAL,
  TransactionType.RBT_INTEREST,
  TransactionType.PROJET,
  TransactionType.AUTRES,
];

const REPEATABLE = new Set([TransactionType.RBT_PRINCIPAL, TransactionType.RBT_INTEREST]);

function computeLocked(
  type: TransactionType,
  membership: Membership | undefined,
  config: FiscalYearConfig | undefined,
): { amount: string; locked: boolean } {
  if (!config || !membership) return { amount: '', locked: false };
  if (type === TransactionType.INSCRIPTION) {
    const fee =
      membership.enrollmentType === 'RETURNING'
        ? config.registrationFeeReturning
        : config.registrationFeeNew;
    const n = parseFloat(fee || '0');
    return { amount: n > 0 ? String(n) : '', locked: n > 0 };
  }
  if (type === TransactionType.COTISATION && membership.shareCommitment) {
    const shares = parseFloat(membership.shareCommitment.sharesCount || '0');
    const unit = parseFloat(config.shareUnitAmount || '0');
    const n = shares * unit;
    return { amount: n > 0 ? String(n) : '', locked: n > 0 };
  }
  if (type === TransactionType.SECOURS) {
    const n = parseFloat(config.rescueFundMinBalance || '0');
    return { amount: n > 0 ? String(n) : '', locked: n > 0 };
  }
  return { amount: '', locked: false };
}

export default function BatchTransactionModal({
  open,
  onClose,
  sessionId,
  memberships,
  config,
  entries = [],
}: Props) {
  const [membershipId, setMembershipId] = useState('');
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordEntry = useRecordEntry(sessionId);

  const { data: memberLoans } = useLoansByMembership(membershipId);
  const activeLoans = useMemo(
    () =>
      (memberLoans ?? []).filter(
        (l) => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.PARTIALLY_REPAID,
      ),
    [memberLoans],
  );

  const selectedMembership = useMemo(
    () => memberships.find((m) => m.id === membershipId),
    [memberships, membershipId],
  );

  // Types déjà enregistrés (non répétables)
  const usedTypes = useMemo(
    () =>
      new Set(
        entries
          .filter((e) => e.membershipId === membershipId && !REPEATABLE.has(e.type as TransactionType))
          .map((e) => e.type as TransactionType),
      ),
    [entries, membershipId],
  );

  // Recalcul des lignes quand le membre change
  useEffect(() => {
    if (!membershipId) { setRows([]); return; }
    const newRows: BatchRow[] = ALL_TYPES.map((type) => {
      const { amount, locked } = computeLocked(type, selectedMembership, config);
      const alreadyDone = usedTypes.has(type);
      return {
        type,
        enabled: !alreadyDone && locked, // pré-cocher les types calculés automatiquement
        amount,
        locked,
        loanId: undefined,
      };
    });
    setRows(newRows);
    setError(null);
  }, [membershipId, selectedMembership, config, usedTypes]);

  const toggleRow = (idx: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, enabled: !r.enabled } : r)),
    );
  };

  const setAmount = (idx: number, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, amount: value } : r)),
    );
  };

  const setLoan = (idx: number, loanId: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, loanId } : r)),
    );
  };

  const handleSubmit = async () => {
    const toSend = rows.filter((r) => r.enabled && r.amount && parseFloat(r.amount) > 0);
    if (toSend.length === 0) {
      setError('Cochez au moins une ligne avec un montant valide.');
      return;
    }
    const rbtRows = toSend.filter(
      (r) => r.type === TransactionType.RBT_PRINCIPAL || r.type === TransactionType.RBT_INTEREST,
    );
    if (rbtRows.some((r) => !r.loanId)) {
      setError('Sélectionner un prêt pour chaque ligne de remboursement.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      for (const row of toSend) {
        await recordEntry.mutateAsync({
          membershipId,
          type: row.type,
          amount: parseFloat(row.amount),
          loanId: row.loanId || undefined,
        });
      }
      onClose();
      setMembershipId('');
    } catch {
      setError("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setMembershipId('');
    setRows([]);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Saisie rapide — transactions du membre"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={!membershipId || rows.filter((r) => r.enabled).length === 0}
          >
            Valider tout
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Sélection du membre */}
        <Select
          id="batch-member"
          label="Membre"
          value={membershipId}
          onChange={(e) => setMembershipId(e.target.value)}
        >
          <option value="">Sélectionner un membre…</option>
          {memberships.map((m) => (
            <option key={m.id} value={m.id}>
              {m.profile?.lastName} {m.profile?.firstName} — {m.profile?.memberCode}
            </option>
          ))}
        </Select>

        {/* Grille des types */}
        {membershipId && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-3 font-medium text-gray-500 w-6"></th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Montant (XAF)</th>
                  <th className="text-left py-2 font-medium text-gray-600">Prêt associé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, idx) => {
                  const alreadyDone = usedTypes.has(row.type);
                  const needsLoan =
                    row.type === TransactionType.RBT_PRINCIPAL ||
                    row.type === TransactionType.RBT_INTEREST;
                  const noLoans = needsLoan && activeLoans.length === 0;

                  return (
                    <tr
                      key={row.type}
                      className={`transition-colors ${alreadyDone ? 'opacity-40' : row.enabled ? 'bg-blue-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pr-3">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={() => toggleRow(idx)}
                          disabled={alreadyDone || noLoans}
                          className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                        />
                      </td>

                      {/* Label */}
                      <td className="py-2.5 pr-4">
                        <span className="text-gray-700 font-medium">
                          {TRANSACTION_TYPE_LABELS[row.type]}
                        </span>
                        {alreadyDone && (
                          <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            déjà enregistré
                          </span>
                        )}
                        {noLoans && (
                          <span className="ml-2 text-[10px] text-gray-400">aucun prêt actif</span>
                        )}
                      </td>

                      {/* Montant */}
                      <td className="py-2.5 pr-4">
                        <input
                          type="number"
                          min="1"
                          placeholder="0"
                          value={row.amount}
                          onChange={(e) => setAmount(idx, e.target.value)}
                          disabled={!row.enabled || row.locked}
                          className="w-32 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                        />
                        {row.locked && (
                          <span className="ml-1.5 text-[10px] text-gray-400">calculé</span>
                        )}
                      </td>

                      {/* Prêt */}
                      <td className="py-2.5">
                        {needsLoan && row.enabled ? (
                          <select
                            value={row.loanId ?? ''}
                            onChange={(e) => setLoan(idx, e.target.value)}
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                          >
                            <option value="">Sélectionner…</option>
                            {activeLoans.map((l) => (
                              <option key={l.id} value={l.id}>
                                {parseFloat(l.outstandingBalance).toLocaleString('fr-FR')} XAF restants
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {membershipId && rows.filter((r) => r.enabled).length > 0 && (
          <p className="text-xs text-gray-400">
            {rows.filter((r) => r.enabled).length} ligne{rows.filter((r) => r.enabled).length > 1 ? 's' : ''} à enregistrer
          </p>
        )}
      </div>
    </Modal>
  );
}
