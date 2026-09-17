import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw, X, Database } from 'lucide-react';

export function QuotaBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [quotaDetails, setQuotaDetails] = useState<string>('');

  useEffect(() => {
    const handleQuotaExceeded = (e: any) => {
      setShowBanner(true);
      if (e?.detail?.error) {
        setQuotaDetails(e.detail.error);
      }
    };

    window.addEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  if (!showBanner) return null;

  const firebaseConsoleUrl = "https://console.firebase.google.com/project/gen-lang-client-0324341529/firestore/databases/ai-studio-f06df87b-9246-404d-8ace-cc0ace49003b/usage";

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 sm:px-6 relative z-50 shadow-sm animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm text-amber-950">
                Kikomo cha Kusoma cha Kila Siku cha Firestore Kimefikiwa (Quota Exceeded)
              </span>
              <span className="bg-amber-200/80 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                Free Tier (50k Reads/Siku)
              </span>
            </div>
            <p className="text-xs text-amber-800/90 leading-relaxed max-w-3xl">
              Hifadhidata ya Firestore imefikia kikomo chake cha bure cha maswali (reads) kwa siku ya leo. Data za hivi karibuni zimehifadhiwa kwenye kumbukumbu ya kivinjari (offline cache). Kikomo hiki kitawekwa upya (reset) kiotomatiki na Google baada ya masaa 24, au msimamizi anaweza kuboresha hifadhidata kwenye Firebase Console.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <a
            href={firebaseConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            <Database size={14} />
            <span>Firebase Console</span>
            <ExternalLink size={12} />
          </a>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-2 rounded-xl transition-all"
            title="Pakia Upya Ukurasa"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Pakia Upya</span>
          </button>

          <button
            onClick={() => setShowBanner(false)}
            className="p-1.5 text-amber-600 hover:text-amber-900 hover:bg-amber-200/60 rounded-lg transition-all"
            title="Funga Ilani"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
