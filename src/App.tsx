import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  LayoutDashboard, 
  LogOut, 
  LogIn, 
  ShieldCheck,
  CreditCard,
  Menu,
  X,
  PlusCircle,
  Home as HomeIcon,
  UserCheck
} from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterTeam from './pages/RegisterTeam';
import TeamDashboard from './pages/TeamDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { cn } from './lib/utils';
import tournamentLogo from './assets/images/tournament_logo_1785243137783.jpg';

function Navbar() {
  const { user, profile, logout, setRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHome = location.pathname === '/';
  const isAdmin = profile?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2.5 py-1">
                <img 
                  src={tournamentLogo} 
                  alt="UMTV CUP 2026 Logo" 
                  className="w-10 h-10 object-contain drop-shadow-md rounded-xl bg-white p-0.5 border border-slate-100" 
                  referrerPolicy="no-referrer" 
                />
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">UMTV CUP 2026</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <Link to="/" className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all", isHome ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50")}>Ratiba na Matokeo</Link>
              <Link to="/register-team" className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all", location.pathname === '/register-team' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50")}>Sajili Timu</Link>
              {user ? (
                <>
                  {/* Role Switcher */}
                  <button
                    onClick={() => setRole(isAdmin ? 'TEAM_MANAGER' : 'ADMIN')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 mr-2 cursor-pointer",
                      isAdmin 
                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
                        : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                    )}
                    title="Badili Jukumu"
                  >
                    <ShieldCheck size={14} />
                    <span>{isAdmin ? 'Meneja (Mchezaji)' : 'Kuwa Admin'}</span>
                  </button>

                  {isAdmin ? (
                    <Link to="/admin" className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all", location.pathname.startsWith('/admin') ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50")}>Admin Panel</Link>
                  ) : (
                    <Link to="/team" className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all", location.pathname.startsWith('/team') ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50")}>Kashibodi la Timu</Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm ml-2"
                  >
                    <LogOut size={16} />
                    <span>Toka</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all ml-2">Ingia hapa</Link>
              )}
            </div>

            {/* Mobile hamburger menu button */}
            <div className="flex md:hidden items-center gap-2">
              {user && (
                <button
                  onClick={() => setRole(isAdmin ? 'TEAM_MANAGER' : 'ADMIN')}
                  className={cn(
                    "px-2.5 py-1.5 rounded-xl font-bold text-[11px] border transition-all flex items-center gap-1",
                    isAdmin ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                  )}
                >
                  <ShieldCheck size={12} />
                  <span>{isAdmin ? 'Admin' : 'Meneja'}</span>
                </button>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-100 bg-white shadow-xl overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2 flex flex-col">
                <Link 
                  to="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn("px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3", isHome ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50")}
                >
                  <HomeIcon size={18} />
                  <span>Ratiba & Matokeo</span>
                </Link>
                <Link 
                  to="/register-team" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn("px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3", location.pathname === '/register-team' ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50")}
                >
                  <PlusCircle size={18} />
                  <span>Sajili Timu Mpya</span>
                </Link>
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        setRole(isAdmin ? 'TEAM_MANAGER' : 'ADMIN');
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2",
                        isAdmin 
                          ? "bg-amber-50 text-amber-700 border-amber-200" 
                          : "bg-indigo-50 text-indigo-700 border-indigo-200"
                      )}
                    >
                      <ShieldCheck size={16} />
                      <span>Badili Mfumo: ({isAdmin ? 'Msimamizi / Admin' : 'Meneja wa Timu'})</span>
                    </button>

                    {isAdmin ? (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn("px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3", location.pathname.startsWith('/admin') ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50")}
                      >
                        <LayoutDashboard size={18} />
                        <span>Admin Panel</span>
                      </Link>
                    ) : (
                      <Link 
                        to="/team" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn("px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3", location.pathname.startsWith('/team') ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50")}
                      >
                        <LayoutDashboard size={18} />
                        <span>Dashibodi ya Timu</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm w-full text-left"
                    >
                      <LogOut size={18} />
                      <span>Toka kwenye Mfumo</span>
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-blue-600 text-white px-5 py-3.5 rounded-xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-center block mt-2"
                  >
                    Ingia Kwenye Mfumo
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Bottom Fixed Nav Bar for easy thumb access */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Link 
          to="/" 
          className={cn(
            "flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all active:scale-95",
            isHome ? "text-blue-600 font-extrabold" : "text-slate-400 font-medium"
          )}
        >
          <HomeIcon size={20} />
          <span className="text-[10px] mt-0.5">Ratiba</span>
        </Link>

        <Link 
          to="/register-team" 
          className={cn(
            "flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all active:scale-95",
            location.pathname === '/register-team' ? "text-blue-600 font-extrabold" : "text-slate-400 font-medium"
          )}
        >
          <PlusCircle size={20} />
          <span className="text-[10px] mt-0.5">Usajili</span>
        </Link>

        {user ? (
          <Link 
            to={isAdmin ? "/admin" : "/team"} 
            className={cn(
              "flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all active:scale-95",
              (location.pathname.startsWith('/team') || location.pathname.startsWith('/admin')) ? "text-blue-600 font-extrabold" : "text-slate-400 font-medium"
            )}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] mt-0.5">{isAdmin ? "Admin" : "Timu"}</span>
          </Link>
        ) : (
          <Link 
            to="/login" 
            className={cn(
              "flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all active:scale-95",
              location.pathname === '/login' ? "text-blue-600 font-extrabold" : "text-slate-400 font-medium"
            )}
          >
            <LogIn size={20} />
            <span className="text-[10px] mt-0.5">Ingia</span>
          </Link>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20 md:pb-16">
          <Navbar />
          <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-10">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register-team" element={<RegisterTeam />} />
                <Route path="/team/*" element={<TeamDashboard />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}
