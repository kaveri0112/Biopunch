export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type LectureType = 'lecture' | 'lab' | 'practical' | 'tutorial' | 'seminar';

export interface Lecture {
  id: string;
  subject: string;
  code?: string;
  teacher?: string;
  room?: string;
  type: LectureType;
  startTime: string; // 'HH:MM' (24-hour)
  endTime: string;   // 'HH:MM' (24-hour)
  punchInLeadMinutes?: number;
  punchOutLeadMinutes?: number;
}

export interface DaySchedule {
  day: DayOfWeek;
  lectures: Lecture[];
}

export interface Timetable {
  id: string;
  scheduleName: string;
  summary?: string;
  days: DaySchedule[];
  lastUpdated: string;
}

export type PunchType = 'punch-in' | 'punch-out';
export type PunchStatus = 'punched' | 'missed' | 'snoozed' | 'excused';

export interface PunchRecord {
  id: string;
  date: string; // 'YYYY-MM-DD'
  lectureId: string;
  subject: string;
  type: PunchType;
  scheduledTime: string; // 'HH:MM'
  actualTime: string;    // 'HH:MM:SS'
  status: PunchStatus;
  note?: string;
  timestamp: number;
}

export interface UserSettings {
  vibrationEnabled: boolean;
  audioChimeEnabled: boolean;
  vibrationStrength: 'gentle' | 'standard' | 'urgent';
  punchInLeadMinutes: number; // e.g. 5 min before
  punchOutLeadMinutes: number; // e.g. 5 min before
  targetAttendancePercent: number; // default 75
  wakeLockEnabled: boolean;
}

export interface ActivePunchPrompt {
  id: string;
  lecture: Lecture;
  type: PunchType;
  scheduledTime: string;
  day: DayOfWeek;
  timestamp: number;
}
