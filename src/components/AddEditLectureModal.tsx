import React, { useState, useEffect } from 'react';
import { Lecture, LectureType, DayOfWeek } from '../types';
import { X, Plus, Save } from 'lucide-react';

interface AddEditLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayOfWeek;
  initialLecture?: Lecture | null;
  onSave: (day: DayOfWeek, lecture: Lecture) => void;
}

export const AddEditLectureModal: React.FC<AddEditLectureModalProps> = ({
  isOpen,
  onClose,
  day,
  initialLecture,
  onSave,
}) => {
  const [subject, setSubject] = useState('');
  const [code, setCode] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [type, setType] = useState<LectureType>('lecture');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  useEffect(() => {
    if (initialLecture) {
      setSubject(initialLecture.subject);
      setCode(initialLecture.code || '');
      setTeacher(initialLecture.teacher || '');
      setRoom(initialLecture.room || '');
      setType(initialLecture.type);
      setStartTime(initialLecture.startTime);
      setEndTime(initialLecture.endTime);
    } else {
      setSubject('');
      setCode('');
      setTeacher('');
      setRoom('');
      setType('lecture');
      setStartTime('09:00');
      setEndTime('10:00');
    }
  }, [initialLecture, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const lecture: Lecture = {
      id: initialLecture ? initialLecture.id : `lec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      subject: subject.trim(),
      code: code.trim() || undefined,
      teacher: teacher.trim() || undefined,
      room: room.trim() || undefined,
      type,
      startTime,
      endTime,
    };

    onSave(day, lecture);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">
            {initialLecture ? 'Edit Lecture' : `Add Class for ${day}`}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Data Structures & Algorithms"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Course Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS501"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LectureType)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="lecture">Lecture</option>
                <option value="lab">Lab / Practical</option>
                <option value="practical">Practical</option>
                <option value="tutorial">Tutorial</option>
                <option value="seminar">Seminar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Time (24h) *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                End Time (24h) *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Classroom / Hall
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Room 304, Lab 2"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Teacher / Faculty
              </label>
              <input
                type="text"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                placeholder="e.g. Prof. Sharma"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Class</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
