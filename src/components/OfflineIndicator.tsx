import React, { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ShieldCheck, WifiOff, ChevronDown, ChevronUp } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [expanded, setExpanded] = useState(false);

  // If online, we don't show the offline banner, or show a subtle status pill in header
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40">
      <div className="rounded-2xl bg-amber-500/95 text-slate-950 p-3 shadow-2xl backdrop-blur-md border border-amber-300/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-950/15 flex items-center justify-center flex-shrink-0">
              <WifiOff className="w-4 h-4 text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>Jammer Safe Mode (Offline)</span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded-full font-semibold">
                  <ShieldCheck className="w-3 h-3" /> 100% Active
                </span>
              </div>
              <p className="text-[11px] text-slate-900 leading-tight">
                Vibration alarms & punch tracking run locally without internet.
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg hover:bg-slate-950/10 text-slate-950"
            aria-label="Toggle details"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-950/15 text-[11px] text-slate-900 space-y-1">
            <p>
              • <strong>Classroom Jammers:</strong> Your phone doesn't need cellular or WiFi to alert you.
            </p>
            <p>
              • <strong>Punch Alarms:</strong> Precise background timers trigger local vibration and synthesized chimes on schedule.
            </p>
            <p>
              • <strong>Storage:</strong> All punch responses are saved in your phone's memory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
