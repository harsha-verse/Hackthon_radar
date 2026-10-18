import React, { useState } from 'react';
import {
  AcademicScheduleItem,
  ActiveRoute,
  CollegeAcademicCalendar,
  HackathonEvent,
  SavedRegistrationStage,
  SourceAdapterStatus,
  StudentProfile,
  VerificationStatus,
} from './types/hackathon';
import {
  INITIAL_HACKATHONS,
  INITIAL_SOURCE_ADAPTERS,
  INITIAL_STUDENT_PROFILE,
  KARNATAKA_COLLEGES,
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyAcademicCalendarPage } from './pages/MyAcademicCalendarPage';
import { StudentHubPage } from './pages/StudentHubPage';
import { SubmitEventPage } from './pages/SubmitEventPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SourceIngestionPage } from './pages/SourceIngestionPage';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>('home');
  const [events, setEvents] = useState<HackathonEvent[]>(INITIAL_HACKATHONS);
  const [student, setStudent] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);
  const [colleges, setColleges] =
    useState<CollegeAcademicCalendar[]>(KARNATAKA_COLLEGES);
  const [adapters] = useState<SourceAdapterStatus[]>(INITIAL_SOURCE_ADAPTERS);
  const [selectedEventId, setSelectedEventId] = useState<string>(
    INITIAL_HACKATHONS[0].id
  );

  const [exploreInitialQuery, setExploreInitialQuery] = useState<string>('');
  const [exploreInitialDistrict, setExploreInitialDistrict] =
    useState<string>('All Districts');

  const savedIds = student.savedHackathons.map((s) => s.eventId);
  const activeCollege =
    colleges.find((c) => c.collegeId === student.collegeId) || colleges[0];

  const handleNavigate = (route: ActiveRoute) => {
    if (route === 'explore') {
      setExploreInitialQuery('');
      setExploreInitialDistrict('All Districts');
    }
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveRoute('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSave = (eventId: string) => {
    setStudent((prev) => {
      const exists = prev.savedHackathons.some((s) => s.eventId === eventId);
      if (exists) {
        return {
          ...prev,
          savedHackathons: prev.savedHackathons.filter(
            (s) => s.eventId !== eventId
          ),
        };
      }
      return {
        ...prev,
        savedHackathons: [
          ...prev.savedHackathons,
          {
            eventId,
            savedAt: new Date().toISOString(),
            stage: 'bookmarked',
            personalNotes: '',
            reminderEnabled: true,
          },
        ],
      };
    });
  };

  const handleUpdateSavedStage = (
    eventId: string,
    stage: SavedRegistrationStage
  ) => {
    setStudent((prev) => ({
      ...prev,
      savedHackathons: prev.savedHackathons.map((s) =>
        s.eventId === eventId ? { ...s, stage } : s
      ),
    }));
  };

  const handleQuickExplore = (options: {
    query?: string;
    district?: string;
  }) => {
    setExploreInitialQuery(options.query || '');
    setExploreInitialDistrict(options.district || 'All Districts');
    setActiveRoute('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCalendarItems = (
    collegeId: string,
    items: AcademicScheduleItem[]
  ) => {
    setColleges((prev) =>
      prev.map((col) =>
        col.collegeId === collegeId ? { ...col, items } : col
      )
    );
  };

  const handleSubmitNewEvent = (newEvent: HackathonEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleVerifyEvent = (eventId: string, status: VerificationStatus) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              verificationStatus: status,
              lastVerifiedAt:
                status === 'verified'
                  ? new Date().toISOString()
                  : ev.lastVerifiedAt,
            }
          : ev
      )
    );
  };

  const handleExpireEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId ? { ...ev, status: 'historical_archived' } : ev
      )
    );
  };

  const selectedEvent =
    events.find((e) => e.id === selectedEventId) || events[0];
  const selectedSavedRecord = student.savedHackathons.find(
    (s) => s.eventId === selectedEvent.id
  );
  const pendingAdminCount = events.filter(
    (e) => e.verificationStatus !== 'verified'
  ).length;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col justify-between">
      <Navbar
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        savedCount={savedIds.length}
        pendingAdminCount={pendingAdminCount}
      />

      <main className="flex-1">
        {activeRoute === 'home' && (
          <LandingPage
            events={events}
            student={student}
            collegeCalendar={activeCollege}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
            onQuickExplore={handleQuickExplore}
          />
        )}

        {activeRoute === 'explore' && (
          <ExplorePage
            key={`${exploreInitialQuery}-${exploreInitialDistrict}`}
            events={events}
            student={student}
            collegeCalendar={activeCollege}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSelectEvent={handleSelectEvent}
            initialQuery={exploreInitialQuery}
            initialDistrict={exploreInitialDistrict}
          />
        )}

        {activeRoute === 'details' && (
          <EventDetailsPage
            event={selectedEvent}
            student={student}
            collegeCalendar={activeCollege}
            isSaved={savedIds.includes(selectedEvent.id)}
            savedStage={selectedSavedRecord?.stage}
            onToggleSave={handleToggleSave}
            onUpdateStage={handleUpdateSavedStage}
            onBack={() => setActiveRoute('explore')}
            onNavigate={handleNavigate}
          />
        )}

        {activeRoute === 'calendar' && (
          <CalendarPage
            events={events}
            colleges={colleges}
            selectedCollegeId={student.collegeId}
            onSelectCollegeId={(id) => {
              const found = colleges.find((c) => c.collegeId === id);
              if (found) {
                setStudent((prev) => ({
                  ...prev,
                  collegeId: found.collegeId,
                  collegeName: found.collegeName,
                }));
              }
            }}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {activeRoute === 'my-academic-calendar' && (
          <MyAcademicCalendarPage
            student={student}
            onUpdateStudent={setStudent}
            collegeCalendar={activeCollege}
            onUpdateCalendarItems={handleUpdateCalendarItems}
            events={events}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
          />
        )}

        {(activeRoute === 'student-hub' || activeRoute === 'onboarding') && (
          <StudentHubPage
            key={activeRoute}
            initialSection={
              activeRoute === 'onboarding' ? 'onboarding' : 'dashboard'
            }
            student={student}
            onUpdateStudent={setStudent}
            events={events}
            colleges={colleges}
            onToggleSave={handleToggleSave}
            onUpdateStage={handleUpdateSavedStage}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
          />
        )}

        {activeRoute === 'submit-event' && (
          <SubmitEventPage
            existingEvents={events}
            onSubmitNewEvent={handleSubmitNewEvent}
            onNavigate={handleNavigate}
          />
        )}

        {activeRoute === 'sources' && (
          <SourceIngestionPage
            adapters={adapters}
            onAddIngestedEvent={handleSubmitNewEvent}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
          />
        )}

        {activeRoute === 'admin' && (
          <AdminDashboardPage
            events={events}
            onVerifyEvent={handleVerifyEvent}
            onExpireEvent={handleExpireEvent}
            onSelectEvent={handleSelectEvent}
            onNavigateToSubmit={() => setActiveRoute('submit-event')}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
