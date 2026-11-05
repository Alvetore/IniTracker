import React, { ErrorInfo, ReactNode } from 'react';
import { Storage } from '../../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Last-resort recovery screen. Without it a malformed imported backup can
 * unmount the whole tree and leave the user with a blank page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled application error:', error, info);
  }

  private handleReset = () => {
    if (!window.confirm('Сбросить все локальные данные к демонстрационным и перезагрузить страницу?')) {
      return;
    }
    Storage.resetToDefaults();
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-red-900/60 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div>
            <h1 className="text-lg font-bold text-white">Приложение столкнулось с ошибкой</h1>
            <p className="text-sm text-slate-400 mt-1">
              Скорее всего, повреждён импортированный файл или локальные данные. Можно перезагрузить
              страницу или сбросить базу к демонстрационным данным.
            </p>
          </div>

          {this.state.error?.message && (
            <pre className="text-xs text-red-300 bg-slate-950 border border-slate-800 rounded-xl p-3 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition"
            >
              Перезагрузить
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              className="flex-1 px-4 py-2.5 bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-800 rounded-xl text-sm font-semibold transition"
            >
              Сбросить данные
            </button>
          </div>
        </div>
      </div>
    );
  }
}
