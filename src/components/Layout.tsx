import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Settings, 
  LogOut, 
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Study Mode', path: '/study' },
    { icon: GraduationCap, label: 'Mock Exams', path: '/exam/mock' },
  ];

  if (isAdmin) {
    navItems.push({ icon: Settings, label: 'Admin', path: '/admin' });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">MedPrep</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                location.pathname === item.path 
                  ? "bg-primary/10 text-primary" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{profile?.displayName || 'Student Doctor'}</p>
                <p className="text-xs text-slate-500 truncate">{profile?.targetExam || 'No Exam Selected'}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-danger hover:bg-danger/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg">MedPrep</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="absolute right-0 top-0 bottom-0 w-3/4 bg-white p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4 pt-12">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-lg",
                      location.pathname === item.path 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-slate-600"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-6">
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-4 text-danger font-bold text-lg"
                >
                  <LogOut className="w-6 h-6" /> Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
