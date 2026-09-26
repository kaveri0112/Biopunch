import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { DayOfWeek, Lecture } from '../types';
import { AddEditLectureModal } from './AddEditLectureModal';
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Upload,
  RotateCcw,
  MapPin,
  User,
  Sparkles,
} from 'lucide-react';

interface TimetableViewProps {
  onOpenUpload: () => void;
}

const ALL_DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const TimetableView: React.FC<TimetableViewProps> = ({ onOpenUpload }) => {
  const { timetable, setTimetable, resetToSampleTimetable } = useAttendance();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);

  const currentSchedule = timetable.days.find((d) => d.day === selectedDay);
  const lectures = currentSchedule ? currentSchedule.lectures : [];

  const handleOpenAdd = () => {
    setEditingLecture(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setIsAddEditOpen(true);
  };

  const handleDelete = (lectureId: string) => {
    if (confirm('Delete this lecture from your timetable?')) {
      const updatedDays = timetable.days.map((d) => {
        if (d.day === selectedDay) {
          return {
            ...d,
            lectures: d.lectures.filter((l) => l.id !== lectureId),
          };
        }
        return d;
      });

      setTimetable({
        ...timetable,
        days: updatedDays,
        lastUpdated: new Date().toISOString(),
      });
    }
  };

  const handleSaveLecture = (day: DayOfWeek, savedLecture: Lecture) => {
    const updatedDays = timetable.days.map((d) => {
      if (d.day === day) {
        const exists = d.lectures.some((l) => l.id === savedLecture.id);
        const newLectures = exists
          ? d.lectures.map((l) => (l.id === savedLecture.id ? savedLecture : l))
          : [...d.lectures, savedLecture];

        // Sort by start time
        newLectures.sort((a, b) => a.startTime.localeCompare(b.startTime));

        return {
          ...d,
          lectures: newLectures,
        };
      }
      return d;
    });

    setTimetable({
      ...timetable,
      days: updatedDays,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Controls Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Class Timetable</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {timetable.scheduleName || 'Configured Weekly Schedule'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Scan Image (AI)</span>
            </button>

            <button
              onClick={resetToSampleTimetable}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Reset to Sample Timetable"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Pills Bar */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ALL_DAYS.map((day) => {
            const count =
              timetable.days.find((d) => d.day === day)?.lectures.length || 0;
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-750'
                }`}
              >
                <span>{day.slice(0, 3)}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-750 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lectures List for Selected Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-white">{selectedDay}'s Classes</h3>
            <span className="text-xs text-slate-400">
              ({lectures.length} {lectures.length === 1 ? 'class' : 'classes'})
            </span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-indigo-400 border border-slate-750 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Class</span>
          </button>
        </div>

        {lectures.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-300">
              No classes scheduled for {selectedDay}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You can manually add individual classes or scan your complete weekly timetable photo.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                + Add Class
              </button>
              <button
                onClick={onOpenUpload}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                Upload Photo
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {lectures.map((lec) => (
              <div
                key={lec.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">
                        {lec.subject}
                      </h4>
                      {lec.code && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {lec.code}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {lec.startTime} - {lec.endTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {lec.type}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(lec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit class"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(lec.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  {lec.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-pink-400" />
                      {lec.room}
                    </span>
                  )}
                  {lec.teacher && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      {lec.teacher}
                    </span>
                  )}
                  <span className="text-slate-400">
                    Vibrates for Punch-In ({lec.startTime}) & Punch-Out ({lec.endTime})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddEditLectureModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        day={selectedDay}
        initialLecture={editingLecture}
        onSave={handleSaveLecture}
      />
    </div>
  );
};
