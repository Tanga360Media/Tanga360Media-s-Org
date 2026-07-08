import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, ShieldCheck, Phone, Lock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { loginWithPhone, registerWithPhone, user } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phone || phone.length < 8) {
      setError('Tafadhali weka namba sahihi ya simu (Mfano: 0712345678)');
      setLoading(false);
      return;
    }

    if (pin.length < 6) {
      setError('PIN au neno la siri lazima liwe na herufi au namba zisizopungua 6');
      setLoading(false);
      return;
    }

    if (isRegistering && !name.trim()) {
      setError('Tafadhali weka jina lako kamili');
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        await registerWithPhone(phone, name, pin);
      } else {
        await loginWithPhone(phone, pin);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Namba ya simu au PIN/Neno la siri sio sahihi.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Namba hii ya simu tayari imesajiliwa. Tafadhali ingia.');
      } else {
        setError('Kuna hitilafu imetokea. Tafadhali jaribu tena baadae.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200">
            <Trophy size={40} />
          </div>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-black text-center text-slate-900 mb-2 tracking-tight">
          {isRegistering ? 'Jisajili Soka Pro' : 'Karibu Soka Pro'}
        </h1>
        <p className="text-slate-500 text-center text-sm mb-8">
          {isRegistering 
            ? 'Weka taarifa zako kusajili akaunti ya usimamizi wa timu' 
            : 'Ingiza namba yako ya simu na PIN ili kuendelea'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs mb-6 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Jina Kamili</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Mfano: John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Namba ya Simu</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <Phone size={18} />
              </span>
              <input
                type="tel"
                placeholder="Mfano: 0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">PIN / Neno la Siri</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                placeholder="Zisizopungua herufi au namba 6"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              'Inasindika...'
            ) : (
              <>
                {isRegistering ? 'Tengeneza Akaunti' : 'Ingia Kwenye Akaunti'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-blue-600 hover:underline text-sm font-bold"
          >
            {isRegistering ? 'Tayari una akaunti? Ingia hapa' : 'Huna akaunti? Jisajili hapa'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 text-slate-400 text-[11px] justify-center">
          <ShieldCheck size={14} />
          <span>Usajili salama kwa namba ya simu</span>
        </div>
      </motion.div>
    </div>
  );
}
