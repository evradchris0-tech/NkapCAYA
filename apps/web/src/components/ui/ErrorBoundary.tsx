'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Message affiché à l'utilisateur. Par défaut générique. */
  message?: string;
  /** Si true, affiche un bloc compact (pour les sections dans une page) */
  inline?: boolean;
  /** Callback optionnel appelé lors du crash */
  onError?: (error: Error, info: { componentStack: string }) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    this.props.onError?.(error, info);
    // En production, on pourrait envoyer vers Sentry/LogRocket ici
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message =
      this.props.message ?? 'Une erreur est survenue dans cette section.';

    if (this.props.inline) {
      return (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{message}</p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            Réessayer
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8">
        <div className="p-3 bg-red-100 rounded-2xl">
          <AlertTriangle className="h-7 w-7 text-red-500" strokeWidth={1.8} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-gray-800">{message}</p>
          <p className="text-sm text-gray-400">
            {this.state.error?.message ?? 'Erreur inattendue'}
          </p>
        </div>
        <button
          onClick={this.handleRetry}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    );
  }
}

/**
 * Wrapper léger pour entourer une section de page.
 * Usage : <SectionBoundary><MonComposant /></SectionBoundary>
 */
export function SectionBoundary({
  children,
  message,
}: {
  children: ReactNode;
  message?: string;
}) {
  return (
    <ErrorBoundary inline message={message}>
      {children}
    </ErrorBoundary>
  );
}
