import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2,
  Edit3,
  CalendarPlus,
  Search,
  Filter,
  Check,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'approvals' | 'players' | 'periods' | 'matches' | 'groups'>('approvals');
  const [approvalFilter, setApprovalFilter] = useState<'PENDING' | 'CONFIRMED' | 'REJECTED'>('PENDING');
  const [periods, setPeriods] = useState<RegistrationPeriod[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  // Tournament-wide Players & Staff State
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerTeamFilter, setPlayerTeamFilter] = useState('ALL');
  const [playerPositionFilter, setPlayerPositionFilter] = useState('ALL');
  
  // Master PDF Export Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfExportTeamId, setPdfExportTeamId] = useState('ALL');
  const [pdfExportLayout, setPdfExportLayout] = useState<'table' | 'cards'>('table');
  const [pdfIncludeStaff, setPdfIncludeStaff] = useState(true);
  const [pdfOnlyApprovedTeams, setPdfOnlyApprovedTeams] = useState(false);

  // Period Form
  const [seasonName, setSeasonName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Period Extension / Edit State
  const [editingPeriod, setEditingPeriod] = useState<RegistrationPeriod | null>(null);
  const [editSeasonName, setEditSeasonName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  
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

  const handlePrintTournamentPlayers = (
    targetTeamId: string = pdfExportTeamId,
    layout: 'table' | 'cards' = pdfExportLayout,
    includeStaff: boolean = pdfIncludeStaff,
    onlyApproved: boolean = pdfOnlyApprovedTeams
  ) => {
    let targetTeams = [...teams];
    if (targetTeamId !== 'ALL') {
      targetTeams = targetTeams.filter(t => t.id === targetTeamId);
    }
    if (onlyApproved) {
      targetTeams = targetTeams.filter(t => t.isApproved || t.paymentStatus === 'CONFIRMED');
    }

    // Sort teams alphabetically
    targetTeams.sort((a, b) => a.name.localeCompare(b.name));

    const totalFilteredPlayers = allPlayers.filter(p => targetTeams.some(t => t.id === p.teamId));
    const totalFilteredStaff = allStaff.filter(s => targetTeams.some(t => t.id === s.teamId));

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Tafadhali ruhusu Pop-ups (Dirisha ibukizi) kwenye kivinjari chako ili kupakua orodha hii kama PDF.");
      return;
    }

    const teamsSectionsHtml = targetTeams.map((team, tIdx) => {
      const teamPlayers = allPlayers.filter(p => p.teamId === team.id);
      const teamStaffList = allStaff.filter(s => s.teamId === team.id);

      // Sort players by jersey number
      teamPlayers.sort((a, b) => (Number(a.jerseyNumber) || 999) - (Number(b.jerseyNumber) || 999));

      let playersContentHtml = '';

      if (layout === 'table') {
        playersContentHtml = `
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; page-break-inside: auto;">
            <thead>
              <tr style="background: #1e3a8a; color: #ffffff; text-align: left;">
                <th style="padding: 8px 6px; width: 35px; text-align: center; border: 1px solid #1e3a8a;">#</th>
                <th style="padding: 8px 6px; width: 45px; text-align: center; border: 1px solid #1e3a8a;">Picha</th>
                <th style="padding: 8px 10px; border: 1px solid #1e3a8a;">Jina Kamili la Mchezaji</th>
                <th style="padding: 8px 6px; width: 60px; text-align: center; border: 1px solid #1e3a8a;">Jezi</th>
                <th style="padding: 8px 8px; width: 110px; border: 1px solid #1e3a8a;">Nafasi</th>
                <th style="padding: 8px 8px; width: 110px; border: 1px solid #1e3a8a;">Namba ya Kitambulisho</th>
                <th style="padding: 8px 8px; width: 90px; text-align: center; border: 1px solid #1e3a8a;">Saini / Ukaguzi</th>
              </tr>
            </thead>
            <tbody>
              ${teamPlayers.length > 0 ? teamPlayers.map((p, pIdx) => `
                <tr style="background: ${pIdx % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid;">
                  <td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #64748b;">${pIdx + 1}</td>
                  <td style="padding: 4px; text-align: center; border: 1px solid #cbd5e1;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; background: #e2e8f0; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                      ${p.photoUrl ? `<img src="${p.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span style="font-size: 8px; font-weight: bold; color: #64748b;">-</span>`}
                    </div>
                  </td>
                  <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;">${p.name}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 900; color: #2563eb; font-size: 12px;">${p.jerseyNumber ? `#${p.jerseyNumber}` : '-'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">${p.position || 'Haikutajwa'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 10px; color: #64748b; font-family: monospace;">${p.idNumber || '-'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">
                    <div style="border-bottom: 1px dotted #94a3b8; height: 16px;"></div>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" style="padding: 12px; text-align: center; color: #94a3b8; font-style: italic; border: 1px solid #cbd5e1;">Hakuna wachezaji waliosajiliwa kwenye timu hii bado.</td>
                </tr>
              `}
            </tbody>
          </table>
        `;
      } else {
        playersContentHtml = `
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; page-break-inside: auto;">
            ${teamPlayers.length > 0 ? teamPlayers.map((p) => `
              <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center; background: #ffffff; page-break-inside: avoid;">
                <div style="width: 58px; height: 58px; margin: 0 auto 6px; border-radius: 50%; overflow: hidden; background: #f1f5f9; border: 2px solid #94a3b8;">
                  ${p.photoUrl ? `<img src="${p.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="padding-top: 18px; color: #94a3b8; font-size: 8px; font-weight: bold;">BILA PICHA</div>`}
                </div>
                <div style="font-weight: 800; font-size: 11px; color: #0f172a; line-height: 1.2;">${p.name}</div>
                <div style="font-size: 10px; color: #2563eb; font-weight: bold; margin-top: 3px;">
                  ${p.jerseyNumber ? `#${p.jerseyNumber}` : ''} ${p.position ? `&bull; ${p.position}` : ''}
                </div>
                ${p.idNumber ? `<div style="font-size: 8px; color: #64748b; margin-top: 2px;">ID: ${p.idNumber}</div>` : ''}
              </div>
            `).join('') : '<p style="grid-column: span 4; font-size: 11px; color: #94a3b8; font-style: italic; padding: 10px; text-align: center;">Hakuna wachezaji waliosajiliwa kwenye timu hii.</p>'}
          </div>
        `;
      }

      let staffSectionHtml = '';
      if (includeStaff && teamStaffList.length > 0) {
        staffSectionHtml = `
          <div style="margin-top: 12px; page-break-inside: avoid;">
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Benchi la Ufundi / Viongozi (${teamStaffList.length}):</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              ${teamStaffList.map(s => `
                <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; background: #f8fafc; display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; background: #e2e8f0; shrink-0;">
                    ${s.photoUrl ? `<img src="${s.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="width:100%;height:100%;background:#cbd5e1;"></div>`}
                  </div>
                  <div style="overflow: hidden;">
                    <div style="font-weight: 800; font-size: 10px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}</div>
                    <div style="font-size: 9px; color: #059669; font-weight: bold;">${s.role}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      return `
        <div style="margin-bottom: 24px; page-break-inside: auto; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; background: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${team.logoUrl ? `<img src="${team.logoUrl}" style="width: 36px; height: 36px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0; padding: 2px;" />` : `<div style="width: 36px; height: 36px; background: #eff6ff; border-radius: 6px; border: 1px solid #bfdbfe; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; color: #1e3a8a;">${tIdx + 1}</div>`}
              <div>
                <h3 style="margin: 0; font-size: 15px; font-weight: 900; color: #0f172a; text-transform: uppercase;">${team.name}</h3>
                <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                  ${team.group ? `<strong>Kundi ${team.group}</strong> &bull; ` : ''}
                  Hali: <strong style="color: ${team.paymentStatus === 'CONFIRMED' ? '#16a34a' : '#d97706'};">${team.paymentStatus === 'CONFIRMED' ? 'IMETHIBITISHWA' : 'INASUBIRI'}</strong> &bull;
                  Usajili ID: #${team.id.substring(0, 8).toUpperCase()}
                </div>
              </div>
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 20px;">
              ${teamPlayers.length} Wachezaji
            </div>
          </div>

          ${playersContentHtml}
          ${staffSectionHtml}
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="sw">
        <head>
          <meta charset="UTF-8">
          <title>ORODHA YA WACHEZAJI WOTE - UMTV CUP 2026</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 15px; color: #0f172a; background: #ffffff; }
            .no-print { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #cbd5e1; }
            .btn-print { background: #2563eb; color: #ffffff; border: none; padding: 10px 22px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
            .btn-print:hover { background: #1d4ed8; }
            
            .header-banner { text-align: center; border-bottom: 3px double #1e3a8a; padding-bottom: 12px; margin-bottom: 18px; }
            .header-banner h1 { margin: 0; font-size: 22px; font-weight: 900; color: #1e3a8a; letter-spacing: 1.5px; }
            .header-banner h2 { margin: 4px 0 0; font-size: 13px; color: #2563eb; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
            
            .stats-bar { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-bottom: 20px; text-align: center; }
            .stats-item { font-size: 11px; color: #475569; }
            .stats-item strong { display: block; font-size: 16px; color: #0f172a; font-weight: 900; margin-top: 2px; }

            .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px; padding-top: 15px; border-top: 2px solid #cbd5e1; page-break-inside: avoid; }
            .sig-box { text-align: center; }
            .sig-line { border-bottom: 2px solid #334155; height: 35px; margin-bottom: 6px; }
            .sig-title { font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase; }

            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <div>
              <strong style="color: #0f172a; font-size: 14px;">Ripoti Rasmi ya Wachezaji Waliosajiliwa</strong>
              <div style="font-size: 11px; color: #64748b;">Unaweza kuchapisha moja kwa moja au kuhifadhi kama faili la PDF (Save as PDF).</div>
            </div>
            <button class="btn-print" onclick="window.print()">
              🖨️ Pakua / Chapisha PDF
            </button>
          </div>

          <div class="header-banner">
            <h1>UMTV CUP 2026</h1>
            <h2>ORODHA RASMI YA WACHEZAJI NA BENCHI LA UFUNDI</h2>
            <div style="font-size: 10px; color: #64748b; margin-top: 6px; font-weight: 600;">
              Imetolewa Rasmi na Kamati Kuu ya Uendeshaji Mashindano &bull; Tarehe: ${new Date().toLocaleDateString('sw-TZ', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div class="stats-bar">
            <div class="stats-item">
              Jumla ya Timu
              <strong>${targetTeams.length}</strong>
            </div>
            <div class="stats-item">
              Jumla ya Wachezaji
              <strong style="color: #2563eb;">${totalFilteredPlayers.length}</strong>
            </div>
            <div class="stats-item">
              Benchi la Ufundi
              <strong style="color: #059669;">${totalFilteredStaff.length}</strong>
            </div>
            <div class="stats-item">
              Muundo wa Orodha
              <strong>${layout === 'table' ? 'Jedwali Rasmi la Ukaguzi' : 'Kadi za Picha'}</strong>
            </div>
          </div>

          ${teamsSectionsHtml}

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-title">Mratibu Mkuu wa Mashindano</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-title">Mkuu wa Kamati ya Waamuzi</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-title">Mwenyekiti Kamati ya Usajili</div>
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

    const unsubPlayers = onSnapshot(collection(db, 'players'), (snap) => {
      setAllPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Player)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'players');
    });

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
      setAllStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'staff');
    });

    return () => {
      unsubTeams();
      unsubPeriods();
      unsubMatches();
      unsubPlayers();
      unsubStaff();
    };
  }, []);

  const filteredAllPlayers = useMemo(() => {
    return allPlayers.filter(player => {
      // Search query match
      if (playerSearchQuery.trim()) {
        const q = playerSearchQuery.toLowerCase();
        const matchName = player.name?.toLowerCase().includes(q);
        const matchJersey = String(player.jerseyNumber || '').includes(q);
        const matchPosition = player.position?.toLowerCase().includes(q);
        const matchId = player.idNumber?.toLowerCase().includes(q);
        const team = teams.find(t => t.id === player.teamId);
        const matchTeam = team?.name?.toLowerCase().includes(q);
        if (!matchName && !matchJersey && !matchPosition && !matchId && !matchTeam) {
          return false;
        }
      }

      // Team Filter
      if (playerTeamFilter !== 'ALL' && player.teamId !== playerTeamFilter) {
        return false;
      }

      // Position Filter
      if (playerPositionFilter !== 'ALL' && player.position !== playerPositionFilter) {
        return false;
      }

      return true;
    });
  }, [allPlayers, playerSearchQuery, playerTeamFilter, playerPositionFilter, teams]);

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

  const handleOpenExtendModal = (period: RegistrationPeriod) => {
    setEditingPeriod(period);
    setEditSeasonName(period.seasonName || '');
    setEditStartDate(period.startDate || '');
    setEditEndDate(period.endDate || '');
    setEditIsActive(period.isActive ?? true);
  };

  const handleQuickExtend = (days: number) => {
    let baseDate = editEndDate ? new Date(editEndDate) : new Date();
    if (isNaN(baseDate.getTime())) {
      baseDate = new Date();
    }
    const targetDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    const offset = targetDate.getTimezoneOffset() * 60000;
    const localIso = new Date(targetDate.getTime() - offset).toISOString().slice(0, 16);
    setEditEndDate(localIso);
    setEditIsActive(true);
  };

  const handleUpdatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod) return;
    try {
      await updateDoc(doc(db, 'registrationPeriods', editingPeriod.id), {
        seasonName: editSeasonName,
        startDate: editStartDate,
        endDate: editEndDate,
        isActive: editIsActive
      });
      setEditingPeriod(null);
      alert('Muda wa dirisha la usajili umesasishwa na kuongezwa kikamilifu!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registrationPeriods/${editingPeriod.id}`);
    }
  };

  const handleTogglePeriodActive = async (period: RegistrationPeriod) => {
    try {
      await updateDoc(doc(db, 'registrationPeriods', period.id), {
        isActive: !period.isActive
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registrationPeriods/${period.id}`);
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
      {/* Admin Top Header Banner with Master Stats & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="bg-blue-600 p-3.5 rounded-2xl text-white shadow-lg shadow-blue-200 shrink-0">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Panel ya Utawala (Admin)</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Usimamizi kamili wa mashindano, wachezaji, madirisha ya usajili na ratiba za UMTV CUP
            </p>
          </div>
        </div>

        {/* Master PDF Download Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setPdfExportTeamId('ALL');
              setPdfModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-blue-200 transition-all cursor-pointer active:scale-95 shrink-0"
            title="Pakua orodha kamili ya wachezaji wote waliosajiliwa kwenye mashindano katika PDF"
          >
            <Download size={18} />
            <span>Pakua Orodha ya Wachezaji Wote (PDF)</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:mx-0 md:px-0">
        {[
          { id: 'approvals', label: 'Uthibitisho', icon: CheckCircle, count: teams.filter(t => t.paymentStatus === 'PENDING').length },
          { id: 'players', label: 'Wachezaji Wote', icon: Users, count: allPlayers.length },
          { id: 'periods', label: 'Madirisha', icon: Calendar, count: periods.length },
          { id: 'matches', label: 'Ratiba', icon: Trophy, count: matches.length },
          { id: 'groups', label: 'Makundi & Msimamo', icon: Layers }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 md:px-5 py-3 rounded-xl font-bold transition-all shrink-0 text-xs sm:text-sm border border-slate-100 shadow-sm",
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                : "bg-white text-slate-500 hover:text-slate-900"
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-black",
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {tab.count}
              </span>
            )}
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

        {/* Tab ya Wachezaji Wote (All Players Directory) */}
        {activeTab === 'players' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header & Master Controls */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Users className="text-blue-600" size={24} />
                    <span>Orodha ya Wachezaji Wote Waliosajiliwa</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Jumla ya wachezaji <strong className="text-blue-600 font-black">{allPlayers.length}</strong> kutoka timu <strong className="text-slate-800 font-black">{teams.length}</strong> zilizosajiliwa kwenye mashindano.
                  </p>
                </div>

                {/* PDF Export Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => {
                      setPdfExportTeamId(playerTeamFilter);
                      setPdfExportLayout('table');
                      setPdfModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-200 transition-all cursor-pointer active:scale-95"
                    title="Pakua Jedwali Rasmi la Ukaguzi wa Mechi katika PDF"
                  >
                    <Printer size={16} />
                    <span>Pakua Orodha (PDF)</span>
                  </button>

                  <button
                    onClick={() => handlePrintTournamentPlayers(playerTeamFilter, 'table', true, false)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors"
                    title="Chapisha / Pakua Papo Hapo Jedwali la Ukaguzi"
                  >
                    <FileText size={15} />
                    <span className="hidden sm:inline">Jedwali la Mechi</span>
                  </button>

                  <button
                    onClick={() => handlePrintTournamentPlayers(playerTeamFilter, 'cards', true, false)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors"
                    title="Chapisha / Pakua Papo Hapo Kadi za Picha"
                  >
                    <Layers size={15} />
                    <span className="hidden sm:inline">Kadi za Picha</span>
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search Bar */}
                <div className="relative lg:col-span-2">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tafuta mchezaji, jezi #, ID au jina la timu..."
                    value={playerSearchQuery}
                    onChange={e => setPlayerSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm font-medium transition-all"
                  />
                  {playerSearchQuery && (
                    <button
                      onClick={() => setPlayerSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Team Filter */}
                <div className="space-y-1">
                  <select
                    value={playerTeamFilter}
                    onChange={e => setPlayerTeamFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="ALL">Timu Zote ({teams.length})</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Position Filter */}
                <div className="space-y-1">
                  <select
                    value={playerPositionFilter}
                    onChange={e => setPlayerPositionFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="ALL">Nafasi Zote</option>
                    <option value="Golikipa">Golikipa</option>
                    <option value="Beki">Beki</option>
                    <option value="Kiungo">Kiungo</option>
                    <option value="Mshambuliaji">Mshambuliaji</option>
                  </select>
                </div>
              </div>

              {/* Filter indicators */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>
                  Inaonyesha wachezaji <strong className="text-slate-900 font-bold">{filteredAllPlayers.length}</strong> kati ya <strong className="text-slate-900 font-bold">{allPlayers.length}</strong>
                </span>
                {(playerSearchQuery || playerTeamFilter !== 'ALL' || playerPositionFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setPlayerSearchQuery('');
                      setPlayerTeamFilter('ALL');
                      setPlayerPositionFilter('ALL');
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Futa Vichujio (Reset)
                  </button>
                )}
              </div>
            </div>

            {/* Players Grid Display */}
            {filteredAllPlayers.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                <Users size={48} className="text-slate-300 mx-auto" />
                <h4 className="font-extrabold text-slate-800 text-base">Hakuna wachezaji waliopatikana</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {allPlayers.length === 0 
                    ? "Bado hakuna wachezaji waliosajiliwa na timu yoyote kwenye mashindano."
                    : "Hakuna mchezaji anayelingana na utafutaji wako. Jaribu kubadilisha jina au vichujio vya timu na nafasi."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {filteredAllPlayers.map((player) => {
                  const team = teams.find(t => t.id === player.teamId);
                  return (
                    <div 
                      key={player.id} 
                      className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center relative group"
                    >
                      {/* Jersey Badge */}
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                        #{player.jerseyNumber || '-'}
                      </div>

                      {/* Delete Quick Action */}
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="absolute top-2 left-2 p-1.5 rounded-lg bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        title="Futa Mchezaji"
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* Photo Thumbnail */}
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-50 border-2 border-slate-200 mb-2.5 shrink-0 shadow-inner">
                        {player.photoUrl ? (
                          <img 
                            src={player.photoUrl} 
                            alt={player.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                            <User size={26} />
                          </div>
                        )}
                      </div>

                      {/* Player Info */}
                      <h5 className="font-black text-slate-900 text-xs line-clamp-1 w-full" title={player.name}>
                        {player.name}
                      </h5>

                      {/* Position */}
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider mt-0.5">
                        {player.position || 'Mchezaji'}
                      </span>

                      {/* Team Name with Icon */}
                      <div className="mt-2 pt-2 border-t border-slate-100 w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-600 font-bold">
                        {team?.logoUrl ? (
                          <img src={team.logoUrl} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                        ) : (
                          <Trophy size={11} className="text-amber-500 shrink-0" />
                        )}
                        <span className="truncate max-w-[90px]">{team?.name || 'Timu'}</span>
                      </div>

                      {player.idNumber && (
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                          ID: {player.idNumber}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
               <h3 className="text-xl font-bold flex items-center justify-between">
                 <span>Madirisha ya Usajili</span>
                 <span className="text-xs font-normal text-slate-500">Orodha na Udhibiti wa Muda</span>
               </h3>

               {periods.length === 0 ? (
                 <div className="p-8 bg-white rounded-2xl border border-slate-100 text-center text-slate-400 font-medium">
                   Hakuna madirisha ya usajili yaliyoundwa bado.
                 </div>
               ) : (
                 periods.map(p => (
                   <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-base">{p.seasonName}</h4>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                            p.isActive ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                          )}>
                            {p.isActive ? 'INAFANYA KAZI (WAZI)' : 'IMEISHA / IMEFUNGIWA'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                          <Clock size={14} className="text-blue-500 shrink-0" />
                          <span>{p.startDate ? new Date(p.startDate).toLocaleString('sw-TZ') : 'N/A'} — <strong className="text-blue-600">{p.endDate ? new Date(p.endDate).toLocaleString('sw-TZ') : 'N/A'}</strong></span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleOpenExtendModal(p)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all border border-blue-200 flex items-center gap-1.5 shadow-sm active:scale-95"
                          title="Ongeza Muda au Hariri Tarehe za Usajili"
                        >
                          <CalendarPlus size={15} />
                          <span>Ongeza Muda / Hariri</span>
                        </button>

                        <button
                          onClick={() => handleTogglePeriodActive(p)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-bold transition-all border active:scale-95",
                            p.isActive
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          )}
                          title={p.isActive ? "Funga Dirisha" : "Fungua/Washa Dirisha"}
                        >
                          {p.isActive ? "Funga Dirisha" : "Washa Dirisha"}
                        </button>

                        <button
                          onClick={() => handleDeletePeriod(p.id)}
                          className="p-2 rounded-xl text-red-500 bg-red-50 hover:bg-red-600 hover:text-white transition-colors border border-red-100"
                          title="Futa Dirisha"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                   </div>
                 ))
               )}
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

      {/* Modal ya Kurefusha / Kuongeza Muda wa Usajili */}
      {editingPeriod && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2 text-blue-600">
                <CalendarPlus size={22} />
                <h3 className="font-extrabold text-slate-900 text-lg">Ongeza Muda wa Usajili</h3>
              </div>
              <button onClick={() => setEditingPeriod(null)} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdatePeriod} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Jina la Msimu / Dirisha</label>
                <input
                  required
                  type="text"
                  value={editSeasonName}
                  onChange={e => setEditSeasonName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tarehe ya Kuanza</label>
                  <input
                    required
                    type="datetime-local"
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">
                    <span>Tarehe Mpya ya Mwisho</span>
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={editEndDate}
                    onChange={e => setEditEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-500 bg-blue-50/30 font-bold text-blue-900 text-xs"
                  />
                </div>
              </div>

              {/* Quick extension shortcuts */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-black uppercase text-slate-600 block">Vifungo vya Haraka vya Kuongeza Muda:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickExtend(3)}
                    className="px-3 py-2 bg-white hover:bg-blue-600 hover:text-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm active:scale-95"
                  >
                    + Siku 3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExtend(7)}
                    className="px-3 py-2 bg-white hover:bg-blue-600 hover:text-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm active:scale-95"
                  >
                    + Wiki 1 (7)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExtend(14)}
                    className="px-3 py-2 bg-white hover:bg-blue-600 hover:text-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm active:scale-95"
                  >
                    + Wiki 2 (14)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExtend(30)}
                    className="px-3 py-2 bg-white hover:bg-blue-600 hover:text-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm active:scale-95"
                  >
                    + Mwezi 1 (30)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={e => setEditIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editIsActive" className="text-sm font-bold text-slate-800 cursor-pointer">
                  Washa Dirisha hili la Usajili (Inafanya kazi)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
                >
                  Ghaili
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md active:scale-95 transition-all"
                >
                  Hifadhi & Ongeza Muda
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal ya Kupakua PDF ya Wachezaji Wote */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 relative"
          >
            {/* Close button */}
            <button
              onClick={() => setPdfModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                <Download size={26} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Pakua Orodha ya Wachezaji (PDF)</h3>
                <p className="text-xs text-slate-500 font-medium">UMTV CUP 2026 - Orodha Rasmi ya Mashindano</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Filter Timu */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Chagua Timu:
                </label>
                <select
                  value={pdfExportTeamId}
                  onChange={e => setPdfExportTeamId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                >
                  <option value="ALL">Timu Zote kwenye Mashindano ({teams.length} Timu)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({allPlayers.filter(p => p.teamId === t.id).length} Wachezaji)</option>
                  ))}
                </select>
              </div>

              {/* Mtindo wa PDF (Layout) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Muundo / Mtindo wa PDF:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPdfExportLayout('table')}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer",
                      pdfExportLayout === 'table'
                        ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <FileText size={18} className={pdfExportLayout === 'table' ? 'text-blue-600' : 'text-slate-400'} />
                      {pdfExportLayout === 'table' && <CheckCircle size={16} className="text-blue-600" />}
                    </div>
                    <span className="font-extrabold text-xs mt-1">Jedwali Rasmi</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Inafaa kwa ukaguzi wa mechi na marefa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPdfExportLayout('cards')}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer",
                      pdfExportLayout === 'cards'
                        ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Layers size={18} className={pdfExportLayout === 'cards' ? 'text-blue-600' : 'text-slate-400'} />
                      {pdfExportLayout === 'cards' && <CheckCircle size={16} className="text-blue-600" />}
                    </div>
                    <span className="font-extrabold text-xs mt-1">Kadi zenye Picha</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Inaonyesha picha na namba za jezi</span>
                  </button>
                </div>
              </div>

              {/* Chaguzi za Ziada (Checkboxes) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={pdfIncludeStaff}
                    onChange={e => setPdfIncludeStaff(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Jumuisha pia Benchi la Ufundi / Viongozi wa Timu</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={pdfOnlyApprovedTeams}
                    onChange={e => setPdfOnlyApprovedTeams(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Timu zilizothibitishwa pekee (Confirmed Teams)</span>
                </label>
              </div>

              {/* Summary badge */}
              <div className="text-center text-xs text-slate-500 bg-blue-50/50 py-2.5 px-4 rounded-xl border border-blue-100/50 font-medium">
                📄 Faili la PDF litafunguka kwenye dirisha jipya la printi tayari kwa kuhifadhi (Save as PDF) au kuchapisha.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPdfModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Ghaili
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrintTournamentPlayers(pdfExportTeamId, pdfExportLayout, pdfIncludeStaff, pdfOnlyApprovedTeams);
                  setPdfModalOpen(false);
                }}
                className="flex-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={16} />
                <span>Fungua &amp; Pakua PDF</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
