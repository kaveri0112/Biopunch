/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AttendanceProvider } from './context/AttendanceContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TimetableView } from './components/TimetableView';
import { AttendanceRecordsView } from './components/AttendanceRecordsView';
import { BottomNav, NavTab } from './components/BottomNav';
import { PunchVerificationModal } from './components/PunchVerificationModal';
import { TimetableUploadModal } from './components/TimetableUploadModal';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <AttendanceProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        {/* App Header */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Main Body */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenUpload={() => setIsUploadOpen(true)}
              onNavigateToTimetable={() => setCurrentTab('timetable')}
              onNavigateToRecords={() => setCurrentTab('records')}
            />
          )}

          {currentTab === 'timetable' && (
            <TimetableView onOpenUpload={() => setIsUploadOpen(true)} />
          )}

          {currentTab === 'records' && <AttendanceRecordsView />}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Interactive Modals */}
        <PunchVerificationModal />
        <TimetableUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
        />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {/* Offline Jammer-Safe Indicator */}
        <OfflineIndicator />
      </div>
    </AttendanceProvider>
  );
}
