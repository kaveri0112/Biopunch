import React from 'react';
import { Home, Calendar, ClipboardCheck, Sparkles } from 'lucide-react';

export type NavTab = 'dashboard' | 'timetable' | 'records';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenUpload: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenUpload,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px]">Today</span>
        </button>

        <button
          onClick={() => onSelectTab('timetable')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
            currentTab === 'timetable'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[11px]">Timetable</span>
        </button>

        <button
          onClick={() => onSelectTab('records')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
            currentTab === 'records'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          <span className="text-[11px]">Records</span>
        </button>
      </div>
    </nav>
  );
};
