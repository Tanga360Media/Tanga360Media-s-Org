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
  X
} from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterTeam from './pages/RegisterTeam';
import TeamDashboard from './pages/TeamDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { cn } from './lib/utils';

function Navbar() {
  const { user, profile, logout } = useAuth();
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
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
                <Trophy size={20} />
              </div>
              <span className="text-lg font-black text-slate-900 tracking-tight">Soka Pro</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all", isHome ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50")}>Ratiba na Matokeo</Link>
            <Link to="/register-team" className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all", location.pathname === '/register-team' ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50")}>Sajili Timu</Link>
            {user ? (
              <>
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
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
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
            className="md:hidden border-t border-slate-100 bg-white shadow-lg overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2 flex flex-col">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-xl font-bold text-sm transition-all block", isHome ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50")}
              >
                Ratiba na Matokeo
              </Link>
              <Link 
                to="/register-team" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn("px-4 py-2.5 rounded-xl font-bold text-sm transition-all block", location.pathname === '/register-team' ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50")}
              >
                Sajili Timu Mpya
              </Link>
              {user ? (
                <>
                  {isAdmin ? (
                    <Link 
                      to="/admin" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn("px-4 py-2.5 rounded-xl font-bold text-sm transition-all block", location.pathname.startsWith('/admin') ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50")}
                    >
                      Admin Panel
                    </Link>
                  ) : (
                    <Link 
                      to="/team" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn("px-4 py-2.5 rounded-xl font-bold text-sm transition-all block", location.pathname.startsWith('/team') ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50")}
                    >
                      Kashibodi la Timu
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm w-full text-left"
                  >
                    <LogOut size={16} />
                    <span>Toka (Sajili Upya)</span>
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-center block"
                >
                  Ingia Kwenye System
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-12 md:pb-16">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
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
