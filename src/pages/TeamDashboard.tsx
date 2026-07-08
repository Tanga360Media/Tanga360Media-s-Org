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
  Clock, 
  Camera,
  Settings,
  Info,
  Trophy
} from 'lucide-react';
import { cn } from '../lib/utils';

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
  const [formData, setFormData] = useState({ name: '', position: '', jersey: '', role: '', photo: null as File | null });
  const [isUploading, setIsUploading] = useState(false);

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
      const storageRef = ref(storage, `${type}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (storageErr) {
      console.warn("Storage upload failed, falling back to Base64:", storageErr);
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
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
        position: formData.position,
        jerseyNumber: parseInt(formData.jersey),
        photoUrl: url
      });
      setIsAddingPlayer(false);
      setFormData({ name: '', position: '', jersey: '', role: '', photo: null });
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
      setFormData({ name: '', position: '', jersey: '', role: '', photo: null });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'staff');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, type: 'players' | 'staff') => {
    if (confirm('Je unauhakika unataka kufuta rekodi hii?')) {
      try {
        await deleteDoc(doc(db, type, id));
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
              "px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1",
              team.paymentStatus === 'CONFIRMED' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            )}>
              {team.paymentStatus === 'CONFIRMED' ? <CheckCircle size={12} /> : <Clock size={12} />}
              {team.paymentStatus === 'CONFIRMED' ? 'Malipo Sawa' : 'Malipo Bado'}
            </span>
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1",
              team.isApproved ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
            )}>
              {team.isApproved ? 'Umekubaliwa' : 'Inakaguliwa'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
           <div className="text-center p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="text-xl md:text-2xl font-black text-slate-900">{players.length}/25</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase">Wachezaji</div>
           </div>
           <div className="text-center p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="text-xl md:text-2xl font-black text-slate-900">{staff.length}/5</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase">Bench</div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold mb-6">Hali ya Usajili</h3>
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
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900">Orodha ya Wachezaji</h3>
               <button 
                 onClick={() => setIsAddingPlayer(true)}
                 disabled={players.length >= 25}
                 className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
               >
                 <UserPlus size={18} /> Ongeza Mchezaji
               </button>
            </div>

            {/* Players Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {players.map(player => (
                <div key={player.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group">
                  <div className="aspect-square bg-slate-100 relative">
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md">
                      {player.jerseyNumber}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-slate-900 truncate">{player.name}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{player.position}</p>
                    <button 
                      onClick={() => handleDelete(player.id, 'players')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
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
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900">Benchi la Ufundi</h3>
               <button 
                 onClick={() => setIsAddingStaff(true)}
                 disabled={staff.length >= 5}
                 className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
               >
                 <UserPlus size={18} /> Ongeza Fundi
               </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map(member => (
                <div key={member.id} className="bg-white flex items-center p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                   <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                   </div>
                   <div className="ml-4 flex-1">
                      <h4 className="font-bold text-slate-900">{member.name}</h4>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{member.role}</p>
                   </div>
                   <button 
                      onClick={() => handleDelete(member.id, 'staff')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 p-2"
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6"
            >
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="text-blue-600" />
                {isAddingPlayer ? "Sajili Mchezaji" : "Sajili Benchi la Ufundi"}
              </h3>
              
              <form onSubmit={isAddingPlayer ? handleAddPlayer : handleAddStaff} className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">Jina Kamili</label>
                   <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>

                 {isAddingPlayer ? (
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500 uppercase">Nafasi</label>
                       <select required value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                          <option value="">Chagua</option>
                          <option value="GK">Goal Keeper</option>
                          <option value="DEF">Defender</option>
                          <option value="MID">Midfielder</option>
                          <option value="FWD">Forward</option>
                       </select>
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500 uppercase">Jezi #</label>
                       <input required type="number" value={formData.jersey} onChange={e => setFormData({...formData, jersey: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200" />
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Wadhifa (Role)</label>
                     <input required type="text" placeholder="Mfano: Head Coach, Assistant, Doctor..." value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200" />
                   </div>
                 )}

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">Picha</label>
                   <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                      <input required type="file" accept="image/*" onChange={e => setFormData({...formData, photo: e.target.files?.[0] || null})} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Camera size={24} className="mx-auto text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">{formData.photo ? formData.photo.name : "Pandisha Picha"}</span>
                   </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => {setIsAddingPlayer(false); setIsAddingStaff(false);}} className="flex-1 px-4 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Ghairi</button>
                    <button type="submit" disabled={isUploading} className="flex-[2] bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                       {isUploading ? "Inasave..." : "Ilaiki"}
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
