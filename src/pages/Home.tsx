import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match, RegistrationPeriod, Team, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestore-errors';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Trophy, 
  MapPin, 
  Search, 
  ArrowRight, 
  Phone, 
  CheckCircle, 
  Users, 
  ShieldCheck,
  Building,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Layers
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [periods, setPeriods] = useState<RegistrationPeriod[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'SCHEDULED' | 'FINISHED'>('ALL');
  const [homeTab, setHomeTab] = useState<'matches' | 'standings'>('matches');

  useEffect(() => {
    // Live Matches
    const q = query(collection(db, 'matches'), orderBy('matchDate', 'asc'));
    const unsubscribeMatches = onSnapshot(q, (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'matches');
    });

    // Active Registration Windows
    const pQ = query(collection(db, 'registrationPeriods'));
    const unsubscribePeriods = onSnapshot(pQ, (snapshot) => {
      setPeriods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegistrationPeriod)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'registrationPeriods');
    });

    // Teams for live stats counting
    const tQ = query(collection(db, 'teams'));
    const unsubscribeTeams = onSnapshot(tQ, (snapshot) => {
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'teams');
    });

    return () => {
      unsubscribeMatches();
      unsubscribePeriods();
      unsubscribeTeams();
    };
  }, []);

  const activePeriod = periods.find(p => p.isActive) || periods[0];

  // Filtered Matches based on search and tab select
  const filteredMatches = matches.filter(match => {
    const matchesSearch = 
      match.homeTeamName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      match.awayTeamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (match.venue && match.venue.toLowerCase().includes(searchQuery.toLowerCase()));

    if (scheduleFilter === 'ALL') return matchesSearch;
    return matchesSearch && match.status === scheduleFilter;
  });

  const faqs = [
    {
      q: "Ninasajili vipi timu yangu kwenye mfumo?",
      a: "Tengeneza akaunti kwa sekunde chache ukitumia Namba yako ya Simu kwenye ukurasa wa 'Ingia'. Baada ya kuingia, bofya 'Sajili Timu', jaza taarifa za timu yako na upakie risiti ya ada ya usajili. Mdhibiti (Admin) atakagua na kuathibitisha usajili wako ndani ya masaa 24."
    },
    {
      q: "Ni wachezaji wangapi ninaweza kuwasajili?",
      a: "Kila timu inaruhusiwa kusajili hadi kiwango cha juu cha wachezaji ishirini na tano (25) na viongozi wa benchi la ufundi/makocha watano (5) ili kuleta usawa na ufanisi."
    },
    {
      q: "Je, ninaweza kuhariri au kubadilisha wachezaji wangu baada ya kusajili?",
      a: "Ndiyo! Mradi dirisha la usajili liko wazi, unaweza kuingia kwenye 'Kashibodi la Timu' yako na kuongeza, kuhariri, au kufuta wachezaji na viongozi wa benchi papo hapo kabla ya usajili kufungwa au kuhakikiwa rasmi."
    },
    {
      q: "Je, ninawezaje kufanya malipo ya ada ya usajili?",
      a: "Tunakubali malipo kupitia mitandao yote ya simu (M-Pesa, Tigo Pesa, Airtel Money). Lipa ada rasmi ya mashindano (Tsh 50,000) kwenda namba yetu ya huduma iliyoainishwa kwenye fomu ya usajili na upakie picha (screenshot) au ujumbe wa muamala kama uthibitisho wa malipo."
    },
    {
      q: "Namba yangu ya simu itakuwa salama?",
      a: "Kabisa. Tunatumia namba ya simu kama kitambulisho chako kikuu cha ulinzi (salama zaidi kuliko barua pepe) na hakuna mtu mwingine anayeweza kuona namba yako au kufikia timu yako bila PIN yako uliyoiweka."
    }
  ];

  return (
    <div className="space-y-16">
      
      {/* 1. Large Portal Hero Section */}
      <section className="relative rounded-[2.5rem] overflow-hidden text-white shadow-2xl bg-gradient-to-tr from-slate-950 via-blue-950 to-slate-900 border border-slate-800">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
          <Trophy size={400} />
        </div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center p-8 md:p-16">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-blue-300 text-xs font-black tracking-widest uppercase">Msimu Mpya 2026 UMEANZA</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-white">
              Soka Usajili <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Pro</span>
            </h1>
            <p className="text-base md:text-lg max-w-xl leading-relaxed text-slate-300">
              Tovuti kuu ya usajili, uratibu na usimamizi wa mechi za ligi za soka Tanzania. Unganisha timu yako, simamia wachezaji wako, na fuatilia ratiba na matokeo mubashara kutoka popote pale.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link
                to="/register-team"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-900/40"
              >
                Sajili Timu Yako Sasa
                <ArrowRight size={16} />
              </Link>
              <a
                href="#ratiba"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-slate-800 text-slate-200 px-8 py-4 rounded-2xl font-bold text-sm transition-all border border-slate-700/65"
              >
                Angalia Ratiba
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            {activePeriod ? (
              <motion.div 
                initial={{ transform: "scale(0.97)", opacity: 0 }}
                animate={{ transform: "scale(1)", opacity: 1 }}
                className="bg-slate-900/90 border border-slate-700/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative"
              >
                <div className="absolute top-4 right-4 bg-green-500/15 border border-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {activePeriod.isActive ? 'Wazi' : 'Kipindi'}
                </div>

                <div className="flex items-center gap-3 mb-4 text-blue-400 font-black uppercase tracking-wider text-xs">
                  <Calendar size={18} />
                  DIRISHA LA USAJILI
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{activePeriod.seasonName}</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Ada ya usajili wa kila timu ni <span className="text-white font-bold">Tsh 50,000</span> tu. Hakikisha unasajili timu yako mapema kabla ya dirisha kufungwa.
                </p>

                <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30 mb-6 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kuanza:</span>
                    <span className="text-white font-bold">{formatDate(activePeriod.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400 font-bold">Mwisho wa usajili:</span>
                    <span className="text-blue-400 font-bold">{formatDate(activePeriod.endDate)}</span>
                  </div>
                </div>

                <Link 
                  to="/register-team"
                  className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all"
                >
                  Sajili Timu Hapa
                </Link>
              </motion.div>
            ) : (
              <div className="bg-slate-900/50 p-8 rounded-3xl text-center border border-slate-800">
                <Trophy size={48} className="mx-auto text-slate-600 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Dirisha la Usajili Limefungwa</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Kwa sasa hakuna dirisha la usajili lililo wazi. Fuatilia ukurasa huu kwa taarifa rasmi za msimu ujao.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Fast Dashboard Dynamic Stats Counters */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3.5 rounded-xl text-blue-600 shrink-0">
            <Trophy size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{teams.filter(t => t.isApproved).length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TIMU THABITI</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3.5 rounded-xl text-emerald-600 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{teams.length * 15 || '150+'}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">WACHEZAJI</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3.5 rounded-xl text-indigo-600 shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{matches.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">RATIBU ZA MECHI</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3.5 rounded-xl text-amber-600 shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">100%</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">UHAKIKI SALAMA</div>
          </div>
        </div>
      </section>

      {/* 3. Jinsi ya Kusajili Timu (Step-by-Step Portal Workflows) */}
      <section className="bg-gradient-to-b from-slate-50 to-white -mx-4 px-4 py-16 md:mx-0 md:px-0 rounded-[2.5rem]">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">Hatua za Usajili wa Timu</h2>
          <p className="text-slate-505 text-sm md:text-base leading-relaxed text-slate-500">
            Soka Pro imerahisisha usajili kuwa mchakato wa kidijitali wa hatua nne pekee unaoweza kufanya kwa dakika 5.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Tengeneza Akaunti",
              desc: "Ingiza namba yako ya simu na PIN rahisi ya siri ili kupata kashibodi yako salama."
            },
            {
              step: "02",
              title: "Sajili Jina la Timu",
              desc: "Andika jina la timu, pakia nembo yake (logo) na weka njia ya malipo uliyotumia kupakua risiti."
            },
            {
              step: "03",
              title: "Weka Wachezaji",
              desc: "Sajili hadi wachezaji 25 pamoja na picha kuhakikisha kitambulisho na jezi maalum."
            },
            {
              step: "04",
              title: "Anza Kushiriki",
              desc: "Baada ya Admin kukamilisha uhakiki, timu yako itaingizwa rasmi kwenye ratiba ya mechi na msimamo."
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-100/80 shadow-sm relative group hover:shadow-md transition-all">
              <span className="absolute top-4 right-4 text-4xl font-black text-slate-100 bg-slate-50 px-2 py-1 rounded">{item.step}</span>
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold mb-6 text-sm">{idx + 1}</div>
              <h3 className="font-bold text-lg text-slate-900 mb-2 leading-snug">{item.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Malipo na Fedha (Payment Instructions Component) */}
      <section className="bg-blue-600 text-white rounded-[2rem] p-8 md:p-12 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <DollarSign size={200} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-2xl md:text-3xl font-black">Mwongozo wa Malipo ya Usajili</h2>
            <p className="text-white/85 text-sm md:text-base leading-relaxed">
              Ada rasmi ya kila timu shiriki kwa msimu mzima ni <span className="underline font-bold">Tsh 50,000 / -</span>. Tafadhali lipa ada hii kwa njia ya simu, na kisha uhakikishe unachukua picha ya ujumbe wa muamala au risiti ya malipo kabla ya kuandika fomu.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <div className="text-xs font-bold uppercase text-blue-200 block mb-1">M-Pesa (Lipa)</div>
                <div className="font-mono text-sm font-bold">Lipa Namba: 5678129</div>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <div className="text-xs font-bold uppercase text-blue-200 block mb-1">Tigo Pesa</div>
                <div className="font-mono text-sm font-bold">Tuma: 0712 345 678</div>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <div className="text-xs font-bold uppercase text-blue-200 block mb-1">Airtel Money</div>
                <div className="font-mono text-sm font-bold">Lipa Namba: 991204</div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-5 bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="font-black text-lg mb-3 flex items-center gap-2 text-white">
              <ShieldCheck size={20} className="text-blue-300" />
              Mambo ya Kuzingatia:
            </h3>
            <ul className="space-y-2 text-xs text-white/90">
              <li className="flex items-start gap-2">
                <span className="bg-white/20 h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" />
                <span>Malipo lazima yafanyike kabla ya kuwasilisha fomu ya usajili wa timu kuzuia fomu yako kukataliwa.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" />
                <span>Pakia risiti safi yenye herufi zinazosomeka vyema ili kusaidia mchakato wa kukagua uwe wa haraka.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" />
                <span>Unaweza kurudishiwa maelezo na maoni kutoka kwa wasimamizi ikiwa malipo yako yana utata.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Schedule & Results Portal Section */}
      <section id="ratiba" className="space-y-8 scroll-mt-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">Kituo cha Ratiba & Msimamo</h2>
              <p className="text-slate-500 text-xs">Fuatilia mechi zote za ligi zilizopangwa na msimamo wa hivi punde wa kila kundi.</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto shadow-inner">
            <button
              onClick={() => setHomeTab('matches')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer",
                homeTab === 'matches' 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Ratiba & Matokeo
            </button>
            <button
              onClick={() => setHomeTab('standings')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer",
                homeTab === 'standings' 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Msimamo wa Makundi
            </button>
          </div>
        </div>

        {homeTab === 'matches' ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: 'ALL', label: 'Zote' },
                  { id: 'SCHEDULED', label: 'Zijazo' },
                  { id: 'FINISHED', label: 'Zilizokwisha' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setScheduleFilter(tab.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer",
                      scheduleFilter === tab.id 
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Custom Search Box */}
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Tafuta kwa timu au uwanja..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-150 transition-all text-slate-800"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="bg-white rounded-3xl py-20 text-center border border-slate-100 shadow-sm">
                <Trophy size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Hakuna mechi zilizopatikana zenye vigezo hivi.</p>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="text-blue-600 hover:underline font-bold text-xs mt-2"
                  >
                    Futa utafutaji
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredMatches.map((match) => (
                  <motion.div
                    key={match.id}
                    layout
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 items-center p-6 md:p-8 gap-4 text-center md:text-left">
                      {/* Home Team */}
                      <div className="md:col-span-4 flex flex-col md:items-end gap-1">
                        <span className="font-extrabold text-lg md:text-2xl text-slate-900 group-hover:text-blue-600 transition-colors">{match.homeTeamName}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">MWENYEJI / NYUMBANI</span>
                      </div>

                      {/* Score / Center Info */}
                      <div className="md:col-span-4 flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/50 md:bg-transparent">
                        <div className="flex items-center gap-6 mb-2">
                          <span className={cn(
                            "text-3xl md:text-5xl font-black tabular-nums tracking-tighter animate-fade-in",
                            match.status === 'FINISHED' ? "text-slate-900" : "text-slate-300"
                          )}>
                            {match.scoreHome ?? '-'}
                          </span>
                          <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest">VS</div>
                          <span className={cn(
                            "text-3xl md:text-5xl font-black tabular-nums tracking-tighter animate-fade-in",
                            match.status === 'FINISHED' ? "text-slate-900" : "text-slate-300"
                          )}>
                            {match.scoreAway ?? '-'}
                          </span>
                        </div>
                        
                        <div className="mt-1">
                          {match.status === 'SCHEDULED' ? (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Imepangwa</span>
                          ) : match.status === 'LIVE' ? (
                            <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-white block animate-ping"></span>
                              MUBASHARA
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Umeisha</span>
                          )}
                        </div>
                      </div>

                      {/* Away Team */}
                      <div className="md:col-span-4 flex flex-col md:items-start gap-1">
                        <span className="font-extrabold text-lg md:text-2xl text-slate-900 group-hover:text-blue-600 transition-colors">{match.awayTeamName}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">GENG / UBALINI</span>
                      </div>
                    </div>

                    {/* Match Footer Info */}
                    <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 text-xs">
                      <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500">
                        <span className="flex items-center gap-2">
                          <Calendar size={14} className="text-blue-500" />
                          <strong className="text-slate-700">{formatDate(match.matchDate)}</strong>
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin size={14} className="text-blue-500" />
                          <span>Uwanja: <strong className="text-slate-700">{match.venue || 'Uwanja haujatajwa'}</strong></span>
                        </span>
                      </div>
                      
                      <div className="text-slate-400 font-mono text-[10px]">
                        ID: {match.id.substring(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Msimamo wa Makundi (Group Standings Component) */
          <div className="grid grid-cols-1 gap-12">
            {['A', 'B', 'C', 'D', 'E', 'F']
              .filter(groupLetter => teams.some(t => t.isApproved && t.group === groupLetter))
              .map(groupLetter => {
                const groupTeams = teams
                  .filter(t => t.isApproved && t.group === groupLetter)
                  .sort((a, b) => {
                    const ptsA = a.points || 0;
                    const ptsB = b.points || 0;
                    if (ptsB !== ptsA) return ptsB - ptsA;

                    const gdA = (a.goalsFor || 0) - (a.goalsAgainst || 0);
                    const gdB = (b.goalsFor || 0) - (b.goalsAgainst || 0);
                    if (gdB !== gdA) return gdB - gdA;

                    return (b.goalsFor || 0) - (a.goalsFor || 0);
                  });

                return (
                  <motion.div
                    key={groupLetter}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white font-black text-sm h-8 w-8 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                          {groupLetter}
                        </div>
                        <h3 className="font-extrabold text-base md:text-lg tracking-tight font-sans">Kundi {groupLetter}</h3>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Msimamo wa Kundi</span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs md:text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] md:text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                            <th className="py-4 px-4 md:px-6 text-center w-16">Nafasi</th>
                            <th className="py-4 px-4">Timu</th>
                            <th className="py-4 px-2 text-center w-12">M (P)</th>
                            <th className="py-4 px-2 text-center w-12">W</th>
                            <th className="py-4 px-2 text-center w-12">D</th>
                            <th className="py-4 px-2 text-center w-12">L</th>
                            <th className="py-4 px-2 text-center w-20">Mabao</th>
                            <th className="py-4 px-2 text-center w-12">GD</th>
                            <th className="py-4 px-4 md:px-6 text-center w-20 text-blue-600 font-black">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium">
                          {groupTeams.map((team, idx) => {
                            const isLeader = idx === 0;
                            const isRunnerUp = idx === 1;
                            const goalDiff = (team.goalsFor || 0) - (team.goalsAgainst || 0);

                            return (
                              <tr 
                                key={team.id} 
                                className={cn(
                                  "hover:bg-slate-50/40 transition-colors",
                                  isLeader ? "bg-emerald-50/5" : ""
                                )}
                              >
                                {/* Position */}
                                <td className="py-4 px-4 md:px-6 text-center">
                                  <span className={cn(
                                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                                    isLeader ? "bg-emerald-100 text-emerald-700" : 
                                    isRunnerUp ? "bg-blue-100 text-blue-700" : 
                                    "text-slate-400"
                                  )}>
                                    {idx + 1}
                                  </span>
                                </td>

                                {/* Team Name */}
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-50 p-1 border border-slate-100 shrink-0 flex items-center justify-center">
                                      {team.logoUrl ? (
                                        <img src={team.logoUrl} className="w-full h-full object-contain" alt="" />
                                      ) : (
                                        <Trophy size={14} className="text-slate-300" />
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-extrabold text-slate-800">{team.name}</span>
                                      {isLeader && (
                                        <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Inaongoza Kundi</span>
                                      )}
                                      {isRunnerUp && (
                                        <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider">Nafasi ya Pili</span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Matches Played */}
                                <td className="py-4 px-2 text-center text-slate-600 font-mono">{team.played || 0}</td>
                                {/* Won */}
                                <td className="py-4 px-2 text-center text-slate-600 font-mono">{team.won || 0}</td>
                                {/* Drawn */}
                                <td className="py-4 px-2 text-center text-slate-600 font-mono">{team.drawn || 0}</td>
                                {/* Lost */}
                                <td className="py-4 px-2 text-center text-slate-600 font-mono">{team.lost || 0}</td>
                                {/* GF : GA */}
                                <td className="py-4 px-2 text-center text-slate-600 font-mono">{team.goalsFor || 0}:{team.goalsAgainst || 0}</td>
                                {/* GD */}
                                <td className={cn(
                                  "py-4 px-2 text-center font-mono font-bold",
                                  goalDiff > 0 ? "text-emerald-600" : goalDiff < 0 ? "text-rose-500" : "text-slate-400"
                                )}>
                                  {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                                </td>
                                {/* Points */}
                                <td className="py-4 px-4 md:px-6 text-center text-blue-600 font-black font-mono text-base bg-blue-50/20">
                                  {team.points || 0}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                );
              })}

            {/* Empty state if no teams assigned to groups */}
            {!['A', 'B', 'C', 'D', 'E', 'F'].some(groupLetter => teams.some(t => t.isApproved && t.group === groupLetter)) && (
              <div className="bg-white rounded-[2rem] py-16 text-center border border-slate-105 border-slate-100 shadow-sm max-w-md mx-auto">
                <Layers size={48} className="mx-auto text-slate-300 mb-3" />
                <h4 className="text-slate-800 font-bold text-base mb-1 font-sans">Msimamo Bado Haujaandaliwa</h4>
                <p className="text-slate-500 text-xs leading-relaxed px-6">
                  Wasimamizi wa ligi bado hawajapanga timu kwenye makundi. Endelea kufuatilia ukurasa huu kwa sasisho hivi punde!
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 6. Advanced FAQ Accordion Component */}
      <section className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-100 shadow-sm max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <HelpCircle size={36} className="text-blue-600 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Maswali Yanayoulizwa Mara kwa Mara </h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Majibu ya haraka kwa changamoto za mara kwa mara kuhusu mchakato wa usajili na ratiba.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className={cn(
                  "border rounded-2xl transition-all overflow-hidden",
                  isOpen ? "border-blue-500 bg-blue-50/15" : "border-slate-100 hover:border-slate-200"
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-extrabold text-slate-800 text-sm md:text-base focus:outline-none cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp size={18} className="text-blue-600" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100/60 bg-white"
                    >
                      <div className="p-5 text-slate-600 text-xs md:text-sm leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-[2rem] p-8 md:p-12 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-xl md:text-2xl font-black mb-1">Una timu na bado hujaichelewesha?</h2>
          <p className="text-slate-400 text-[11px] md:text-xs">Sajili leo upate nafasi ya kuonekana katika Tanzania nzima kupitia mfumo wetu wa digitali.</p>
        </div>
        <Link 
          to="/register-team"
          className="w-full md:w-auto text-center shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-8 py-3.5 rounded-xl transition-all"
        >
          Sajili Timu Yako Sasa
        </Link>
      </section>

      {/* 8. Web Footer Directory */}
      <footer className="border-t border-slate-200/80 pt-10 pb-4 text-center text-slate-400 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Trophy size={14} />
              </div>
              <span className="font-extrabold text-slate-800">Soka Pro TZ</span>
            </div>
            <p className="text-[11px] leading-relaxed">Mfumo rasmi na wa kuaminika nchini Tanzania kwa ajili ya usajili wa viongozi, klabu, wachezaji na miamala sahihi ya ligi.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-3">Msaada na Mawasiliano</h4>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center gap-1.5"><Phone size={12} /> +255 688 092 015</li>
              <li className="flex items-center gap-1.5"><Building size={12} /> Tanga, Tanzania</li>
              <li className="flex items-center gap-1.5">Barua Pepe: chreesonlinemedia@gmail.com</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-3">Sheria na Kanuni</h4>
            <p className="text-[11px] leading-relaxed">Timu zote lazima zifuate maadili sahihi ya soka na sheria za usajili za nchi, kuzuia faini au kutoingizwa kwenye msimamo wa mashindano rasmi.</p>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-6 text-[11px] text-center">
          &copy; {new Date().getFullYear()} Soka Pro. Imetengenezwa na tanga360media.
        </div>
      </footer>

    </div>
  );
}

