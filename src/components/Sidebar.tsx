import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ActiveTab } from '../types';
import { 
  LayoutDashboard, 
  UserPlus, 
  Pill, 
  FileCheck, 
  Settings, 
  HeartHandshake,
  LogOut,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, settings } = useClinic();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patient' as ActiveTab, label: 'Patient Information', icon: UserPlus },
    { id: 'medicines' as ActiveTab, label: 'Medicine Entry', icon: Pill },
    { id: 'preview' as ActiveTab, label: 'Document Preview', icon: FileCheck },
    { id: 'settings' as ActiveTab, label: 'Clinic Settings', icon: Settings },
  ];

  return (
    <aside id="clinic-sidebar" className={`
      w-68 bg-slate-900 text-white flex flex-col flex-shrink-0 h-full border-r border-slate-800
      fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
      lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Sidebar Header Brand */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-xl text-white shrink-0">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold tracking-tight text-white line-clamp-1">LHCC Siddha</h1>
          <p className="text-[10px] text-slate-400 uppercase font-medium tracking-widest">Document Suite</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors lg:hidden shrink-0"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 font-semibold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mini Profile / Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <div className="flex items-center gap-3">
          {settings.logo ? (
            <img 
              src={settings.logo} 
              alt="Logo" 
              className="w-9 h-9 object-contain rounded-lg bg-white p-1" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400 border border-slate-700">
              LH
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{settings.name}</p>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Siddha System Active
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            setLoggingOut(true);
            try {
              await logout();
            } finally {
              setLoggingOut(false);
            }
          }}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
};
