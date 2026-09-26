import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  Timetable,
  Lecture,
  DayOfWeek,
  PunchRecord,
  PunchType,
  PunchStatus,
  UserSettings,
  ActivePunchPrompt,
} from '../types';
import { sampleTimetable } from '../utils/sampleTimetable';
import {
  triggerVibration,
  playSynthesizedChime,
  requestScreenWakeLock,
  releaseScreenWakeLock,
} from '../utils/alertEngine';
import confetti from 'canvas-confetti';

interface NextPunchEvent {
  type: PunchType;
  lecture: Lecture;
  scheduledTime: string;
  targetTimestamp: number;
  minutesLeft: number;
  secondsLeft: number;
}

interface AttendanceContextType {
  timetable: Timetable;
  setTimetable: (tt: Timetable) => void;
  punchRecords: PunchRecord[];
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  currentTime: Date;
  currentLecture: Lecture | null;
  nextLecture: Lecture | null;
  nextPunchEvent: NextPunchEvent | null;
  activePrompt: ActivePunchPrompt | null;
  setActivePrompt: (prompt: ActivePunchPrompt | null) => void;
  recordPunch: (
    lecture: Lecture,
    type: PunchType,
    status: PunchStatus,
    note?: string
  ) => void;
  snoozePrompt: () => void;
  dismissPrompt: () => void;
  testAlert: () => void;
  resetToSampleTimetable: () => void;
  clearAttendanceLogs: () => void;
  addManualPunch: (record: Omit<PunchRecord, 'id' | 'timestamp'>) => void;
  deletePunchRecord: (id: string) => void;
  getTodayPunches: () => PunchRecord[];
}

const defaultSettings: UserSettings = {
  vibrationEnabled: true,
  audioChimeEnabled: true,
  vibrationStrength: 'standard',
  punchInLeadMinutes: 5,
  punchOutLeadMinutes: 5,
  targetAttendancePercent: 75,
  wakeLockEnabled: false,
};

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const TIMETABLE_STORAGE_KEY = 'biopunch_timetable_v1';
const RECORDS_STORAGE_KEY = 'biopunch_records_v1';
const SETTINGS_STORAGE_KEY = 'biopunch_settings_v1';
const ALERTED_KEYS_STORAGE_KEY = 'biopunch_alerted_keys_v1';

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load Timetable from localStorage or default to sample
  const [timetable, setTimetableState] = useState<Timetable>(() => {
    try {
      const saved = localStorage.getItem(TIMETABLE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading timetable from storage:', e);
    }
    return sampleTimetable;
  });

  // Load Records
  const [punchRecords, setPunchRecords] = useState<PunchRecord[]>(() => {
    try {
      const saved = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading records from storage:', e);
    }
    return [];
  });

  // Load Settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading settings from storage:', e);
    }
    return defaultSettings;
  });

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activePrompt, setActivePrompt] = useState<ActivePunchPrompt | null>(null);

  // Set of alerted keys for today to avoid repeated triggers
  const alertedKeysRef = useRef<Set<string>>(new Set());
  const snoozedAlertsRef = useRef<Map<string, number>>(new Map());

  // Save timetable
  const setTimetable = useCallback((newTimetable: Timetable) => {
    setTimetableState(newTimetable);
    try {
      localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(newTimetable));
    } catch (e) {
      console.error('Failed to save timetable to storage:', e);
    }
  }, []);

  // Update Settings
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      return updated;
    });
  }, []);

  // Save records
  const updateRecords = useCallback((updater: (prev: PunchRecord[]) => PunchRecord[]) => {
    setPunchRecords((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save punch records:', e);
      }
      return next;
    });
  }, []);

  // Load alerted keys from storage on mount
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem(ALERTED_KEYS_STORAGE_KEY);
      if (savedKeys) {
        const parsed = JSON.parse(savedKeys);
        alertedKeysRef.current = new Set(parsed);
      }
    } catch (e) {}
  }, []);

  // Screen Wake Lock handling
  useEffect(() => {
    if (settings.wakeLockEnabled) {
      requestScreenWakeLock();
    } else {
      releaseScreenWakeLock();
    }
    return () => {
      releaseScreenWakeLock();
    };
  }, [settings.wakeLockEnabled]);

  // Current day helper
  const getDayName = (date: Date): DayOfWeek => {
    const days: DayOfWeek[] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  };

  const getTodayDateStr = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Convert "HH:MM" to Date object today
  const timeStrToDate = (timeStr: string, baseDate: Date): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  // Ticker: updates every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for upcoming or active lectures
  const currentDayName = getDayName(currentTime);
  const todaySchedule = timetable.days.find((d) => d.day === currentDayName);
  const todayLectures = todaySchedule ? todaySchedule.lectures : [];

  let currentLecture: Lecture | null = null;
  let nextLecture: Lecture | null = null;
  let nextPunchEvent: NextPunchEvent | null = null;

  if (todayLectures.length > 0) {
    const nowTime = currentTime.getTime();

    // Sort today's lectures by start time
    const sortedLectures = [...todayLectures].sort((a, b) => {
      const aDate = timeStrToDate(a.startTime, currentTime).getTime();
      const bDate = timeStrToDate(b.startTime, currentTime).getTime();
      return aDate - bDate;
    });

    for (const lec of sortedLectures) {
      const startDate = timeStrToDate(lec.startTime, currentTime);
      const endDate = timeStrToDate(lec.endTime, currentTime);

      // Check current
      if (nowTime >= startDate.getTime() && nowTime <= endDate.getTime()) {
        currentLecture = lec;
      }

      // Check next lecture
      if (startDate.getTime() > nowTime && !nextLecture) {
        nextLecture = lec;
      }
    }

    // Determine Next Punch Event (Punch In or Punch Out)
    const upcomingEvents: {
      type: PunchType;
      lecture: Lecture;
      scheduledTime: string;
      targetTime: Date;
    }[] = [];

    sortedLectures.forEach((lec) => {
      const startDate = timeStrToDate(lec.startTime, currentTime);
      const endDate = timeStrToDate(lec.endTime, currentTime);

      // Punch In alert time: startTime minus punchInLeadMinutes
      const punchInLead = lec.punchInLeadMinutes ?? settings.punchInLeadMinutes;
      const punchInAlertTime = new Date(startDate.getTime() - punchInLead * 60 * 1000);

      // Punch Out alert time: endTime minus punchOutLeadMinutes
      const punchOutLead = lec.punchOutLeadMinutes ?? settings.punchOutLeadMinutes;
      const punchOutAlertTime = new Date(endDate.getTime() - punchOutLead * 60 * 1000);

      if (punchInAlertTime.getTime() > nowTime) {
        upcomingEvents.push({
          type: 'punch-in',
          lecture: lec,
          scheduledTime: lec.startTime,
          targetTime: punchInAlertTime,
        });
      }

      if (punchOutAlertTime.getTime() > nowTime) {
        upcomingEvents.push({
          type: 'punch-out',
          lecture: lec,
          scheduledTime: lec.endTime,
          targetTime: punchOutAlertTime,
        });
      }
    });

    upcomingEvents.sort((a, b) => a.targetTime.getTime() - b.targetTime.getTime());

    if (upcomingEvents.length > 0) {
      const nextEv = upcomingEvents[0];
      const diffMs = Math.max(0, nextEv.targetTime.getTime() - nowTime);
      const totalSecs = Math.floor(diffMs / 1000);
      nextPunchEvent = {
        type: nextEv.type,
        lecture: nextEv.lecture,
        scheduledTime: nextEv.scheduledTime,
        targetTimestamp: nextEv.targetTime.getTime(),
        minutesLeft: Math.floor(totalSecs / 60),
        secondsLeft: totalSecs % 60,
      };
    }
  }

  // ALARM TICKER: check if punch window has arrived!
  useEffect(() => {
    if (!todaySchedule || todayLectures.length === 0) return;

    const todayDateStr = getTodayDateStr(currentTime);
    const nowTime = currentTime.getTime();

    // Check snoozed alerts
    snoozedAlertsRef.current.forEach((triggerAt, key) => {
      if (nowTime >= triggerAt) {
        // Snooze expired: re-trigger
        const [dateStr, lecId, type] = key.split('_');
        const lec = todayLectures.find((l) => l.id === lecId);
        if (lec) {
          snoozedAlertsRef.current.delete(key);
          triggerAlertFor(lec, type as PunchType, dateStr);
        }
      }
    });

    todayLectures.forEach((lec) => {
      const startDate = timeStrToDate(lec.startTime, currentTime);
      const endDate = timeStrToDate(lec.endTime, currentTime);

      const punchInLead = lec.punchInLeadMinutes ?? settings.punchInLeadMinutes;
      const punchInTarget = new Date(startDate.getTime() - punchInLead * 60 * 1000);

      const punchOutLead = lec.punchOutLeadMinutes ?? settings.punchOutLeadMinutes;
      const punchOutTarget = new Date(endDate.getTime() - punchOutLead * 60 * 1000);

      // Check Punch In trigger (window: within 90 seconds of trigger time)
      const punchInKey = `${todayDateStr}_${lec.id}_punch-in`;
      if (!alertedKeysRef.current.has(punchInKey)) {
        const diffMs = nowTime - punchInTarget.getTime();
        // Trigger if nowTime is within [0, 90000ms] after punchInTarget
        if (diffMs >= 0 && diffMs <= 90000) {
          alertedKeysRef.current.add(punchInKey);
          saveAlertedKeys();
          triggerAlertFor(lec, 'punch-in', todayDateStr);
        }
      }

      // Check Punch Out trigger
      const punchOutKey = `${todayDateStr}_${lec.id}_punch-out`;
      if (!alertedKeysRef.current.has(punchOutKey)) {
        const diffMs = nowTime - punchOutTarget.getTime();
        if (diffMs >= 0 && diffMs <= 90000) {
          alertedKeysRef.current.add(punchOutKey);
          saveAlertedKeys();
          triggerAlertFor(lec, 'punch-out', todayDateStr);
        }
      }
    });
  }, [currentTime, todaySchedule, todayLectures, settings]);

  const saveAlertedKeys = () => {
    try {
      localStorage.setItem(
        ALERTED_KEYS_STORAGE_KEY,
        JSON.stringify(Array.from(alertedKeysRef.current))
      );
    } catch (e) {}
  };

  const triggerAlertFor = (
    lecture: Lecture,
    type: PunchType,
    dateStr: string
  ) => {
    // 1. Vibration
    if (settings.vibrationEnabled) {
      triggerVibration(type, settings.vibrationStrength);
    }
    // 2. Offline Web Audio Chime
    if (settings.audioChimeEnabled) {
      playSynthesizedChime(type);
    }

    // 3. Set Active Interactive Modal Prompt
    setActivePrompt({
      id: `${dateStr}_${lecture.id}_${type}`,
      lecture,
      type,
      scheduledTime: type === 'punch-in' ? lecture.startTime : lecture.endTime,
      day: currentDayName,
      timestamp: Date.now(),
    });
  };

  // Test Alert
  const testAlert = useCallback(() => {
    if (settings.vibrationEnabled) {
      triggerVibration('punch-in', settings.vibrationStrength);
    }
    if (settings.audioChimeEnabled) {
      playSynthesizedChime('punch-in');
    }
    // Create a mock prompt for testing
    const testLecture: Lecture = {
      id: 'test-lec',
      subject: 'Test Biometric Lecture (Simulation)',
      code: 'TEST-101',
      room: 'Room 304',
      teacher: 'Test Proctor',
      type: 'lecture',
      startTime: currentTime.toTimeString().slice(0, 5),
      endTime: '12:00',
    };
    setActivePrompt({
      id: `test_${Date.now()}`,
      lecture: testLecture,
      type: 'punch-in',
      scheduledTime: testLecture.startTime,
      day: currentDayName,
      timestamp: Date.now(),
    });
  }, [settings, currentDayName, currentTime]);

  // Record punch response
  const recordPunch = useCallback(
    (
      lecture: Lecture,
      type: PunchType,
      status: PunchStatus,
      note?: string
    ) => {
      const now = new Date();
      const todayDate = getTodayDateStr(now);
      const actualTimeStr = now.toTimeString().slice(0, 8); // HH:MM:SS

      const newRecord: PunchRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date: todayDate,
        lectureId: lecture.id,
        subject: lecture.subject,
        type,
        scheduledTime: type === 'punch-in' ? lecture.startTime : lecture.endTime,
        actualTime: actualTimeStr,
        status,
        note,
        timestamp: now.getTime(),
      };

      updateRecords((prev) => [newRecord, ...prev]);

      if (status === 'punched') {
        triggerVibration('success');
        playSynthesizedChime('success');
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch (e) {}
      }

      setActivePrompt(null);
    },
    [updateRecords]
  );

  // Snooze prompt for 2 minutes (120,000ms)
  const snoozePrompt = useCallback(() => {
    if (!activePrompt) return;
    const key = `${getTodayDateStr(currentTime)}_${activePrompt.lecture.id}_${activePrompt.type}`;
    snoozedAlertsRef.current.set(key, Date.now() + 2 * 60 * 1000);
    triggerVibration('snooze');
    setActivePrompt(null);
  }, [activePrompt, currentTime]);

  const dismissPrompt = useCallback(() => {
    setActivePrompt(null);
  }, []);

  const resetToSampleTimetable = useCallback(() => {
    setTimetable(sampleTimetable);
  }, [setTimetable]);

  const clearAttendanceLogs = useCallback(() => {
    updateRecords(() => []);
    alertedKeysRef.current = new Set();
    localStorage.removeItem(ALERTED_KEYS_STORAGE_KEY);
  }, [updateRecords]);

  const addManualPunch = useCallback(
    (recordData: Omit<PunchRecord, 'id' | 'timestamp'>) => {
      const newRecord: PunchRecord = {
        ...recordData,
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
      };
      updateRecords((prev) => [newRecord, ...prev]);
    },
    [updateRecords]
  );

  const deletePunchRecord = useCallback(
    (id: string) => {
      updateRecords((prev) => prev.filter((r) => r.id !== id));
    },
    [updateRecords]
  );

  const getTodayPunches = useCallback(() => {
    const todayStr = getTodayDateStr(currentTime);
    return punchRecords.filter((r) => r.date === todayStr);
  }, [currentTime, punchRecords]);

  return (
    <AttendanceContext.Provider
      value={{
        timetable,
        setTimetable,
        punchRecords,
        settings,
        updateSettings,
        currentTime,
        currentLecture,
        nextLecture,
        nextPunchEvent,
        activePrompt,
        setActivePrompt,
        recordPunch,
        snoozePrompt,
        dismissPrompt,
        testAlert,
        resetToSampleTimetable,
        clearAttendanceLogs,
        addManualPunch,
        deletePunchRecord,
        getTodayPunches,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
