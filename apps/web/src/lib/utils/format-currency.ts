/**
 * Formate un montant en Franc CFA (XAF).
 *
 * @example
 *   formatXAF(150000)  // → "150 000 FCFA"
 *   formatXAF(0)       // → "0 FCFA"
 */
export function formatXAF(
  amount: number,
  options: { compact?: boolean } = {}
): string {
  if (options.compact) {
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)} M FCFA`;
    }
    if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(0)} K FCFA`;
    }
  }

  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate un montant brut en string lisible sans symbole monétaire.
 *
 * @example
 *   formatNumber(1500000)  // → "1 500 000"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount);
}
