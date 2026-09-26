import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Fingerprint,
  Vibrate,
  Settings,
  WifiOff,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenUpload }) => {
  const { testAlert, settings } = useAttendance();
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* App Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                BioPunch
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              {!isOnline ? (
                <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                  <WifiOff className="w-3 h-3" /> Offline (Jammer Proof)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3 h-3" /> Jammer Ready
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Test Vibration button */}
          <button
            onClick={testAlert}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-750 hover:border-indigo-500 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer active:scale-95"
            title="Test vibration and alert sound"
          >
            <Vibrate className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span className="hidden sm:inline">Test Alert</span>
          </button>

          {/* Quick upload timetable */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-750 hover:border-indigo-500 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Scan or upload timetable image"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Scan Timetable</span>
          </button>

          {/* PWA In-App Install */}
          <PWAInstallButton />

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900 border border-slate-750 hover:border-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
            title="Settings & Vibration Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
