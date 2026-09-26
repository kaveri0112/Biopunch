import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  Settings,
  Vibrate,
  Volume2,
  Clock,
  Target,
  Sun,
  X,
  RotateCcw,
  Sparkles,
  Smartphone,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, testAlert, resetToSampleTimetable } =
    useAttendance();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Alert Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Vibration Settings */}
          <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="w-4 h-4 text-pink-400" />
                <span className="font-bold text-xs text-white">Phone Vibration</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) =>
                    updateSettings({ vibrationEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>

            {settings.vibrationEnabled && (
              <div className="space-y-2 pt-1 border-t border-slate-750">
                <label className="text-[11px] font-semibold text-slate-400 block">
                  Vibration Pattern / Strength
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['gentle', 'standard', 'urgent'] as const).map((str) => (
                    <button
                      key={str}
                      onClick={() => updateSettings({ vibrationStrength: str })}
                      className={`py-1.5 rounded-xl font-medium capitalize border transition ${
                        settings.vibrationStrength === str
                          ? 'bg-pink-600/30 text-pink-200 border-pink-500'
                          : 'bg-slate-900 text-slate-400 border-slate-750 hover:bg-slate-800'
                      }`}
                    >
                      {str}
                    </button>
                  ))}
                </div>

                <button
                  onClick={testAlert}
                  className="w-full mt-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-pink-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Vibrate className="w-3.5 h-3.5" />
                  <span>Test Vibration Pattern Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Offline Audio Chime */}
          <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-750 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="font-bold text-xs text-white block">
                  Offline Synthesized Chime
                </span>
                <span className="text-[10px] text-slate-400">
                  Plays tone alongside vibration (works offline)
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.audioChimeEnabled}
                onChange={(e) =>
                  updateSettings({ audioChimeEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Alert Timing Windows */}
          <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-750 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-white">
                Reminder Lead Times
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Punch-In Alert
                </label>
                <select
                  value={settings.punchInLeadMinutes}
                  onChange={(e) =>
                    updateSettings({ punchInLeadMinutes: Number(e.target.value) })
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={0}>At lecture start (0 min)</option>
                  <option value={2}>2 mins before start</option>
                  <option value={5}>5 mins before start</option>
                  <option value={10}>10 mins before start</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Punch-Out Alert
                </label>
                <select
                  value={settings.punchOutLeadMinutes}
                  onChange={(e) =>
                    updateSettings({ punchOutLeadMinutes: Number(e.target.value) })
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={0}>At lecture end (0 min)</option>
                  <option value={2}>2 mins before end</option>
                  <option value={5}>5 mins before end</option>
                </select>
              </div>
            </div>
          </div>

          {/* Target Attendance Requirement */}
          <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-750 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-white">
                  College Attendance Target
                </span>
              </div>
              <span className="text-xs font-bold text-amber-300">
                {settings.targetAttendancePercent}%
              </span>
            </div>

            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={settings.targetAttendancePercent}
              onChange={(e) =>
                updateSettings({ targetAttendancePercent: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>50%</span>
              <span>75% (Standard)</span>
              <span>85%</span>
              <span>95%</span>
            </div>
          </div>

          {/* Screen Wake Lock */}
          <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-750 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="font-bold text-xs text-white block">
                  Keep Screen Awake (Wake Lock)
                </span>
                <span className="text-[10px] text-slate-400">
                  Prevents phone sleep when app is active on desk
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.wakeLockEnabled}
                onChange={(e) =>
                  updateSettings({ wakeLockEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* Reset / Sample */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (confirm('Reset timetable to sample college schedule?')) {
                  resetToSampleTimetable();
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Default Sample Timetable</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
