import React, { useState, useRef } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Timetable } from '../types';
import {
  Upload,
  Camera,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  Calendar,
  Layers,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface TimetableUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimetableUploadModal: React.FC<TimetableUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { setTimetable, resetToSampleTimetable } = useAttendance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<Timetable | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setParsedResult(null);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleScanWithAI = async () => {
    if (!imageBase64) return;

    setIsLoading(true);
    setErrorMessage(null);
    setScanStep('Analyzing timetable layout and days...');

    try {
      // Step simulated updates for reassuring user experience
      const stepTimer1 = setTimeout(() => {
        setScanStep('Extracting lecture slots, classroom numbers & teachers...');
      }, 1800);
      const stepTimer2 = setTimeout(() => {
        setScanStep('Setting up biometric punch-in and punch-out alert windows...');
      }, 3600);

      const response = await fetch('/api/parse-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse timetable image.');
      }

      const timetableData: Timetable = {
        id: `tt_${Date.now()}`,
        scheduleName: data.data.scheduleName || 'My College Timetable',
        summary: data.data.summary || 'Uploaded timetable schedule',
        days: data.data.days || [],
        lastUpdated: new Date().toISOString(),
      };

      setParsedResult(timetableData);
      setScanStep('');
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(
        err?.message ||
          'Could not read timetable from this image. Please ensure the image is clear or try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTimetable = () => {
    if (parsedResult) {
      setTimetable(parsedResult);
      onClose();
    }
  };

  const handleUseSample = () => {
    resetToSampleTimetable();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Scan Timetable Image</h2>
              <p className="text-xs text-slate-400">
                AI extracts all lecture times & punch windows automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1">
          {/* Upload Dropzone */}
          {!imagePreview && !parsedResult && (
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center transition bg-slate-950/40">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="w-16 h-16 rounded-2xl bg-indigo-950/70 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <FileImage className="w-8 h-8" />
              </div>

              <h3 className="font-bold text-sm text-white mb-1">
                Upload or Take Photo of Your Timetable
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                Printed schedules, notice board photos, college portal screenshots, or handwritten charts.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo / File</span>
                </button>

                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 border border-slate-700 transition"
                >
                  <Camera className="w-4 h-4 text-indigo-400" />
                  <span>Take Camera Photo</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-850 flex items-center justify-center">
                <button
                  onClick={handleUseSample}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                >
                  Or test with pre-built Sample College Timetable
                </button>
              </div>
            </div>
          )}

          {/* Image Selected & Preview */}
          {imagePreview && !parsedResult && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-750 bg-black/60 max-h-56 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Timetable upload preview"
                  className="object-contain max-h-56 w-full"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setImageBase64(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition"
                  title="Change image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isLoading ? (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex flex-col items-center text-center space-y-2">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-sm font-semibold text-white">Scanning Timetable</p>
                  <p className="text-xs text-indigo-300 animate-pulse">{scanStep}</p>
                </div>
              ) : (
                <button
                  onClick={handleScanWithAI}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-500 hover:from-indigo-500 hover:to-pink-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Lectures & Timings with AI</span>
                </button>
              )}
            </div>
          )}

          {/* Parsed Result Preview */}
          {parsedResult && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm text-white">Timetable Extracted!</h4>
                  <p className="text-xs text-emerald-200">
                    {parsedResult.scheduleName}
                  </p>
                </div>
              </div>

              {/* Day breakdown summary */}
              <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-750 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Extracted Weekly Schedule
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {parsedResult.days.map((day) => (
                    <div
                      key={day.day}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-300">{day.day}</span>
                      <span className="font-bold text-indigo-400">
                        {day.lectures.length} classes
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample list of lectures parsed */}
              <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-750 max-h-48 overflow-y-auto space-y-1.5 text-xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Preview Classes
                </span>
                {parsedResult.days.flatMap((d) =>
                  d.lectures.map((l) => (
                    <div
                      key={`${d.day}-${l.id}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800"
                    >
                      <div>
                        <div className="font-semibold text-white">{l.subject}</div>
                        <div className="text-[11px] text-slate-400">
                          {d.day} • {l.room || 'Classroom'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-indigo-300">
                          {l.startTime} - {l.endTime}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setParsedResult(null);
                    setImagePreview(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition"
                >
                  Upload Another
                </button>
                <button
                  onClick={handleApplyTimetable}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 transition active:scale-[0.98]"
                >
                  <span>Save & Activate Timetable</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">Extraction issue</p>
                <p className="text-rose-200 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
