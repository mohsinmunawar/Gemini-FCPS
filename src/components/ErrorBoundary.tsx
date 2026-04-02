import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, ShieldAlert } from 'lucide-react';
import { FirestoreErrorInfo } from '../types';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  firestoreError?: FirestoreErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    let firestoreError: FirestoreErrorInfo | undefined;
    try {
      if (error.message.startsWith('{') && error.message.includes('operationType')) {
        firestoreError = JSON.parse(error.message);
      }
    } catch (e) {
      // Not a JSON error
    }
    return { hasError: true, error, firestoreError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isPermissionError = this.state.firestoreError?.error.toLowerCase().includes('permission') || 
                               this.state.error?.message.toLowerCase().includes('permission');

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
            <div className="w-20 h-20 bg-danger/10 text-danger rounded-3xl flex items-center justify-center mx-auto mb-8">
              {isPermissionError ? <ShieldAlert className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-4">
              {isPermissionError ? 'Access Denied' : 'Something went wrong'}
            </h1>
            <p className="text-slate-500 mb-10 leading-relaxed">
              {isPermissionError 
                ? "You don't have permission to perform this action. Please check your account status or contact support."
                : "We encountered an unexpected error. Our team has been notified."}
            </p>
            
            {this.state.firestoreError && (
              <div className="mb-8 p-4 bg-slate-50 rounded-xl text-left">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Error Details</p>
                <p className="text-sm text-slate-600 mb-1"><strong>Operation:</strong> {this.state.firestoreError.operationType}</p>
                <p className="text-sm text-slate-600"><strong>Path:</strong> {this.state.firestoreError.path}</p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              <RefreshCcw className="w-5 h-5" /> Reload Application
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && !this.state.firestoreError && (
              <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-slate-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
