import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let isQuota = this.state.errorMessage.toLowerCase().includes('quota') || this.state.errorMessage.toLowerCase().includes('resource-exhausted');
      
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertOctagon size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900">
              {isQuota ? "Kikomo cha Firestore Kimefikiwa" : "Hitilafu Imegundulika"}
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              {isQuota ? (
                "Hifadhidata ya Firestore imefikia kikomo cha maswali ya kusoma cha siku (daily free read quota). Mfumo utawekwa upya kiotomatiki, au unaweza kuboresha hifadhidata yako kwenye Firebase Console."
              ) : (
                "Kuna hitilafu ndogo iliyotokea wakati wa kupakia ukurasa. Bonyeza kitufe hapa chini ili kujaribu tena."
              )}
            </p>

            <div className="pt-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Pakia Upya Ukurasa (Jaribu Tena)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
