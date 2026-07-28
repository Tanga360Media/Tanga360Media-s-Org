import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestore-errors';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'motion/react';
import { Upload, Trophy, CreditCard, ChevronRight, CheckCircle2, Info } from 'lucide-react';
import { cn, compressImage } from '../lib/utils';

export default function RegisterTeam() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingTeam, setExistingTeam] = useState<any>(null);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    if (!user) navigate('/login');
    
    // Check if user already registered a team
    const checkTeam = async () => {
      try {
        const q = query(collection(db, 'teams'), where('managerId', '==', user?.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setExistingTeam({ id: snap.docs[0].id, ...snap.docs[0].data() });
          navigate('/team');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'teams');
      }
    };
    if (user) checkTeam();
  }, [user]);

  const handleUpload = async (file: File, path: string) => {
    try {
      // Compress image first to keep file size extremely small (~50KB-150KB)
      const compressedFile = await compressImage(file);
      const storageRef = ref(storage, `${path}/${Date.now()}_${compressedFile.name}`);
      
      // Try to upload with a 15000ms (15s) timeout
      await Promise.race([
        uploadBytes(storageRef, compressedFile),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timeout')), 15000))
      ]);
      
      // Try to get download URL with a 5000ms (5s) timeout
      const url = await Promise.race([
        getDownloadURL(storageRef),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('URL timeout')), 5000))
      ]);
      
      return url;
    } catch (storageErr) {
      console.warn("Storage upload failed or timed out, falling back to compressed Base64:", storageErr);
      // Even in fallback, we use the compressed version so Firestore document size remains tiny!
      try {
        const compressedFile = await compressImage(file);
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
      } catch (fallbackErr) {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let logoUrl = '';
      let paymentProofUrl = '';

      if (logo) logoUrl = await handleUpload(logo, 'logos');
      if (paymentProof) paymentProofUrl = await handleUpload(paymentProof, 'payments');

      const teamData = {
        name: teamName,
        managerId: user.uid,
        logoUrl,
        paymentStatus: 'PENDING',
        paymentProofUrl,
        paymentMethod,
        createdAt: new Date().toISOString(),
        isApproved: false
      };

      const docRef = await addDoc(collection(db, 'teams'), teamData);
      
      // Update user profile with teamId
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          teamId: docRef.id
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }

      setStep(3);
    } catch (error) {
      console.error('Registration failed:', error);
      handleFirestoreError(error, OperationType.CREATE, 'teams');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-1 sm:px-0">
      {/* Steps Indicator */}
      <div className="flex justify-between mb-6 md:mb-12 bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm">
        {[
          { n: 1, label: 'Taarifa za Timu' },
          { n: 2, label: 'Malipo' },
          { n: 3, label: 'Kamilisha' }
        ].map((s) => (
          <div key={s.n} className="flex flex-col items-center gap-1.5 flex-1 text-center">
            <div className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-sm",
              step >= s.n ? "bg-blue-600 text-white shadow-blue-200" : "bg-slate-100 text-slate-400"
            )}>
              {step > s.n ? <CheckCircle2 size={16} className="sm:w-5 sm:h-5" /> : s.n}
            </div>
            <span className={cn(
              "text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-1",
              step >= s.n ? "text-blue-600" : "text-slate-400"
            )}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-100"
      >
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-5 sm:space-y-6">
            <div className="flex items-center gap-3 mb-2 sm:mb-6">
              <div className="bg-blue-50 p-2.5 sm:p-3 rounded-2xl text-blue-600 shrink-0">
                <Trophy size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Taarifa za Timu</h2>
                <p className="text-slate-500 text-xs">Jaza jina na nembo ya timu yako</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">Jina la Timu</label>
              <input
                required
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Mfano: Simba SC, Yanga SC..."
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-base"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">Nembo ya Timu (Logo/Picha)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 sm:p-8 text-center hover:border-blue-400 transition-colors relative bg-slate-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogo(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer min-h-[44px]"
                />
                <Upload className="mx-auto text-blue-500 mb-2" size={28} />
                <p className="text-slate-700 font-bold text-xs sm:text-sm">
                  {logo ? logo.name : "Bonyeza hapa kuchagua picha ya logo"}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Gusa kuchagua picha kutoka kwenye simu (PNG/JPG)</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.99] min-h-[48px]"
            >
              Endelea <ChevronRight size={20} />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="flex items-center gap-3 mb-2 sm:mb-6">
              <div className="bg-green-50 p-2.5 sm:p-3 rounded-2xl text-green-600 shrink-0">
                <CreditCard size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Uthibitisho wa Malipo</h2>
                <p className="text-slate-500 text-xs">Weka njia na risiti ya malipo</p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 p-4 sm:p-6 rounded-2xl">
              <h3 className="font-extrabold text-amber-900 text-xs sm:text-sm mb-2.5 flex items-center gap-2">
                <Info size={18} className="text-amber-700 shrink-0" />
                Mambo ya Kuzingatia Wakati wa Malipo:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-amber-900/90 list-disc list-inside font-medium leading-relaxed">
                <li>Ada rasmi ya usajili wa timu ni <span className="font-black text-slate-900">TZS 80,000</span>.</li>
                <li>Chagua njia sahihi ya kibenki au ya mtandao wa simu uliyotumia kufanya malipo.</li>
                <li>Hakikisha unapakia picha au picha-skrini (screenshot) iliyo wazi ya risiti/muamala kama uthibitisho.</li>
                <li>Usajili wa timu yako utathibitishwa rasmi na Kamati Kuu ya UMTV CUP 2026 baada ya kukagua risiti yako.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">Njia Uliyotumia Kulipia</label>
              <select
                required
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-base bg-white"
              >
                <option value="">Chagua Njia ya Malipo</option>
                <option value="M-PESA">M-PESA (Vodacom)</option>
                <option value="Tigo Pesa">Tigo Pesa</option>
                <option value="Airtel Money">Airtel Money</option>
                <option value="Halo Pesa">Halo Pesa</option>
                <option value="Lipa kwa Simu">Lipa kwa Simu / Merchant</option>
                <option value="Bank Transfer">Bank Transfer (CRDB/NMB)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">Ambatisha Risiti au Muamala (Picha)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 sm:p-8 text-center hover:border-blue-400 transition-colors relative bg-slate-50/50">
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer min-h-[44px]"
                />
                <Upload className="mx-auto text-green-600 mb-2" size={28} />
                <p className="text-slate-700 font-bold text-xs sm:text-sm">
                  {paymentProof ? paymentProof.name : "Gusa hapa kupakia picha ya risiti ya benki au muamala"}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Kukagua muamala kutoka kwenye nyumba ya matunzio (Gallery)</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-slate-200 py-3.5 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 text-sm min-h-[48px]"
              >
                Rudi
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] bg-blue-600 text-white py-3.5 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-100 min-h-[48px] active:scale-[0.99]"
              >
                {loading ? "Inatuma Risiti..." : "Kamilisha Usajili"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-12 space-y-6">
            <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Usajili Umepokelewa!</h2>
            <p className="text-slate-600 text-lg max-w-md mx-auto">
              Asante kwa kusajili timu yako. Admin atakagua malipo yako na usajili wako hivi punde.
            </p>
            <button
              onClick={() => navigate('/team')}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg"
            >
              Nenda kwenye Dashboard
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
