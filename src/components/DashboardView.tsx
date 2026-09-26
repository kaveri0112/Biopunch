import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Lecture, PunchType } from '../types';
import {
  Clock,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Zap,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenUpload: () => void;
  onNavigateToTimetable: () => void;
  onNavigateToRecords: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenUpload,
  onNavigateToTimetable,
  onNavigateToRecords,
}) => {
  const {
    currentTime,
    currentLecture,
    nextLecture,
    nextPunchEvent,
    timetable,
    settings,
    getTodayPunches,
    setActivePrompt,
    testAlert,
  } = useAttendance();

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const days: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const currentDayName = days[currentTime.getDay()];
  const todaySchedule = timetable.days.find((d) => d.day === currentDayName);
  const todayLectures = todaySchedule ? todaySchedule.lectures : [];
  const todayPunches = getTodayPunches();

  // Helper to get status of punch for a lecture today
  const getLecturePunchStatus = (lectureId: string, type: PunchType) => {
    return todayPunches.find((p) => p.lectureId === lectureId && p.type === type);
  };

  // Lecture progress calculation
  const getLectureProgress = (lecture: Lecture) => {
    const [startH, startM] = lecture.startTime.split(':').map(Number);
    const [endH, endM] = lecture.endTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const currentMin = currentTime.getHours() * 60 + currentTime.getMinutes();

    if (currentMin < startMin) return 0;
    if (currentMin > endMin) return 100;
    const duration = endMin - startMin;
    if (duration <= 0) return 0;
    return Math.min(100, Math.round(((currentMin - startMin) / duration) * 100));
  };

  const handleQuickPunch = (lecture: Lecture, type: PunchType) => {
    setActivePrompt({
      id: `${lecture.id}_${type}_${Date.now()}`,
      lecture,
      type,
      scheduledTime: type === 'punch-in' ? lecture.startTime : lecture.endTime,
      day: currentDayName,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Live Time & Day Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 p-5 border border-slate-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {formattedDate}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> Jammer Immune
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono mt-1">
              {formattedTime}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-medium text-slate-400 block">Today's Load</span>
            <span className="text-lg font-bold text-white">
              {todayLectures.length} Classes
            </span>
          </div>
        </div>

        {/* Schedule name subtext */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="truncate max-w-[200px] sm:max-w-xs text-slate-300">
            {timetable.scheduleName}
          </span>
          <button
            onClick={onNavigateToTimetable}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>View Week</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Next Biometric Punch Countdown Card (HIGHLIGHT OF THE APP) */}
      {nextPunchEvent ? (
        <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-pink-900/40 border-2 border-indigo-500/50 p-5 shadow-2xl shadow-indigo-500/20 text-slate-100 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Fingerprint className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Upcoming Punch
                </span>
                <h3 className="font-extrabold text-lg text-white leading-tight">
                  {nextPunchEvent.type === 'punch-in' ? 'Punch In Window' : 'Punch Out Window'}
                </h3>
              </div>
            </div>

            {/* Countdown badge */}
            <div className="px-3 py-1.5 rounded-2xl bg-black/40 border border-indigo-400/40 text-center font-mono">
              <span className="text-xs text-indigo-300 block font-semibold leading-none">In</span>
              <span className="text-base font-black text-white">
                {String(nextPunchEvent.minutesLeft).padStart(2, '0')}:
                {String(nextPunchEvent.secondsLeft).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/30 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-base">
                {nextPunchEvent.lecture.subject}
              </h4>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-indigo-500/30 text-indigo-200">
                {nextPunchEvent.scheduledTime}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              {nextPunchEvent.lecture.room && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  {nextPunchEvent.lecture.room}
                </span>
              )}
              {nextPunchEvent.lecture.teacher && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  {nextPunchEvent.lecture.teacher}
                </span>
              )}
              <span className="text-slate-400">
                Alert vibrates {settings.punchInLeadMinutes}m before
              </span>
            </div>
          </div>

          <button
            onClick={() => handleQuickPunch(nextPunchEvent.lecture, nextPunchEvent.type)}
            className="mt-3.5 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Punch {nextPunchEvent.type === 'punch-in' ? 'In' : 'Out'} Early / Now</span>
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">All Punches Done for Today!</h3>
              <p className="text-xs text-slate-400">
                No more biometric punch reminders scheduled for today.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToRecords}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-400 transition"
          >
            View Logs
          </button>
        </div>
      )}

      {/* Current Active Class */}
      {currentLecture && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                Active Class in Session
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {currentLecture.startTime} - {currentLecture.endTime}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              {currentLecture.subject}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentLecture.room || 'Classroom'} • {currentLecture.type.toUpperCase()}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getLectureProgress(currentLecture)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Started {currentLecture.startTime}</span>
              <span>{getLectureProgress(currentLecture)}% completed</span>
              <span>Ends {currentLecture.endTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Today's Lecture Schedule & Punch Timeline */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">
              Today's Biometric Punch Tracker ({currentDayName})
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {todayLectures.length} Classes
          </span>
        </div>

        {todayLectures.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <p className="text-sm font-medium text-slate-300">
              No classes scheduled for {currentDayName}!
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Enjoy your holiday, or check the full timetable.
            </p>
            <button
              onClick={onOpenUpload}
              className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-300 text-xs font-semibold transition"
            >
              Upload Timetable Photo
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayLectures.map((lec) => {
              const punchInStatus = getLecturePunchStatus(lec.id, 'punch-in');
              const punchOutStatus = getLecturePunchStatus(lec.id, 'punch-out');

              return (
                <div
                  key={lec.id}
                  className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-750/70 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {lec.subject}
                        </span>
                        {lec.code && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {lec.code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>
                          {lec.startTime} - {lec.endTime}
                        </span>
                        {lec.room && <span>• {lec.room}</span>}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {lec.type}
                    </span>
                  </div>

                  {/* Punch In / Punch Out Status Pills */}
                  <div className="mt-3 pt-2.5 border-t border-slate-750/50 grid grid-cols-2 gap-2 text-xs">
                    {/* Punch In Pill */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          PUNCH IN ({lec.startTime})
                        </span>
                        {punchInStatus ? (
                          <span
                            className={`font-bold capitalize text-xs ${
                              punchInStatus.status === 'punched'
                                ? 'text-emerald-400'
                                : punchInStatus.status === 'excused'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {punchInStatus.status} @ {punchInStatus.actualTime.slice(0, 5)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Pending</span>
                        )}
                      </div>

                      {!punchInStatus && (
                        <button
                          onClick={() => handleQuickPunch(lec, 'punch-in')}
                          className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-semibold transition"
                        >
                          Punch
                        </button>
                      )}
                    </div>

                    {/* Punch Out Pill */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          PUNCH OUT ({lec.endTime})
                        </span>
                        {punchOutStatus ? (
                          <span
                            className={`font-bold capitalize text-xs ${
                              punchOutStatus.status === 'punched'
                                ? 'text-emerald-400'
                                : punchOutStatus.status === 'excused'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {punchOutStatus.status} @ {punchOutStatus.actualTime.slice(0, 5)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Pending</span>
                        )}
                      </div>

                      {!punchOutStatus && (
                        <button
                          onClick={() => handleQuickPunch(lec, 'punch-out')}
                          className="px-2 py-1 rounded-lg bg-pink-600/30 hover:bg-pink-600 text-pink-300 hover:text-white text-[11px] font-semibold transition"
                        >
                          Punch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Classroom Jammer Offline Assurance Note */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Zero-Signal Guarantee: </span>
          Even if your classroom or campus has active signal jammers or no cell connectivity,
          BioPunch keeps running in memory, vibrates on time, and saves your biometric punches.
        </div>
      </div>
    </div>
  );
};
