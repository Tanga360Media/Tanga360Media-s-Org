import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw, Database } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private isQuotaError(): boolean {
    const msg = this.state.error?.message || '';
    return (
      msg.includes('Quota limit exceeded') ||
      msg.includes('Quota exceeded') ||
      msg.includes('Free daily read units per project')
    );
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isQuota = this.isQuotaError();
      const upgradeUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;
      const pricingUrl = `https://firebase.google.com/pricing#cloud-firestore`;

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 text-center space-y-6">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              {isQuota ? <Database size={32} /> : <AlertTriangle size={32} />}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {isQuota
                  ? 'Kikomo cha Matumizi ya Siku Kimefikiwa'
                  : 'Hitilafu Imetokea'}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                {isQuota
                  ? 'Hifadhidata ya Firebase (Firestore Free Tier) imefikia kikomo chake cha bure cha usomaji wa data (Daily Read Quota) kwa siku ya leo. Kikomo hiki kitawekwa upya (reset) kiotomatiki siku inayofuata.'
                  : 'Kumetokea hitilafu ya muda wakati wa kupakia mfumo. Tafadhali jaribu kupakia ukurasa upya.'}
              </p>
            </div>

            {isQuota && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-left text-xs text-amber-900 space-y-3">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ExternalLink size={14} />
                  <span>Jinsi ya Kuendelea au Kuongeza Kiwango:</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-amber-900/90 pl-1">
                  <li>
                    <strong>Boresha Mpango (Upgrade):</strong> Unaweza kufungua akaunti ya Firebase na kuwasha mpango wa Blaze/Billing ili kuondoa vikomo vya bure.
                  </li>
                  <li>
                    <strong>Subiri Uwekaji Upya (Daily Reset):</strong> Kikomo huwekwa upya kiotomatiki baada ya masaa 24.
                  </li>
                </ul>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={upgradeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-center flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>Fungua Firebase Console</span>
                    <ExternalLink size={13} />
                  </a>
                  <a
                    href={pricingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-xl text-center transition-all"
                  >
                    Bei na Vikomo
                  </a>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                <span>Pakia Ukurasa Upya</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
