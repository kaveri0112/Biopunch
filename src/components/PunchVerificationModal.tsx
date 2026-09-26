import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  Fingerprint,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  BellRing,
  MapPin,
  User,
  Sparkles,
} from 'lucide-react';

export const PunchVerificationModal: React.FC = () => {
  const { activePrompt, recordPunch, snoozePrompt, dismissPrompt } = useAttendance();
  const [showExcuseInput, setShowExcuseInput] = useState(false);
  const [excuseNote, setExcuseNote] = useState('');

  if (!activePrompt) return null;

  const { lecture, type, scheduledTime } = activePrompt;
  const isPunchIn = type === 'punch-in';

  const handlePunched = () => {
    recordPunch(lecture, type, 'punched');
  };

  const handleMissed = () => {
    recordPunch(lecture, type, 'missed');
  };

  const handleExcused = () => {
    recordPunch(
      lecture,
      type,
      'excused',
      excuseNote.trim() || 'Biometric machine error / gate pass'
    );
    setShowExcuseInput(false);
    setExcuseNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-indigo-500/50 p-6 shadow-2xl shadow-indigo-500/20 text-slate-100 flex flex-col relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header alert icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <BellRing className="w-3.5 h-3.5 animate-bounce" />
            <span>Biometric Alarm</span>
          </div>
          <button
            onClick={dismissPrompt}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition"
          >
            Dismiss
          </button>
        </div>

        {/* Big Fingerprint Visual */}
        <div className="flex flex-col items-center text-center my-2">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
              <Fingerprint className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-slate-900 shadow">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            {isPunchIn ? 'Time to Punch In!' : 'Time to Punch Out!'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Biometric machine attendance verification
          </p>
        </div>

        {/* Lecture Details Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-white line-clamp-1">
                {lecture.subject}
              </h3>
              {lecture.code && (
                <span className="text-xs font-semibold text-indigo-400">
                  {lecture.code} • {lecture.type.toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800">
              {scheduledTime}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1 border-t border-slate-750">
            {lecture.room && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-pink-400" />
                {lecture.room}
              </span>
            )}
            {lecture.teacher && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-400" />
                {lecture.teacher}
              </span>
            )}
          </div>
        </div>

        {/* Question Prompt */}
        <div className="my-5 text-center">
          <p className="text-sm font-semibold text-slate-200">
            Have you completed your biometric punch?
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Mark your attendance now so your attendance percentage stays accurate!
          </p>
        </div>

        {/* Primary Action Buttons */}
        {!showExcuseInput ? (
          <div className="space-y-2.5">
            <button
              onClick={handlePunched}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>YES, I PUNCHED {isPunchIn ? 'IN' : 'OUT'}!</span>
            </button>

            <button
              onClick={snoozePrompt}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Remind me in 2 minutes (Snooze)</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleMissed}
                className="py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-rose-950/40 text-rose-300 border border-slate-750 hover:border-rose-800 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Missed / Absent</span>
              </button>

              <button
                onClick={() => setShowExcuseInput(true)}
                className="py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-amber-950/40 text-slate-300 border border-slate-750 hover:border-amber-800 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Machine Error</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-850 border border-slate-750">
            <label className="block text-xs font-semibold text-slate-300">
              Reason / Machine issue (optional note):
            </label>
            <input
              type="text"
              value={excuseNote}
              onChange={(e) => setExcuseNote(e.target.value)}
              placeholder="e.g. Biometric sensor timeout, queue too long, gatepass"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowExcuseInput(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Back
              </button>
              <button
                onClick={handleExcused}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md shadow-amber-600/20"
              >
                Log as Excused
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
