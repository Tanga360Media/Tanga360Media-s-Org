import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc, 
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Team, RegistrationPeriod, Match, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestore-errors';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Trophy,
  ExternalLink,
  CreditCard,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'approvals' | 'periods' | 'matches' | 'groups'>('approvals');
  const [approvalFilter, setApprovalFilter] = useState<'PENDING' | 'CONFIRMED' | 'REJECTED'>('PENDING');
  const [periods, setPeriods] = useState<RegistrationPeriod[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Period Form
  const [seasonName, setSeasonName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Match Form
  const [matchDate, setMatchDate] = useState('');
  const [homeTeam, setHomeTeam] = useState({ id: '', name: '' });
  const [awayTeam, setAwayTeam] = useState({ id: '', name: '' });
  const [venue, setVenue] = useState('');

  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'teams');
    });

    const unsubPeriods = onSnapshot(collection(db, 'registrationPeriods'), (snap) => {
      setPeriods(snap.docs.map(d => ({ id: d.id, ...d.data() } as RegistrationPeriod)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'registrationPeriods');
    });

    const unsubMatches = onSnapshot(query(collection(db, 'matches'), orderBy('matchDate', 'asc')), (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Match)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'matches');
    });

    return () => {
      unsubTeams();
      unsubPeriods();
      unsubMatches();
    };
  }, []);

  const handleApprove = async (teamId: string, status: 'CONFIRMED' | 'REJECTED') => {
    try {
      await updateDoc(doc(db, 'teams', teamId), {
        paymentStatus: status,
        isApproved: status === 'CONFIRMED'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `teams/${teamId}`);
    }
  };

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'registrationPeriods'), {
        seasonName,
        startDate,
        endDate,
        isActive: true
      });
      setSeasonName('');
      setStartDate('');
      setEndDate('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registrationPeriods');
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam.id || !awayTeam.id) return;
    try {
      await addDoc(collection(db, 'matches'), {
        homeTeamId: homeTeam.id,
        homeTeamName: homeTeam.name,
        awayTeamId: awayTeam.id,
        awayTeamName: awayTeam.name,
        matchDate,
        status: 'SCHEDULED',
        venue
      });
      setMatchDate('');
      setVenue('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'matches');
    }
  };

  const updateMatchScore = async (matchId: string, scoreHome: number, scoreAway: number, status: string) => {
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        scoreHome,
        scoreAway,
        status
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `matches/${matchId}`);
    }
  };

  const updateTeamStandings = async (
    teamId: string, 
    fields: Partial<Pick<Team, 'group' | 'played' | 'won' | 'drawn' | 'lost' | 'goalsFor' | 'goalsAgainst' | 'points'>>
  ) => {
    try {
      await updateDoc(doc(db, 'teams', teamId), fields);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `teams/${teamId}`);
    }
  };

  if (profile?.role !== 'ADMIN') {
    return <div className="p-12 text-center text-red-600 font-bold">Huna ruhusa ya kuingia hapa.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-3 rounded-2xl text-white">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase">Panel ya Utawala (Admin)</h1>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:mx-0 md:px-0">
        {[
          { id: 'approvals', label: 'Uthibitisho', icon: CheckCircle },
          { id: 'periods', label: 'Madirisha', icon: Calendar },
          { id: 'matches', label: 'Ratiba', icon: Trophy },
          { id: 'groups', label: 'Makundi & Msimamo', icon: Layers }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-bold transition-all shrink-0 text-sm md:text-base border border-slate-100",
              activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-slate-400 hover:text-slate-600 shadow-sm"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'approvals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-bold">Maombi ya Usajili</h3>
              <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
                {(['PENDING', 'CONFIRMED', 'REJECTED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setApprovalFilter(status)}
                    className={cn(
                      "px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-black transition-all shrink-0 uppercase tracking-wider",
                      approvalFilter === status 
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "text-slate-500"
                    )}
                  >
                    {status === 'PENDING' ? 'Mchakato' : status === 'CONFIRMED' ? 'Tayari' : 'Kataa'}
                    <span className="ml-2 bg-slate-200 px-1.5 py-0.5 rounded-md">
                      {teams.filter(t => t.paymentStatus === status).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {teams.filter(t => t.paymentStatus === approvalFilter).map(team => (
                <div key={team.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-md transition-all">
                   <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 p-2 border border-slate-100 shrink-0">
                      {team.logoUrl ? (
                         <img src={team.logoUrl} className="w-full h-full object-contain" alt="logo" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-300"><Trophy size={24} /></div>
                      )}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg text-slate-900">{team.name}</h4>
                        {team.isApproved && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-sm">
                        <span className="flex items-center gap-1"><CreditCard size={14} /> {team.paymentMethod}</span>
                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(team.createdAt).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 w-full md:w-auto">
                      {team.paymentProofUrl && (
                        <a 
                          href={team.paymentProofUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-slate-200"
                        >
                          Risiti <ExternalLink size={14} />
                        </a>
                      )}
                      
                      {approvalFilter === 'PENDING' ? (
                        <>
                          <button 
                            onClick={() => handleApprove(team.id, 'REJECTED')} 
                            className="flex-1 md:flex-none bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                          >
                            Kataa
                          </button>
                          <button 
                            onClick={() => handleApprove(team.id, 'CONFIRMED')} 
                            className="flex-1 md:flex-none bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-green-100 transition-all"
                          >
                            Thibitisha
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleApprove(team.id, 'PENDING' as any)} 
                          className="flex-1 md:flex-none border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                        >
                          Rudisha Mapitio
                        </button>
                      )}
                   </div>
                </div>
              ))}
              {teams.filter(t => t.paymentStatus === approvalFilter).length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">Hakuna timu zilizopatikana kwenye kundi hili.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'periods' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus className="text-blue-600" /> Dirisha Jipya</h3>
               <form onSubmit={handleAddPeriod} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Jina la Msimu</label>
                    <input required type="text" value={seasonName} onChange={e => setSeasonName(e.target.value)} placeholder="Mfano: Ligi Kuu 2026/27" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tarehe ya Kuanza</label>
                    <input required type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tarehe ya Mwisho</label>
                    <input required type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200" />
                  </div>
                  <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Fungua Dirisha</button>
               </form>
            </div>
            <div className="md:col-span-2 space-y-4">
               <h3 className="text-xl font-bold">Madirisha Yaliyopita</h3>
               {periods.map(p => (
                 <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{p.seasonName}</h4>
                      <p className="text-xs text-slate-500">{new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}</p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {p.isActive ? 'INAFANYA KAZI' : 'IMEISHA'}
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'matches' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus className="text-blue-600" /> Panga Mechi</h3>
               <form onSubmit={handleAddMatch} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Timu ya Nyumbani</label>
                    <select required onChange={e => setHomeTeam({id: e.target.value, name: teams.find(t => t.id === e.target.value)?.name || ''})} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                       <option value="">Chagua Timu</option>
                       {teams.filter(t => t.isApproved).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Timu ya Ubalini</label>
                    <select required onChange={e => setAwayTeam({id: e.target.value, name: teams.find(t => t.id === e.target.value)?.name || ''})} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                       <option value="">Chagua Timu</option>
                       {teams.filter(t => t.isApproved).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tarehe na Muda</label>
                    <input required type="datetime-local" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Uwanja (Venue)</label>
                    <input required type="text" value={venue} onChange={e => setVenue(e.target.value)} placeholder="Mfano: Benjamin Mkapa" className="w-full px-4 py-2 rounded-xl border border-slate-200" />
                  </div>
                  <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100">Panga Mechi</button>
               </form>
            </div>
            <div className="md:col-span-2 space-y-4">
               <h3 className="text-xl font-bold">Matokeo ya Mechi</h3>
               {matches.map(m => (
                 <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                       <div className="text-center flex-1">
                          <p className="font-bold text-lg">{m.homeTeamName}</p>
                          <input 
                            type="number" 
                            defaultValue={m.scoreHome} 
                            className="w-12 text-center text-2xl font-black bg-transparent border-b border-slate-300 focus:border-blue-600 outline-none" 
                            onBlur={e => updateMatchScore(m.id, parseInt(e.target.value), m.scoreAway || 0, m.status)}
                          />
                       </div>
                       <div className="px-4 font-black text-slate-400">VS</div>
                       <div className="text-center flex-1">
                          <p className="font-bold text-lg">{m.awayTeamName}</p>
                          <input 
                            type="number" 
                            defaultValue={m.scoreAway} 
                            className="w-12 text-center text-2xl font-black bg-transparent border-b border-slate-300 focus:border-blue-600 outline-none" 
                            onBlur={e => updateMatchScore(m.id, m.scoreHome || 0, parseInt(e.target.value), m.status)}
                          />
                       </div>
                    </div>
                    <div className="flex justify-between items-center">
                       <select 
                         value={m.status} 
                         onChange={e => updateMatchScore(m.id, m.scoreHome || 0, m.scoreAway || 0, e.target.value)}
                         className="text-xs font-bold uppercase border-none bg-slate-100 px-3 py-1 rounded-full outline-none"
                       >
                          <option value="SCHEDULED">IMEPANGWA</option>
                          <option value="LIVE">LIVE</option>
                          <option value="FINISHED">IMEISHA</option>
                       </select>
                       <span className="text-xs text-slate-400 font-medium">{new Date(m.matchDate).toLocaleString()} - {m.venue}</span>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'groups' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Usimamizi wa Makundi na Msimamo</h3>
                  <p className="text-xs text-slate-500">Panga timu zilizothibitishwa kwenye makundi na urekebishe takwimu za alama za ushindi.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Nembo & Timu</th>
                      <th className="py-3 px-4">Kundi</th>
                      <th className="py-3 px-4 text-center">Mechi (P)</th>
                      <th className="py-3 px-4 text-center">Shinda (W)</th>
                      <th className="py-3 px-4 text-center">Sare (D)</th>
                      <th className="py-3 px-4 text-center">Poteza (L)</th>
                      <th className="py-3 px-4 text-center">GF</th>
                      <th className="py-3 px-4 text-center">GA</th>
                      <th className="py-3 px-4 text-center">Alama (PTS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teams.filter(t => t.isApproved).length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                          Hakuna timu zilizothibitishwa bado. Thibitisha timu kwenye tab ya "Uthibitisho".
                        </td>
                      </tr>
                    ) : (
                      teams.filter(t => t.isApproved).map(team => (
                        <tr key={team.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-50 p-1 border border-slate-100 shrink-0 flex items-center justify-center">
                              {team.logoUrl ? (
                                <img src={team.logoUrl} className="w-full h-full object-contain" alt="" />
                              ) : (
                                <Trophy size={14} className="text-slate-300" />
                              )}
                            </div>
                            <span className="font-bold text-slate-800">{team.name}</span>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={team.group || ''}
                              onChange={e => updateTeamStandings(team.id, { group: e.target.value || undefined })}
                              className="bg-slate-100 font-bold border-none rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Bila Kundi</option>
                              <option value="A">Kundi A</option>
                              <option value="B">Kundi B</option>
                              <option value="C">Kundi C</option>
                              <option value="D">Kundi D</option>
                              <option value="E">Kundi E</option>
                              <option value="F">Kundi F</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              key={`${team.id}-played-${team.played || 0}`}
                              defaultValue={team.played || 0}
                              onBlur={e => updateTeamStandings(team.id, { played: parseInt(e.target.value) || 0 })}
                              className="w-12 text-center bg-slate-50 border border-slate-100 rounded-lg p-1 font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              key={`${team.id}-won-${team.won || 0}`}
                              defaultValue={team.won || 0}
                              onBlur={e => updateTeamStandings(team.id, { won: parseInt(e.target.value) || 0 })}
                              className="w-12 text-center bg-slate-50 border border-slate-100 rounded-lg p-1 font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              key={`${team.id}-drawn-${team.drawn || 0}`}
                              defaultValue={team.drawn || 0}
                              onBlur={e => updateTeamStandings(team.id, { drawn: parseInt(e.target.value) || 0 })}
                              className="w-12 text-center bg-slate-50 border border-slate-100 rounded-lg p-1 font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              key={`${team.id}-lost-${team.lost || 0}`}
                              defaultValue={team.lost || 0}
                              onBlur={e => updateTeamStandings(team.id, { lost: parseInt(e.target.value) || 0 })}
                              className="w-12 text-center bg-slate-50 border border-slate-100 rounded-lg p-1 font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              key={`${team.id}-goalsFor-${team.goalsFor || 0}`}
                              defaultValue={team.goalsFor || 0}
                              onBlur={e => updateTeamStandings(team.id, { goalsFor: parseInt(e.target.value) || 0 })}
                              className="w-12 text-center bg-slate-50 border border-slate-100 rounded-lg p-1 font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              key={`${team.id}-goalsAgainst-${team.goalsAgainst || 0}`}
                              defaultValue={team.goalsAgainst || 0}
                              onBlur={e => updateTeamStandings(team.id, { goalsAgainst: parseInt(e.target.value) || 0 })}
                              className="w-12 text-center bg-slate-50 border border-slate-100 rounded-lg p-1 font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              key={`${team.id}-points-${team.points || 0}`}
                              defaultValue={team.points || 0}
                              onBlur={e => updateTeamStandings(team.id, { points: parseInt(e.target.value) || 0 })}
                              className="w-12 text-center bg-blue-50 border border-blue-100 text-blue-700 rounded-lg p-1 font-extrabold focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
