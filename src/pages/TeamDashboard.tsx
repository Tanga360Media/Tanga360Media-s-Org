import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc,
  updateDoc 
} from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Team, Player, Staff, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestore-errors';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle, 
  CheckCircle2,
  XCircle,
  Clock, 
  Camera,
  Settings,
  Info,
  Trophy,
  Send,
  Printer,
  FileText
} from 'lucide-react';
import { cn, compressImage } from '../lib/utils';

export default function TeamDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'staff'>('overview');
  const [loading, setLoading] = useState(true);

  // Form states
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', photo: null as File | null });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch Team
    const qTeam = query(collection(db, 'teams'), where('managerId', '==', user.uid));
    const unsubTeam = onSnapshot(qTeam, (snap) => {
      if (!snap.empty) {
        setTeam({ id: snap.docs[0].id, ...snap.docs[0].data() } as Team);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'teams');
    });

    return () => unsubTeam();
  }, [user]);

  useEffect(() => {
    if (!team) return;

    const qPlayers = query(collection(db, 'players'), where('teamId', '==', team.id));
    const unsubPlayers = onSnapshot(qPlayers, (snap) => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Player)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'players');
    });

    const qStaff = query(collection(db, 'staff'), where('teamId', '==', team.id));
    const unsubStaff = onSnapshot(qStaff, (snap) => {
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'staff');
    });

    return () => {
      unsubPlayers();
      unsubStaff();
    };
  }, [team]);

  const uploadPhoto = async (file: File, type: 'players' | 'staff') => {
    try {
      // Compress image first to keep file size extremely small (~25KB-45KB)
      const compressedFile = await compressImage(file, 600, 600, 0.65);
      const storageRef = ref(storage, `${type}/${Date.now()}_${compressedFile.name}`);
      
      // Try to upload with a 2000ms (2s) timeout for ultra-fast performance
      await Promise.race([
        uploadBytes(storageRef, compressedFile),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timeout')), 2000))
      ]);
      
      // Try to get download URL with a 2000ms (2s) timeout
      const url = await Promise.race([
        getDownloadURL(storageRef),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('URL timeout')), 2000))
      ]);
      
      return url;
    } catch (storageErr) {
      console.warn("Storage upload delayed or failed, using fast compressed Base64 Data URL:", storageErr);
      try {
        const compressedFile = await compressImage(file, 600, 600, 0.65);
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

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || players.length >= 25 || !formData.photo) return;
    setIsUploading(true);
    try {
      const url = await uploadPhoto(formData.photo, 'players');
      await addDoc(collection(db, 'players'), {
        teamId: team.id,
        name: formData.name,
        photoUrl: url,
        createdAt: new Date().toISOString()
      });
      setIsAddingPlayer(false);
      setFormData({ name: '', role: '', photo: null });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'players');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || staff.length >= 5 || !formData.photo) return;
    setIsUploading(true);
    try {
      const url = await uploadPhoto(formData.photo, 'staff');
      await addDoc(collection(db, 'staff'), {
        teamId: team.id,
        name: formData.name,
        role: formData.role,
        photoUrl: url
      });
      setIsAddingStaff(false);
      setFormData({ name: '', role: '', photo: null });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'staff');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitForm = async () => {
    if (!team) return;
    if (players.length === 0) {
      alert("Tafadhali ongeza angalau mchezaji mmoja kabla ya kuwasilisha fomu rasmi ya usajili.");
      return;
    }
    if (!confirm(`Je, unathibitisha kuwasilisha Fomu Rasmi ya Usajili ya timu yako (${team.name}) yenye wachezaji ${players.length} na viongozi ${staff.length} kwa Kamati Kuu?`)) {
      return;
    }

    setIsSubmittingForm(true);
    try {
      await updateDoc(doc(db, 'teams', team.id), {
        formSubmitted: true,
        formSubmittedAt: new Date().toISOString()
      });
      alert("Fomu rasmi ya usajili ya timu yako imewasilishwa kikamilifu kwa Kamati Kuu UMTV CUP 2026!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${team.id}`);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handlePrintRegistrationForm = () => {
    if (!team) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Tafadhali ruhusu Pop-ups (Dirisha ibukizi) kwenye kivinjari chako ili kupakua au kuchapisha fomu ya usajili.");
      return;
    }

    const playersHtml = players.length > 0 ? players.map((p) => `
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center; background: #ffffff; page-break-inside: avoid;">
        <div style="width: 64px; height: 64px; margin: 0 auto 6px; border-radius: 50%; overflow: hidden; background: #f1f5f9; border: 2px solid #94a3b8;">
          ${p.photoUrl ? `<img src="${p.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="padding-top: 20px; color: #94a3b8; font-size: 9px; font-weight: bold;">BILA PICHA</div>`}
        </div>
        <div style="font-weight: 800; font-size: 11px; color: #0f172a;">${p.name}</div>
      </div>
    `).join('') : '<p style="grid-column: span 4; font-size: 12px; color: #64748b; font-style: italic; padding: 10px; text-align: center;">Hakuna wachezaji waliosajiliwa kwenye fomu hii.</p>';

    const staffHtml = staff.length > 0 ? staff.map((s) => `
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center; background: #ffffff; page-break-inside: avoid;">
        <div style="width: 64px; height: 64px; margin: 0 auto 6px; border-radius: 50%; overflow: hidden; background: #f1f5f9; border: 2px solid #94a3b8;">
          ${s.photoUrl ? `<img src="${s.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="padding-top: 20px; color: #94a3b8; font-size: 9px; font-weight: bold;">BILA PICHA</div>`}
        </div>
        <div style="font-weight: 800; font-size: 11px; color: #0f172a;">${s.name}</div>
        <div style="font-size: 10px; color: #059669; font-weight: bold; margin-top: 2px; background: #ecfdf5; padding: 2px 6px; border-radius: 10px; display: inline-block;">${s.role}</div>
      </div>
    `).join('') : '<p style="grid-column: span 4; font-size: 12px; color: #64748b; font-style: italic; padding: 10px; text-align: center;">Hakuna viongozi waliosajiliwa kwenye fomu hii.</p>';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="sw">
        <head>
          <meta charset="UTF-8">
          <title>FOMU YA USAJILI - ${team.name.toUpperCase()} - UMTV CUP 2026</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #0f172a; background: #fff; }
            .no-print { margin-bottom: 20px; text-align: right; }
            .btn-print { background: #2563eb; color: #ffffff; border: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 10px; cursor: pointer; }
            
            .header { text-align: center; border-bottom: 3px double #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 900; color: #1e3a8a; letter-spacing: 1px; }
            .header h2 { margin: 4px 0 0; font-size: 13px; color: #2563eb; font-weight: 800; text-transform: uppercase; }
            .badge { font-size: 11px; background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-top: 8px; font-weight: bold; border: 1px solid #bfdbfe; }
            
            .team-card { display: flex; align-items: center; gap: 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
            .team-logo { width: 85px; height: 85px; object-fit: contain; border-radius: 10px; background: #ffffff; border: 1px solid #cbd5e1; padding: 4px; flex-shrink: 0; }
            
            .section-title { font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #334155; padding-bottom: 4px; margin: 20px 0 12px; letter-spacing: 0.5px; }
            
            .grid-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
            
            .receipt-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; text-align: center; margin-top: 8px; }
            .receipt-img { max-width: 100%; max-height: 240px; object-fit: contain; border-radius: 6px; border: 1px solid #cbd5e1; }

            .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 60px; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; page-break-inside: avoid; }
            .sig-box { text-align: center; }
            .sig-line { border-bottom: 2px solid #334155; height: 40px; margin-bottom: 8px; }
            .sig-title { font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; }

            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="btn-print" onclick="window.print()">
              🖨️ Chapisha au Pakua Fomu Kama PDF
            </button>
          </div>

          <div class="header">
            <h1>UMTV CUP 2026</h1>
            <h2>FOMU RASMI YA USAJILI WA TIMU NA WACHEZAJI</h2>
            <div class="badge">Tarehe ya Usajili: ${new Date(team.createdAt).toLocaleDateString()} &bull; Namba ya Usajili: #${team.id.substring(0, 8).toUpperCase()}</div>
          </div>

          <div class="team-card">
            ${team.logoUrl ? `<img src="${team.logoUrl}" class="team-logo" />` : '<div style="width:75px; height:75px; background:#e2e8f0; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; color:#64748b;">NEMBO YA TIMU</div>'}
            <div style="flex: 1;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a;">${team.name}</h2>
              <div style="display: flex; gap: 20px; margin-top: 8px; font-size: 12px; color: #334155;">
                <div><strong>Hali ya Usajili:</strong> <span style="color: ${team.paymentStatus === 'CONFIRMED' ? '#16a34a' : team.paymentStatus === 'REJECTED' ? '#dc2626' : '#d97706'}; font-weight: 900;">${team.paymentStatus === 'CONFIRMED' ? 'IMETHIBITISHWA' : team.paymentStatus === 'REJECTED' ? 'IMEKATALIWA' : 'INASUBIRI MAPITIO'}</span></div>
                <div><strong>Hali ya Fomu:</strong> <span style="color: ${team.formSubmitted ? '#16a34a' : '#d97706'}; font-weight: 900;">${team.formSubmitted ? 'IMEWASILISHWA' : 'BADO HAIJAWASILISHWA'}</span></div>
              </div>
            </div>
          </div>

          <div class="section-title">1. Orodha ya Wachezaji Waliosajiliwa (${players.length})</div>
          <div class="grid-container">
            ${playersHtml}
          </div>

          <div class="section-title">2. Benchi la Ufundi / Viongozi (${staff.length})</div>
          <div class="grid-container">
            ${staffHtml}
          </div>

          ${team.paymentProofUrl ? `
            <div class="section-title">3. Uthibitisho wa Risiti ya Malipo</div>
            <div class="receipt-box">
              <img src="${team.paymentProofUrl}" class="receipt-img" />
            </div>
          ` : ''}

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-title">Saini na Muhuri wa Meneja wa Timu</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-title">Uthibitisho wa Kamati Kuu UMTV CUP</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDelete = async (id: string, type: 'players' | 'staff') => {
    const label = type === 'players' ? 'mchezaji huyu' : 'kiongozi huyu';
    if (confirm(`Je, una uhakika unataka kufuta ${label} kabisa?`)) {
      try {
        await deleteDoc(doc(db, type, id));
        if (type === 'players') {
          setPlayers(prev => prev.filter(p => p.id !== id));
        } else {
          setStaff(prev => prev.filter(s => s.id !== id));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${type}/${id}`);
      }
    }
  };

  if (loading) return <div className="p-12 text-center">Inapakia...</div>;
  if (!team) return <div className="p-12 text-center">Timu haijapatikana. <a href="/register-team" className="text-blue-600 underline">Sajili hapa</a></div>;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Profile */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden shadow-inner flex items-center justify-center shrink-0">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Trophy size={40} className="text-slate-300" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-2">{team.name}</h1>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-sm",
              (team.paymentStatus === 'CONFIRMED' || team.isApproved)
                ? "bg-green-100 text-green-800 border-green-200"
                : team.paymentStatus === 'REJECTED'
                ? "bg-red-100 text-red-800 border-red-200"
                : "bg-amber-100 text-amber-800 border-amber-200"
            )}>
              {(team.paymentStatus === 'CONFIRMED' || team.isApproved) ? (
                <>
                  <CheckCircle2 size={14} className="text-green-700" />
                  <span>Status: APPROVED (IMETHIBITISHWA)</span>
                </>
              ) : team.paymentStatus === 'REJECTED' ? (
                <>
                  <XCircle size={14} className="text-red-700" />
                  <span>Status: REJECTED (IMEKATALIWA)</span>
                </>
              ) : (
                <>
                  <Clock size={14} className="text-amber-700" />
                  <span>Status: PENDING (INASUBIRI MAPITIO)</span>
                </>
              )}
            </span>
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1 border",
              team.paymentStatus === 'CONFIRMED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
            )}>
              {team.paymentStatus === 'CONFIRMED' ? <CheckCircle size={12} /> : <Clock size={12} />}
              {team.paymentStatus === 'CONFIRMED' ? 'Malipo: Imethibitishwa' : 'Malipo: Inasubiri'}
            </span>
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1 border",
              team.formSubmitted ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"
            )}>
              {team.formSubmitted ? <CheckCircle size={12} /> : <Clock size={12} />}
              {team.formSubmitted ? 'Fomu: Imewasilishwa' : 'Fomu: Bado'}
            </span>
            <button
              onClick={handlePrintRegistrationForm}
              className="px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Printer size={12} />
              <span>Pakua / Chapisha Fomu (PDF)</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
           <div className="text-center p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
             <div className="text-xl md:text-2xl font-black text-slate-900">{players.length}/25</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase">Wachezaji</div>
             <div className="text-[9px] text-slate-500 font-medium mt-1">Upeo: 25</div>
           </div>
           <div className="text-center p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
             <div className="text-xl md:text-2xl font-black text-slate-900">{staff.length}/5</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase">Benchi</div>
             <div className="text-[9px] text-slate-500 font-medium mt-1">Upeo: 5</div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:mx-0 md:px-0">
        {[
          { id: 'overview', label: 'Maelezo', icon: Info },
          { id: 'players', label: 'Wachezaji', icon: Users },
          { id: 'staff', label: 'Benchi', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all shrink-0 text-sm md:text-base",
              activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-slate-400 hover:text-slate-600 border border-slate-100"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Hali ya Usajili Wa Timu</h3>

            {/* Status Banner */}
            {(team.paymentStatus === 'CONFIRMED' || team.isApproved) ? (
              <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl shrink-0">
                    <CheckCircle2 size={32} className="text-white" />
                  </div>
                  <div>
                    <div className="inline-block px-2.5 py-0.5 bg-emerald-400/40 text-white font-black text-[10px] tracking-widest uppercase rounded-full mb-1">
                      STATUS YA USAJILI: APPROVED / IMETHIBITISHWA
                    </div>
                    <h4 className="font-black text-lg">Usajili Umethibitishwa na Kukubaliwa!</h4>
                    <p className="text-emerald-100 text-xs mt-0.5 leading-relaxed">
                      Timu ya <strong>{team.name}</strong> imekamilisha taratibu zote na imethibitishwa rasmi na Kamati Kuu kushiriki UMTV CUP 2026.
                    </p>
                  </div>
                </div>
              </div>
            ) : team.paymentStatus === 'REJECTED' ? (
              <div className="bg-rose-600 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl shrink-0">
                    <XCircle size={32} className="text-white" />
                  </div>
                  <div>
                    <div className="inline-block px-2.5 py-0.5 bg-rose-400/40 text-white font-black text-[10px] tracking-widest uppercase rounded-full mb-1">
                      STATUS YA USAJILI: REJECTED / IMEKATALIWA
                    </div>
                    <h4 className="font-black text-lg">Maombi ya Usajili Yamekataliwa</h4>
                    <p className="text-rose-100 text-xs mt-0.5 leading-relaxed">
                      Maombi ya usajili wa timu yako yanahitaji marekebisho. Tafadhali wasiliana na Uongozi wa UMTV CUP.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl shrink-0">
                    <Clock size={32} className="text-white" />
                  </div>
                  <div>
                    <div className="inline-block px-2.5 py-0.5 bg-amber-400/40 text-white font-black text-[10px] tracking-widest uppercase rounded-full mb-1">
                      STATUS YA USAJILI: PENDING / INASUBIRI MAPITIO
                    </div>
                    <h4 className="font-black text-lg">Usajili Upo Kwenye Mapitio (Pending)</h4>
                    <p className="text-amber-100 text-xs mt-0.5 leading-relaxed">
                      Maombi ya usajili wa timu yako yamepokelewa na yapo kwenye hatua ya kukaguliwa na Kamati Kuu. Subiri uthibitisho ukamilike.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Submission Action Card */}
            {team.formSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 p-2.5 rounded-xl text-white shrink-0">
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Fomu ya Usajili Imewasilishwa</h4>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Fomu rasmi ya timu yako imewasilishwa kwa Kamati Kuu UMTV CUP 2026.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePrintRegistrationForm}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer min-h-[42px] shrink-0 active:scale-95"
                >
                  <Printer size={16} />
                  <span>Pakua Fomu Rasmi (PDF)</span>
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-2xl shrink-0">
                    <Send size={26} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base sm:text-lg">Kamilisha &amp; Wasilisha Fomu ya Usajili</h4>
                    <p className="text-blue-100 text-xs mt-0.5 leading-relaxed">
                      Umesajili wachezaji {players.length} na viongozi {staff.length}. Bofya hapa kuwasilisha fomu rasmi kwa Kamati Kuu.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSubmitForm}
                  disabled={isSubmittingForm}
                  className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-900 font-black px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  <span>{isSubmittingForm ? "Inawasilisha..." : "Wasilisha Fomu Rasmi Sasa"}</span>
                </button>
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex gap-4 items-start shadow-sm">
              <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-extrabold text-emerald-800 text-sm">Idadi ya Usajili ni Hiyari (Upeo wa Juu)</h4>
                <p className="text-emerald-700 text-xs mt-1.5 leading-relaxed">
                  Timu yako inaweza kukamilisha usajili na idadi yoyote ya wachezaji (hadi 25) na benchi la ufundi (hadi 5). <strong>Sio lazima kabisa</strong> kuwa na wachezaji 25 au viongozi 5 ili usajili ukubaliwe. Unaweza kuwa na wachezaji wachache na bado ukathibitishwa na kuingizwa kwenye ratiba!
                </p>
              </div>
            </div>

            {team.paymentStatus !== 'CONFIRMED' && (
              <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl flex gap-4 items-start mb-6">
                <ShieldAlert className="text-orange-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-orange-800">Malipo Bado Hayajathibitishwa</h4>
                  <p className="text-orange-700 text-sm mt-1">
                    Tafadhali subiri admin athibitishe malipo yako. Huwezi kuongeza wachezaji mpaka usajili utakapopitishwa rasmi, au endelea kuongeza rasimu.
                  </p>
                </div>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 font-medium">Jina la Timu:</span>
                    <span className="font-bold">{team.name}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 font-medium">Njia ya Malipo:</span>
                    <span className="font-bold">{team.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 font-medium">Tarehe ya Usajili:</span>
                    <span className="font-bold">{new Date(team.createdAt).toLocaleDateString()}</span>
                  </div>
               </div>
               <div>
                 <h4 className="font-bold mb-2">Risiti ya Malipo:</h4>
                 <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                    {team.paymentProofUrl ? (
                      <img src={team.paymentProofUrl} className="w-full h-full object-contain" alt="Payment Proof" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">Hakuna picha</div>
                    )}
                 </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'players' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center gap-4">
               <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900">Orodha ya Wachezaji</h3>
                  <p className="text-slate-500 text-[11px] md:text-xs">Upeo ni wachezaji 25. Sio lazima kufikisha wachezaji 25 kamili ili kukamilisha usajili.</p>
               </div>
               <button 
                 onClick={() => setIsAddingPlayer(true)}
                 disabled={players.length >= 25}
                 className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
               >
                 <UserPlus size={18} /> Ongeza Mchezaji
               </button>
            </div>

            {/* Players Grid - 2 per row on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {players.map(player => (
                <div key={player.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group">
                  <div className="aspect-square bg-slate-100 relative">
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleDelete(player.id, 'players')}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl transition-all min-w-[36px] min-h-[36px] flex items-center justify-center shadow-md active:scale-95"
                      title="Futa Mchezaji"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="p-3 sm:p-4 text-center">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{player.name}</h4>
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400">Hakuna mchezaji aliyesajiliwa bado.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'staff' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center gap-4">
               <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900">Benchi la Ufundi</h3>
                  <p className="text-slate-500 text-[11px] md:text-xs">Upeo ni viongozi 5. Sio lazima kufikisha viongozi 5 kamili ili kukamilisha usajili.</p>
               </div>
               <button 
                 onClick={() => setIsAddingStaff(true)}
                 disabled={staff.length >= 5}
                 className="flex items-center gap-2 bg-blue-600 text-white px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-100 disabled:opacity-50 shrink-0 min-h-[44px]"
               >
                 <UserPlus size={18} /> Ongeza Fundi
               </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {staff.map(member => (
                <div key={member.id} className="bg-white flex items-center p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                   <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                   </div>
                   <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{member.name}</h4>
                      <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest truncate">{member.role}</p>
                   </div>
                   <button 
                      onClick={() => handleDelete(member.id, 'staff')}
                      className="text-red-600 bg-red-50 hover:bg-red-600 hover:text-white p-2.5 rounded-xl transition-all min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95 border border-red-100"
                      title="Futa Kiongozi"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              ))}
              {staff.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400">Hakuna benchi la ufundi lililosajiliwa bado.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAddingPlayer || isAddingStaff) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-md shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-900">
                <UserPlus className="text-blue-600" size={24} />
                {isAddingPlayer ? "Sajili Mchezaji" : "Sajili Benchi la Ufundi"}
              </h3>
              
              <form onSubmit={isAddingPlayer ? handleAddPlayer : handleAddStaff} className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">Jina Kamili</label>
                   <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-base" />
                 </div>

                 {isAddingStaff && (
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Wadhifa (Role)</label>
                     <input required type="text" placeholder="Mfano: Head Coach, Assistant, Doctor..." value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base" />
                   </div>
                 )}

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">Picha</label>
                   <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50">
                      <input required type="file" accept="image/*" onChange={e => setFormData({...formData, photo: e.target.files?.[0] || null})} className="absolute inset-0 opacity-0 cursor-pointer min-h-[44px]" />
                      <Camera size={26} className="mx-auto text-blue-600 mb-1" />
                      <span className="text-xs font-bold text-slate-700 block truncate">{formData.photo ? formData.photo.name : "Gusa hapa kupakia picha kutoka simuni"}</span>
                   </div>
                 </div>

                 <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => {setIsAddingPlayer(false); setIsAddingStaff(false);}} className="flex-1 px-4 py-3.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-sm border border-slate-200 min-h-[48px]">Ghairi</button>
                    <button type="submit" disabled={isUploading} className="flex-[2] bg-blue-600 text-white px-4 py-3.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 text-sm shadow-lg shadow-blue-100 min-h-[48px]">
                       {isUploading ? "Inatunza..." : "Hifadhi Taarifa"}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
