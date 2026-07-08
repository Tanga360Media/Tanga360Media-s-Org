import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestore-errors';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'motion/react';
import { Upload, Trophy, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto">
      {/* Steps Indicator */}
      <div className="flex justify-between mb-12">
        {[
          { n: 1, label: 'Taarifa za Timu' },
          { n: 2, label: 'Malipo' },
          { n: 3, label: 'Kamilisha' }
        ].map((s) => (
          <div key={s.n} className="flex flex-col items-center gap-2 flex-1">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
              step >= s.n ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
            )}>
              {step > s.n ? <CheckCircle2 size={20} /> : s.n}
            </div>
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider",
              step >= s.n ? "text-blue-600" : "text-slate-400"
            )}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
      >
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                <Trophy size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Taarifa za Timu</h2>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Jina la Timu</label>
              <input
                required
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Mfano: Simba SC, Yanga SC..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Logo ya Timu (Picha)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogo(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-slate-600 font-medium">
                  {logo ? logo.name : "Bonyeza hapa au buruta picha ya logo"}
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG hadi 5MB</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              Endelea <ChevronRight size={20} />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-50 p-3 rounded-2xl text-green-600">
                <CreditCard size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Uthibitisho wa Malipo</h2>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
              <h3 className="font-bold text-slate-800 mb-2">Maelekezo ya Malipo:</h3>
              <p className="text-sm text-slate-600 mb-4">
                Ada ya usajili ni <span className="font-bold text-slate-900">TZS 50,000</span>. Tafadhali lipa kupitia:
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex justify-between border-b border-slate-200 pb-2">
                  <span>M-PESA:</span>
                  <span className="font-mono font-bold text-blue-600">07XX XXX XXX (CHREES MEDIA)</span>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-2">
                  <span>Lipa kwa Simu:</span>
                  <span className="font-mono font-bold text-blue-600">512345</span>
                </li>
                <li className="flex justify-between">
                  <span>CRDB Bank:</span>
                  <span className="font-mono font-bold text-blue-600">015XXXXXXXXXXX</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Njia ya Malipo</label>
              <select
                required
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              >
                <option value="">Chagua Njia</option>
                <option value="M-PESA">M-PESA</option>
                <option value="Tigo Pesa">Tigo Pesa</option>
                <option value="Lipa kwa Simu">Lipa kwa Simu</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Ambatisha Risiti (Picha/PDF)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors relative">
                <input
                  required
                  type="file"
                  onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-slate-600 font-medium">
                  {paymentProof ? paymentProof.name : "Pandisha picha ya risiti hapa"}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-slate-200 py-4 rounded-xl font-bold hover:bg-slate-50"
              >
                Rudi
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Inatuma..." : "Kamilisha Usajili"}
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
