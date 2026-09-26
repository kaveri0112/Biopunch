import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { PunchRecord, PunchStatus, PunchType } from '../types';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  Plus,
  Filter,
  Search,
  Sparkles,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

export const AttendanceRecordsView: React.FC = () => {
  const {
    punchRecords,
    settings,
    clearAttendanceLogs,
    deletePunchRecord,
    addManualPunch,
    timetable,
  } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual Punch Form State
  const [manualSubject, setManualSubject] = useState('');
  const [manualType, setManualType] = useState<PunchType>('punch-in');
  const [manualStatus, setManualStatus] = useState<PunchStatus>('punched');
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [manualTime, setManualTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [manualNote, setManualNote] = useState('');

  // Collect all unique subjects from timetable and records
  const allSubjectsSet = new Set<string>();
  timetable.days.forEach((d) =>
    d.lectures.forEach((l) => allSubjectsSet.add(l.subject))
  );
  punchRecords.forEach((r) => allSubjectsSet.add(r.subject));
  const uniqueSubjects = Array.from(allSubjectsSet);

  // Calculate subject-wise metrics
  const subjectMetrics = uniqueSubjects.map((subject) => {
    // Only count punch-ins or total sessions (usually biometric punch-in determines attendance presence)
    const recordsForSubject = punchRecords.filter((r) => r.subject === subject);
    const punchIns = recordsForSubject.filter((r) => r.type === 'punch-in');

    const totalLectures = punchIns.length;
    const attended = punchIns.filter((r) => r.status === 'punched').length;
    const missed = punchIns.filter((r) => r.status === 'missed').length;
    const excused = punchIns.filter((r) => r.status === 'excused').length;

    // Excused does not penalize attendance
    const effectiveAttended = attended + excused;
    const percentage =
      totalLectures > 0
        ? Math.round((effectiveAttended / totalLectures) * 100)
        : 100;

    // Bunk margin calculation:
    // If percentage > target, how many more can be skipped? (attended / (total + x)) >= target
    // If percentage < target, how many must be attended? ((attended + y) / (total + y)) >= target
    const target = settings.targetAttendancePercent / 100;
    let marginText = '';

    if (totalLectures === 0) {
      marginText = 'No attendance recorded yet';
    } else if (percentage >= settings.targetAttendancePercent) {
      // (effectiveAttended / (totalLectures + x)) >= target
      // x <= (effectiveAttended - target * totalLectures) / target
      const skippable = Math.floor(
        (effectiveAttended - target * totalLectures) / target
      );
      marginText =
        skippable > 0
          ? `Safe! You can miss ${skippable} class${skippable > 1 ? 'es' : ''}`
          : 'On the border! Do not miss next class';
    } else {
      // ((effectiveAttended + y) / (totalLectures + y)) >= target
      // effectiveAttended + y >= target * totalLectures + target * y
      // y * (1 - target) >= target * totalLectures - effectiveAttended
      const needed = Math.ceil(
        (target * totalLectures - effectiveAttended) / (1 - target)
      );
      marginText = `Need ${needed} consecutive class${needed > 1 ? 'es' : ''} to reach ${settings.targetAttendancePercent}%`;
    }

    return {
      subject,
      totalLectures,
      attended,
      missed,
      excused,
      percentage,
      marginText,
    };
  });

  // Overall attendance calculation
  const totalPunchIns = punchRecords.filter((r) => r.type === 'punch-in');
  const totalAttended = totalPunchIns.filter(
    (r) => r.status === 'punched' || r.status === 'excused'
  ).length;
  const overallPercentage =
    totalPunchIns.length > 0
      ? Math.round((totalAttended / totalPunchIns.length) * 100)
      : 100;

  // Filtered records list
  const filteredRecords = punchRecords.filter((record) => {
    const matchesSearch =
      record.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.note && record.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSubject) return;

    addManualPunch({
      date: manualDate,
      lectureId: 'manual',
      subject: manualSubject,
      type: manualType,
      scheduledTime: manualTime,
      actualTime: `${manualTime}:00`,
      status: manualStatus,
      note: manualNote.trim() || undefined,
    });

    setShowManualModal(false);
    setManualNote('');
  };

  const handleExportCSV = () => {
    if (punchRecords.length === 0) {
      alert('No punch records to export yet.');
      return;
    }

    const headers = [
      'Date',
      'Time',
      'Subject',
      'Type',
      'Scheduled Time',
      'Status',
      'Note',
    ];
    const rows = punchRecords.map((r) => [
      r.date,
      r.actualTime,
      `"${r.subject.replace(/"/g, '""')}"`,
      r.type,
      r.scheduledTime,
      r.status,
      `"${(r.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `biopunch_attendance_log_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Overall Attendance Summary Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-5 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Overall Attendance
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-white">
                {overallPercentage}%
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Target: {settings.targetAttendancePercent}%
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {totalAttended} of {totalPunchIns.length} biometric punch sessions attended
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-indigo-950/70 border-2 border-indigo-500/40 flex flex-col items-center justify-center text-center">
            <TrendingUp
              className={`w-6 h-6 ${
                overallPercentage >= settings.targetAttendancePercent
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            />
            <span className="text-[10px] font-bold text-slate-300 mt-0.5">
              {overallPercentage >= settings.targetAttendancePercent
                ? 'Eligible'
                : 'Warning'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Manual Punch</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Subject Attendance & Bunk Margin</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
            {subjectMetrics.length} Subjects
          </span>
        </h3>

        {subjectMetrics.length === 0 ? (
          <p className="text-xs text-slate-400">No subjects configured yet.</p>
        ) : (
          <div className="space-y-3">
            {subjectMetrics.map((sm) => {
              const isSafe = sm.percentage >= settings.targetAttendancePercent;
              return (
                <div
                  key={sm.subject}
                  className="p-3.5 rounded-2xl bg-slate-850 border border-slate-750/70 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white max-w-[220px] truncate">
                      {sm.subject}
                    </h4>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        isSafe
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {sm.percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        isSafe ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${sm.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {sm.attended} Attended • {sm.missed} Missed
                      {sm.excused > 0 && ` • ${sm.excused} Excused`}
                    </span>
                    <span
                      className={`font-semibold ${
                        isSafe ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {sm.marginText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Punch History Log */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">Punch Verification Logs</h3>
            <p className="text-xs text-slate-400">
              Complete record of all prompt responses and biometric checks
            </p>
          </div>

          {punchRecords.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all attendance logs? Timetable will be kept.')) {
                  clearAttendanceLogs();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 self-start sm:self-auto"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Logs</span>
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subject or note..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-850 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="punched">Punched</option>
            <option value="missed">Missed</option>
            <option value="excused">Excused</option>
          </select>
        </div>

        {/* Records list */}
        {filteredRecords.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
            No punch records matching criteria.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredRecords.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-2xl bg-slate-850 border border-slate-750 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      r.status === 'punched'
                        ? 'bg-emerald-950 text-emerald-400'
                        : r.status === 'excused'
                        ? 'bg-amber-950 text-amber-400'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {r.status === 'punched' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : r.status === 'excused' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="font-bold text-white">{r.subject}</div>
                    <div className="text-[11px] text-slate-400">
                      {r.date} • {r.actualTime} ({r.type})
                      {r.note && (
                        <span className="text-amber-300 block">Note: {r.note}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold capitalize px-2 py-0.5 rounded-md text-[10px] ${
                      r.status === 'punched'
                        ? 'bg-emerald-900/40 text-emerald-300'
                        : r.status === 'excused'
                        ? 'bg-amber-900/40 text-amber-300'
                        : 'bg-rose-900/40 text-rose-300'
                    }`}
                  >
                    {r.status}
                  </span>

                  <button
                    onClick={() => deletePunchRecord(r.id)}
                    className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Punch Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <h3 className="font-bold text-base text-white mb-3">
              Record Manual Biometric Punch
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Punch Type
                  </label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as PunchType)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="punch-in">Punch In</option>
                    <option value="punch-out">Punch Out</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as PunchStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="punched">Punched (Attended)</option>
                    <option value="missed">Missed (Absent)</option>
                    <option value="excused">Excused / Error</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="e.g. Biometric queue delay"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                >
                  Save Punch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
