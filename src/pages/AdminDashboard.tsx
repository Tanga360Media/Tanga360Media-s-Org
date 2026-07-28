import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc, 
  deleteDoc,
  orderBy,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Team, RegistrationPeriod, Match, OperationType, Player, Staff } from '../types';
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
  Layers,
  Eye,
  X,
  User,
  Users,
  FileText,
  Download,
  Printer,
  Trash2
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

  // Team Detail Modal State
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamPlayers, setSelectedTeamPlayers] = useState<Player[]>([]);
  const [selectedTeamStaff, setSelectedTeamStaff] = useState<Staff[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailModalTab, setDetailModalTab] = useState<'form' | 'payment' | 'players' | 'staff'>('form');

  const fetchTeamDetails = async (team: Team) => {
    setSelectedTeam(team);
    setDetailModalTab('form');
    setLoadingDetails(true);
    setSelectedTeamPlayers([]);
    setSelectedTeamStaff([]);
    try {
      const qPlayers = query(collection(db, 'players'), where('teamId', '==', team.id));
      const qStaff = query(collection(db, 'staff'), where('teamId', '==', team.id));
      
      const [playersSnap, staffSnap] = await Promise.all([
        getDocs(qPlayers),
        getDocs(qStaff)
      ]);

      const playersList = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      const staffList = staffSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));

      setSelectedTeamPlayers(playersList);
      setSelectedTeamStaff(staffList);
    } catch (error) {
      console.error("Error fetching team details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrintRegistrationForm = () => {
    if (!selectedTeam) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Tafadhali ruhusu Pop-ups (Dirisha ibukizi) kwenye kivinjari chako ili kupakua au kuchapisha fomu ya usajili.");
      return;
    }

    const playersHtml = selectedTeamPlayers.length > 0 ? selectedTeamPlayers.map((p) => `
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center; background: #ffffff; page-break-inside: avoid;">
        <div style="width: 64px; height: 64px; margin: 0 auto 6px; border-radius: 50%; overflow: hidden; background: #f1f5f9; border: 2px solid #94a3b8;">
          ${p.photoUrl ? `<img src="${p.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="padding-top: 20px; color: #94a3b8; font-size: 9px; font-weight: bold;">BILA PICHA</div>`}
        </div>
        <div style="font-weight: 800; font-size: 11px; color: #0f172a;">${p.name}</div>
        ${p.jerseyNumber || p.position ? `<div style="font-size: 10px; color: #2563eb; font-weight: bold; margin-top: 2px;">${p.jerseyNumber ? `#${p.jerseyNumber}` : ''} ${p.position ? `&bull; ${p.position}` : ''}</div>` : ''}
        ${p.idNumber ? `<div style="font-size: 8px; color: #64748b; margin-top: 2px;">ID: ${p.idNumber}</div>` : ''}
      </div>
    `).join('') : '<p style="grid-column: span 4; font-size: 12px; color: #64748b; font-style: italic; padding: 10px; text-align: center;">Hakuna wachezaji waliosajiliwa kwenye fomu hii.</p>';

    const staffHtml = selectedTeamStaff.length > 0 ? selectedTeamStaff.map((s) => `
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
          <title>FOMU YA USAJILI - ${selectedTeam.name.toUpperCase()} - UMTV CUP 2026</title>
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
            <div class="badge">Tarehe ya Usajili: ${new Date(selectedTeam.createdAt).toLocaleDateString()} &bull; Namba ya Usajili: #${selectedTeam.id.substring(0, 8).toUpperCase()}</div>
          </div>

          <div class="team-card">
            ${selectedTeam.logoUrl ? `<img src="${selectedTeam.logoUrl}" class="team-logo" />` : '<div style="width:75px; height:75px; background:#e2e8f0; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; color:#64748b;">NEMBO YA TIMU</div>'}
            <div style="flex: 1;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a;">${selectedTeam.name}</h2>
              <div style="display: flex; gap: 20px; margin-top: 8px; font-size: 12px; color: #334155;">
                <div><strong>Hali ya Usajili:</strong> <span style="color: ${selectedTeam.paymentStatus === 'CONFIRMED' ? '#16a34a' : selectedTeam.paymentStatus === 'REJECTED' ? '#dc2626' : '#d97706'}; font-weight: 900;">${selectedTeam.paymentStatus === 'CONFIRMED' ? 'IMETHIBITISHWA' : selectedTeam.paymentStatus === 'REJECTED' ? 'IMEKATALIWA' : 'INASUBIRI MAPITIO'}</span></div>
                <div><strong>Njia ya Malipo:</strong> ${selectedTeam.paymentMethod || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section-title">1. Orodha ya Wachezaji Waliosajiliwa (${selectedTeamPlayers.length})</div>
          <div class="grid-container">
            ${playersHtml}
          </div>

          <div class="section-title">2. Benchi la Ufundi / Viongozi (${selectedTeamStaff.length})</div>
          <div class="grid-container">
            ${staffHtml}
          </div>

          ${selectedTeam.paymentProofUrl ? `
            <div class="section-title">3. Uthibitisho wa Risiti ya Malipo</div>
            <div class="receipt-box">
              <img src="${selectedTeam.paymentProofUrl}" class="receipt-img" />
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

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Je, una uhakika unataka kufuta timu ya "${teamName}" kabisa? Kitendo hiki kitaondoa timu, wachezaji, viongozi na mechi zote za timu hii.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'teams', teamId));

      const qPlayers = query(collection(db, 'players'), where('teamId', '==', teamId));
      const qStaff = query(collection(db, 'staff'), where('teamId', '==', teamId));
      const qHomeMatches = query(collection(db, 'matches'), where('homeTeamId', '==', teamId));
      const qAwayMatches = query(collection(db, 'matches'), where('awayTeamId', '==', teamId));

      const [playersSnap, staffSnap, homeMatchesSnap, awayMatchesSnap] = await Promise.all([
        getDocs(qPlayers),
        getDocs(qStaff),
        getDocs(qHomeMatches),
        getDocs(qAwayMatches)
      ]);

      const deletes = [
        ...playersSnap.docs.map(d => deleteDoc(doc(db, 'players', d.id))),
        ...staffSnap.docs.map(d => deleteDoc(doc(db, 'staff', d.id))),
        ...homeMatchesSnap.docs.map(d => deleteDoc(doc(db, 'matches', d.id))),
        ...awayMatchesSnap.docs.map(d => deleteDoc(doc(db, 'matches', d.id)))
      ];

      await Promise.all(deletes);

      setTeams(prev => prev.filter(t => t.id !== teamId));
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
      }
      alert(`Timu ya "${teamName}" na taarifa zake zote zimefutwa kikamilifu.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `teams/${teamId}`);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Je, una uhakika unataka kufuta mechi hii kwenye ratiba?')) return;
    try {
      await deleteDoc(doc(db, 'matches', matchId));
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `matches/${matchId}`);
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!confirm('Je, una uhakika unataka kufuta dirisha hili la usajili?')) return;
    try {
      await deleteDoc(doc(db, 'registrationPeriods', periodId));
      setPeriods(prev => prev.filter(p => p.id !== periodId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `registrationPeriods/${periodId}`);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Je, una uhakika unataka kufuta mchezaji huyu kabisa?')) return;
    try {
      await deleteDoc(doc(db, 'players', playerId));
      setSelectedTeamPlayers(prev => prev.filter(p => p.id !== playerId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `players/${playerId}`);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Je, una uhakika unataka kufuta kiongozi huyu kabisa?')) return;
    try {
      await deleteDoc(doc(db, 'staff', staffId));
      setSelectedTeamStaff(prev => prev.filter(s => s.id !== staffId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `staff/${staffId}`);
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
                   <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                       <button 
                         onClick={() => fetchTeamDetails(team)} 
                         className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-blue-100"
                       >
                         <Eye size={14} /> Maelezo
                       </button>
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

                      <button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 px-3 py-2 rounded-xl text-sm font-bold transition-all border border-red-100"
                        title="Futa Timu"
                      >
                        <Trash2 size={15} />
                        <span>Futa</span>
                      </button>
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
                 <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-bold">{p.seasonName}</h4>
                      <p className="text-xs text-slate-500">{new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {p.isActive ? 'INAFANYA KAZI' : 'IMEISHA'}
                      </div>
                      <button
                        onClick={() => handleDeletePeriod(p.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                        title="Futa Dirisha"
                      >
                        <Trash2 size={16} />
                      </button>
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
                       <div className="flex items-center gap-3">
                         <span className="text-xs text-slate-400 font-medium">{new Date(m.matchDate).toLocaleString()} - {m.venue}</span>
                         <button
                           onClick={() => handleDeleteMatch(m.id)}
                           className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                           title="Futa Mechi"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
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
                      <th className="py-3 px-4 text-center">Kitendo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teams.filter(t => t.isApproved).length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
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
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteTeam(team.id, team.name)}
                              className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all border border-red-100 inline-flex items-center justify-center"
                              title="Futa Timu"
                            >
                              <Trash2 size={14} />
                            </button>
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

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border border-slate-100 p-2 shrink-0 flex items-center justify-center shadow-sm">
                  {selectedTeam.logoUrl ? (
                    <img src={selectedTeam.logoUrl} className="w-full h-full object-contain" alt="Nembo" />
                  ) : (
                    <Trophy size={28} className="text-amber-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-lg sm:text-xl text-slate-900">{selectedTeam.name}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Taarifa za Usajili wa Timu</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrintRegistrationForm}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 sm:px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-200 transition-all cursor-pointer min-h-[38px] active:scale-95"
                  title="Pakua / Chapisha Fomu ya Usajili kama PDF"
                >
                  <Printer size={16} />
                  <span className="hidden sm:inline">Pakua / Chapisha Fomu (PDF)</span>
                  <span className="sm:hidden">Pakua PDF</span>
                </button>
                <button 
                  onClick={() => setSelectedTeam(null)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors border border-slate-200 shadow-sm shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 gap-2 overflow-x-auto scrollbar-hide">
              {[
                { id: 'form', label: 'Fomu Rasmi ya Usajili', icon: FileText },
                { id: 'payment', label: 'Malipo & Risiti', icon: CreditCard },
                { id: 'players', label: `Wachezaji (${loadingDetails ? '...' : selectedTeamPlayers.length})`, icon: Users },
                { id: 'staff', label: `Benchi la Ufundi (${loadingDetails ? '...' : selectedTeamStaff.length})`, icon: User }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDetailModalTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-3 sm:px-4 py-3 font-bold text-xs sm:text-sm transition-all border-b-2 -mb-[1px] shrink-0",
                    detailModalTab === tab.id 
                      ? "border-blue-600 text-blue-600" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-bold text-sm">Tunapakia taarifa za timu...</p>
                </div>
              ) : (
                <>
                  {detailModalTab === 'form' && (
                    <div className="space-y-6">
                      {/* Banner Action */}
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-600 p-2.5 rounded-xl text-white shrink-0">
                            <FileText size={22} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">Fomu ya Usajili - {selectedTeam.name}</h4>
                            <p className="text-slate-500 text-xs">Fomu hii ina taarifa zote, nembo, risiti na picha za wachezaji na benchi la ufundi.</p>
                          </div>
                        </div>
                        <button
                          onClick={handlePrintRegistrationForm}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-blue-200 transition-all cursor-pointer min-h-[42px] shrink-0 active:scale-95"
                        >
                          <Printer size={16} />
                          <span>Pakua / Chapisha Fomu (PDF)</span>
                        </button>
                      </div>

                      {/* Official Form Document Paper Card */}
                      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
                        {/* Header */}
                        <div className="text-center border-b-2 border-blue-600 pb-4">
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">UMTV CUP 2026</h2>
                          <h3 className="text-xs sm:text-sm font-extrabold text-blue-600 uppercase tracking-widest mt-1">FOMU RASMI YA USAJILI WA TIMU NA WACHEZAJI</h3>
                          <p className="text-[11px] font-bold text-slate-400 mt-2 bg-slate-100 inline-block px-3 py-1 rounded-full">
                            Tarehe: {new Date(selectedTeam.createdAt).toLocaleString()} &bull; ID: #{selectedTeam.id.substring(0, 8).toUpperCase()}
                          </p>
                        </div>

                        {/* Team Details */}
                        <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 p-2 shrink-0 flex items-center justify-center shadow-sm">
                            {selectedTeam.logoUrl ? (
                              <img src={selectedTeam.logoUrl} className="w-full h-full object-contain" alt="Nembo ya Timu" />
                            ) : (
                              <Trophy size={36} className="text-amber-500" />
                            )}
                          </div>
                          <div className="space-y-1 text-center sm:text-left flex-1">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{selectedTeam.name}</h3>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs pt-1">
                              <span className="font-bold text-slate-600">Njia ya Malipo: <span className="text-slate-900">{selectedTeam.paymentMethod || 'Haikutajwa'}</span></span>
                              <span className={cn(
                                "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                selectedTeam.paymentStatus === 'CONFIRMED' ? "bg-green-100 text-green-700 border border-green-200" :
                                selectedTeam.paymentStatus === 'REJECTED' ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                              )}>
                                {selectedTeam.paymentStatus === 'CONFIRMED' ? 'IMETHIBITISHWA' : selectedTeam.paymentStatus === 'REJECTED' ? 'IMEKATALIWA' : 'INASUBIRI MAPITIO'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Players Section */}
                        <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4 flex items-center justify-between">
                            <span>1. Orodha ya Wachezaji Waliosajiliwa ({selectedTeamPlayers.length})</span>
                            <span className="text-[10px] text-slate-400 font-normal">Max 25</span>
                          </h4>
                          {selectedTeamPlayers.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4 text-center">Hakuna wachezaji waliosajiliwa bado.</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {selectedTeamPlayers.map((p) => (
                                <div key={p.id} className="border border-slate-200 rounded-xl p-3 text-center bg-white">
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 mb-2">
                                    {p.photoUrl ? (
                                      <img src={p.photoUrl} className="w-full h-full object-cover" alt={p.name} referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={24} /></div>
                                    )}
                                  </div>
                                  <p className="font-extrabold text-xs text-slate-900 line-clamp-1">{p.name}</p>
                                  <p className="text-[10px] font-black text-blue-600 mt-0.5">#{p.jerseyNumber} &bull; {p.position}</p>
                                  {p.idNumber && <p className="text-[9px] text-slate-400 mt-0.5">ID: {p.idNumber}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Staff Section */}
                        <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4 flex items-center justify-between">
                            <span>2. Benchi la Ufundi / Viongozi ({selectedTeamStaff.length})</span>
                            <span className="text-[10px] text-slate-400 font-normal">Max 5</span>
                          </h4>
                          {selectedTeamStaff.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4 text-center">Hakuna viongozi waliosajiliwa bado.</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {selectedTeamStaff.map((s) => (
                                <div key={s.id} className="border border-slate-200 rounded-xl p-3 text-center bg-white">
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 mb-2">
                                    {s.photoUrl ? (
                                      <img src={s.photoUrl} className="w-full h-full object-cover" alt={s.name} referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={24} /></div>
                                    )}
                                  </div>
                                  <p className="font-extrabold text-xs text-slate-900 line-clamp-1">{s.name}</p>
                                  <p className="text-[10px] font-black text-emerald-600 mt-0.5">{s.role}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Payment Receipt Section */}
                        {selectedTeam.paymentProofUrl && (
                          <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
                              3. Uthibitisho wa Risiti ya Malipo
                            </h4>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                              <img 
                                src={selectedTeam.paymentProofUrl} 
                                alt="Risiti ya Malipo" 
                                className="max-h-60 mx-auto rounded-lg object-contain border border-slate-200 cursor-zoom-in" 
                                onClick={() => window.open(selectedTeam.paymentProofUrl, '_blank')}
                              />
                            </div>
                          </div>
                        )}

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-dashed border-slate-300">
                          <div className="text-center">
                            <div className="border-b-2 border-slate-800 h-8 mb-2"></div>
                            <p className="text-[10px] font-bold text-slate-600 uppercase">Saini &amp; Muhuri wa Meneja wa Timu</p>
                          </div>
                          <div className="text-center">
                            <div className="border-b-2 border-slate-800 h-8 mb-2"></div>
                            <p className="text-[10px] font-bold text-slate-600 uppercase">Uthibitisho wa Kamati Kuu UMTV CUP</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {detailModalTab === 'payment' && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                          <h4 className="font-extrabold text-slate-900 text-base border-b pb-2 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Hali ya Usajili</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Njia ya Malipo:</span>
                              <span className="font-bold text-slate-800">{selectedTeam.paymentMethod || 'Haikutajwa'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Tarehe ya Kujisajili:</span>
                              <span className="font-bold text-slate-800">{new Date(selectedTeam.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium">Hali ya Malipo:</span>
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                                selectedTeam.paymentStatus === 'CONFIRMED' ? "bg-green-100 text-green-700" :
                                selectedTeam.paymentStatus === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {selectedTeam.paymentStatus === 'CONFIRMED' ? 'Tayari (Thibitishwa)' :
                                 selectedTeam.paymentStatus === 'REJECTED' ? 'Imekataliwa' : 'Inasubiri Mapitio'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                          <h4 className="font-extrabold text-slate-900 text-base border-b pb-2 flex items-center gap-2"><CreditCard size={18} className="text-blue-600" /> Maelezo ya Risiti</h4>
                          <div className="space-y-3 text-sm text-slate-600">
                            <p className="leading-relaxed">Risiti ya malipo iliyopakiwa na timu kama thibitisho la usajili wao.</p>
                            {selectedTeam.paymentProofUrl ? (
                              <a 
                                href={selectedTeam.paymentProofUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-xs shadow-lg shadow-blue-100"
                              >
                                <ExternalLink size={14} /> Fungua Risiti Kwenye Tab Mpya
                              </a>
                            ) : (
                              <div className="text-amber-600 font-bold bg-amber-50 p-3 rounded-xl text-xs">
                                Timu hii bado haijatuma risiti ya malipo.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedTeam.paymentProofUrl && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-900 text-sm">Muonekano wa Risiti ya Benki / Muamala:</h4>
                          <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[400px] flex items-center justify-center bg-slate-50">
                            <img 
                              src={selectedTeam.paymentProofUrl} 
                              alt="Risiti ya Malipo" 
                              className="max-w-full max-h-[400px] object-contain cursor-zoom-in"
                              onClick={() => window.open(selectedTeam.paymentProofUrl, '_blank')}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {detailModalTab === 'players' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b pb-4">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">Wachezaji Waliosajiliwa ({selectedTeamPlayers.length})</h4>
                          <p className="text-xs text-slate-500">Upeo ni wachezaji 25 kwa kila timu.</p>
                        </div>
                      </div>

                      {selectedTeamPlayers.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <Users size={48} className="text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-bold">Hakuna wachezaji waliopakiwa bado.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {selectedTeamPlayers.map(player => (
                            <div key={player.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all relative">
                              <div className="absolute top-2 right-2 bg-slate-900 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                                #{player.jerseyNumber}
                              </div>
                              <button
                                onClick={() => handleDeletePlayer(player.id)}
                                className="absolute top-2 left-2 p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                title="Futa Mchezaji"
                              >
                                <Trash2 size={14} />
                              </button>
                              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-50 border-2 border-slate-100 mb-3 shrink-0 shadow-inner">
                                {player.photoUrl ? (
                                  <img 
                                    src={player.photoUrl} 
                                    className="w-full h-full object-cover" 
                                    alt={player.name}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                    <User size={32} />
                                  </div>
                                )}
                              </div>
                              <h5 className="font-extrabold text-slate-900 text-sm line-clamp-1">{player.name}</h5>
                              <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider mt-1">{player.position}</p>
                              {player.idNumber && (
                                <p className="text-[10px] text-slate-400 font-medium mt-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                  ID: {player.idNumber}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {detailModalTab === 'staff' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b pb-4">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">Benchi la Ufundi / Viongozi ({selectedTeamStaff.length})</h4>
                          <p className="text-xs text-slate-500">Upeo ni viongozi 5 kwa kila timu.</p>
                        </div>
                      </div>

                      {selectedTeamStaff.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <User size={48} className="text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-bold">Hakuna viongozi wa benchi la ufundi waliopakiwa bado.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {selectedTeamStaff.map(member => (
                            <div key={member.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all relative">
                              <button
                                onClick={() => handleDeleteStaff(member.id)}
                                className="absolute top-2 left-2 p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                title="Futa Kiongozi"
                              >
                                <Trash2 size={14} />
                              </button>
                              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-50 border-2 border-slate-100 mb-3 shrink-0 shadow-inner">
                                {member.photoUrl ? (
                                  <img 
                                    src={member.photoUrl} 
                                    className="w-full h-full object-cover" 
                                    alt={member.name}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                    <User size={32} />
                                  </div>
                                )}
                              </div>
                              <h5 className="font-extrabold text-slate-900 text-sm line-clamp-1">{member.name}</h5>
                              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mt-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                {member.role}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteTeam(selectedTeam.id, selectedTeam.name)}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border border-red-100"
              >
                <Trash2 size={16} />
                <span>Futa Timu Hii Kabisa</span>
              </button>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedTeam(null)}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  Funga
                </button>
                {selectedTeam.paymentStatus === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => {
                        handleApprove(selectedTeam.id, 'REJECTED');
                        setSelectedTeam(null);
                      }} 
                      className="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
                    >
                      Kataa Usajili
                    </button>
                    <button 
                      onClick={() => {
                        handleApprove(selectedTeam.id, 'CONFIRMED');
                        setSelectedTeam(null);
                      }} 
                      className="bg-green-600 text-white hover:bg-green-700 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-100 transition-all"
                    >
                      Thibitisha Timu
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
