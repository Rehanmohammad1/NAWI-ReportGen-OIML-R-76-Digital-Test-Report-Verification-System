import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error in Component Tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const sectionTitle = this.props.title || 'OIML Regulatory Module';
      return (
        <div className="max-w-4xl mx-auto my-8 p-6 bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm font-sans text-[#413B32] shadow-sm">
          <div className="flex items-center space-x-3 pb-3 border-b border-[#D9D1C5]">
            <div className="w-10 h-10 rounded-xs bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono uppercase tracking-tight text-[#413B32]">
                {sectionTitle} — Runtime Error Encountered
              </h2>
              <p className="text-xs font-mono text-[#413B32]/70">
                The requested application view encountered an unexpected rendering condition.
              </p>
            </div>
          </div>

          <div className="py-4 space-y-3 font-mono text-xs text-[#413B32]/80">
            <p className="bg-[#F1EADE]/40 border border-[#D9D1C5] p-3 rounded-xs">
              <strong>Status:</strong> Component Execution Interrupted. Application security and data integrity remain protected.
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-3 border-t border-[#D9D1C5] font-mono text-xs">
            <button
              onClick={this.handleReset}
              className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] px-3.5 py-1.5 rounded-xs transition inline-flex items-center space-x-1.5 font-bold border border-[#413B32]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Module</span>
            </button>

            <a
              href="/"
              className="bg-[#FFFFFF] hover:bg-[#F1EADE] text-[#413B32] px-3.5 py-1.5 rounded-xs transition inline-flex items-center space-x-1.5 font-semibold border border-[#D9D1C5]"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
