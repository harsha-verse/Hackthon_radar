import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  CollegeAcademicCalendar,
  HackathonEvent,
} from '../types/hackathon';
import { formatDateRange, formatShortDate, getDaysRemaining } from '../data/mockData';

interface CalendarPageProps {
  events: HackathonEvent[];
  colleges: CollegeAcademicCalendar[];
  selectedCollegeId: string;
  onSelectCollegeId: (id: string) => void;
  onSelectEvent: (eventId: string) => void;
}

const MONTHS = [
  { key: '2026-10', label: 'October 2026', year: 2026, monthIndex: 9, days: 31, startDayOfWeek: 4 },
  { key: '2026-11', label: 'November 2026', year: 2026, monthIndex: 10, days: 30, startDayOfWeek: 0 },
  { key: '2026-12', label: 'December 2026', year: 2026, monthIndex: 11, days: 31, startDayOfWeek: 2 },
];

export const CalendarPage: React.FC<CalendarPageProps> = ({
  events,
  colleges,
  selectedCollegeId,
  onSelectCollegeId,
  onSelectEvent,
}) => {
  const [monthIdx, setMonthIdx] = useState(1); // Default November 2026 peak season
  const [selectedDate, setSelectedDate] = useState('2026-11-13');
  const [viewType, setViewType] = useState<'month' | 'agenda'>('month');
  const [showAcademicOverlay, setShowAcademicOverlay] = useState(true);

  const currentMonth = MONTHS[monthIdx];
  const activeCollege =
    colleges.find((c) => c.collegeId === selectedCollegeId) || colleges[0];

  const current2026Events = events.filter((e) => e.editionYear >= 2026);

  const getItemsForDate = (dateStr: string) => {
    const hackathonsRunning = current2026Events.filter(
      (ev) => ev.startDate && ev.endDate && dateStr >= ev.startDate && dateStr <= ev.endDate
    );
    const registrationDeadlines = current2026Events.filter(
      (ev) => ev.registrationCloseDate === dateStr
    );
    const roundMilestones = current2026Events.flatMap((ev) =>
      ev.rounds
        .filter((r) => r.type === 'submission' && r.endDate === dateStr)
        .map((r) => ({ event: ev, round: r }))
    );
    const academicItems = showAcademicOverlay
      ? activeCollege.items.filter(
          (item) => dateStr >= item.startDate && dateStr <= item.endDate
        )
      : [];

    return {
      hackathonsRunning,
      registrationDeadlines,
      roundMilestones,
      academicItems,
    };
  };

  const selectedDayDetails = useMemo(
    () => getItemsForDate(selectedDate),
    [selectedDate, current2026Events, activeCollege, showAcademicOverlay]
  );

  const dayCells = [];
  for (let i = 0; i < currentMonth.startDayOfWeek; i++) {
    dayCells.push(null);
  }
  for (let d = 1; d <= currentMonth.days; d++) {
    const dateStr = `${currentMonth.key}-${String(d).padStart(2, '0')}`;
    dayCells.push({ day: d, dateStr });
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#27272A] pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#FAFAFA]">
            2026 Hackathon & Academic Calendar
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Inspect November–December 2026 hackathon participation windows alongside {activeCollege.shortName} examinations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111114] border border-[#27272A] rounded-lg px-3 py-2">
            <label htmlFor="college-cal-select" className="text-xs text-[#71717A] whitespace-nowrap">
              Academic Overlay:
            </label>
            <select
              id="college-cal-select"
              value={selectedCollegeId}
              onChange={(e) => onSelectCollegeId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#FAFAFA] focus:outline-none"
            >
              {colleges.map((c) => (
                <option key={c.collegeId} value={c.collegeId} className="bg-[#111114]">
                  {c.shortName}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#A1A1AA] bg-[#111114] border border-[#27272A] rounded-lg px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAcademicOverlay}
              onChange={(e) => setShowAcademicOverlay(e.target.checked)}
              className="rounded border-[#27272A] bg-[#18181B] text-[#8B5CF6]"
            />
            <span>Show Exam / Holiday Dates</span>
          </label>
        </div>
      </div>

      {/* Calendar Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111114] border border-[#27272A] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setMonthIdx(1);
              setSelectedDate('2026-11-13');
            }}
            className="px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#FAFAFA] transition-colors"
          >
            Jump to Nov 13 Conflict Date
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={monthIdx === 0}
              onClick={() => {
                const next = Math.max(0, monthIdx - 1);
                setMonthIdx(next);
                setSelectedDate(`${MONTHS[next].key}-15`);
              }}
              aria-label="Previous month"
              className="p-1.5 rounded-lg bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={monthIdx === MONTHS.length - 1}
              onClick={() => {
                const next = Math.min(MONTHS.length - 1, monthIdx + 1);
                setMonthIdx(next);
                setSelectedDate(`${MONTHS[next].key}-15`);
              }}
              aria-label="Next month"
              className="p-1.5 rounded-lg bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
            {currentMonth.label}
          </h2>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#18181B] border border-[#27272A] rounded-lg">
          <button
            type="button"
            onClick={() => setViewType('month')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewType === 'month'
                ? 'bg-[#8B5CF6] text-[#FAFAFA]'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
            }`}
          >
            Month Grid
          </button>
          <button
            type="button"
            onClick={() => setViewType('agenda')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewType === 'agenda'
                ? 'bg-[#8B5CF6] text-[#FAFAFA]'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
            }`}
          >
            Chronological List
          </button>
        </div>
      </div>

      {/* Main Calendar Grid + Selected Date Side Panel */}
      {viewType === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-[#111114] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[#27272A] bg-[#18181B]/60 text-center py-2.5 text-xs font-semibold text-[#A1A1AA]">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-[#27272A]">
              {dayCells.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[104px] bg-[#09090B]/40 p-2"
                    />
                  );
                }

                const items = getItemsForDate(cell.dateStr);
                const isSelected = selectedDate === cell.dateStr;
                const hasExam = items.academicItems.some(
                  (a) => a.type !== 'holiday'
                );
                const hasConflict =
                  hasExam && items.hackathonsRunning.length > 0;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[104px] p-2 text-left flex flex-col justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8B5CF6] ${
                      isSelected ? 'bg-[#8B5CF6]/15' : 'hover:bg-[#18181B]/70'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`font-mono tabular-nums text-xs font-semibold ${
                          isSelected ? 'text-[#A78BFA]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {hasConflict && (
                        <AlertTriangle
                          className="w-3.5 h-3.5 text-[#EF4444]"
                          aria-label="Academic conflict warning"
                        />
                      )}
                    </div>

                    <div className="space-y-1 mt-1.5 w-full overflow-hidden">
                      {items.hackathonsRunning.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#8B5CF6]/25 text-[#FAFAFA] truncate"
                        >
                          {ev.title.split(' ')[0]} {ev.title.split(' ')[1]}
                        </div>
                      ))}

                      {items.registrationDeadlines.map((ev) => (
                        <div
                          key={`reg-${ev.id}`}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#22C55E]/20 text-[#22C55E] truncate"
                        >
                          Reg Due: {ev.title.split(' ')[0]}
                        </div>
                      ))}

                      {items.academicItems.map((acad) => (
                        <div
                          key={acad.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                            acad.type === 'holiday'
                              ? 'bg-[#27272A] text-[#A1A1AA]'
                              : 'bg-[#EF4444]/20 text-[#EF4444]'
                          }`}
                        >
                          {acad.title}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="lg:col-span-4 bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
            <div className="border-b border-[#27272A] pb-4">
              <p className="text-xs text-[#A1A1AA]">Selected Calendar Date</p>
              <h3 className="font-display text-lg font-bold text-[#FAFAFA] mt-0.5">
                {formatShortDate(selectedDate)}
              </h3>
            </div>

            {selectedDayDetails.academicItems.some((i) => i.type !== 'holiday') &&
              selectedDayDetails.hackathonsRunning.length > 0 && (
                <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Direct Participation & Exam Overlap</span>
                  </div>
                  <p className="text-[#FAFAFA]/90">
                    {activeCollege.shortName} has a scheduled examination on this date that overlaps an active hackathon participation window.
                  </p>
                </div>
              )}

            <div className="space-y-4">
              {selectedDayDetails.hackathonsRunning.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2"
                >
                  <div className="text-xs text-[#A78BFA] font-medium">
                    Participation Window · {ev.city} ({ev.mode})
                  </div>
                  <h4 className="text-sm font-semibold text-[#FAFAFA]">{ev.title}</h4>
                  <p className="text-xs font-mono tabular-nums text-[#A1A1AA]">
                    Event: {formatDateRange(ev.startDate, ev.endDate)}
                  </p>
                  <p className="text-xs font-mono tabular-nums text-[#22C55E]">
                    Reg. Closes: {formatShortDate(ev.registrationCloseDate)} (
                    {getDaysRemaining(ev.registrationCloseDate)}d left)
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(ev.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#A78BFA] hover:text-[#FAFAFA] pt-1"
                  >
                    <span>View Compatibility Proof</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {selectedDayDetails.academicItems.map((acad) => (
                <div
                  key={acad.id}
                  className="p-4 rounded-xl bg-[#18181B] border border-[#EF4444]/40 space-y-1.5"
                >
                  <div className="text-xs font-semibold text-[#EF4444]">
                    {activeCollege.shortName} ·{' '}
                    {acad.type === 'holiday' ? 'Holiday' : 'Confirmed Examination'}
                  </div>
                  <h4 className="text-sm font-semibold text-[#FAFAFA]">{acad.title}</h4>
                  <p className="text-xs font-mono tabular-nums text-[#A1A1AA]">
                    {formatDateRange(acad.startDate, acad.endDate)} · {acad.semester}
                  </p>
                  <p className="text-xs text-[#71717A]">{acad.notes}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : (
        <div className="bg-[#111114] border border-[#27272A] rounded-xl divide-y divide-[#27272A]">
          {current2026Events.map((ev) => (
            <div
              key={ev.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#18181B]/60 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-[#A78BFA]">
                  <span>Participation: {formatDateRange(ev.startDate, ev.endDate)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#22C55E]">
                    Reg Deadline: {formatShortDate(ev.registrationCloseDate)}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#FAFAFA]">{ev.title}</h3>
                <p className="text-xs text-[#A1A1AA]">
                  {ev.organizingCollege} · {ev.city} ({ev.mode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectEvent(ev.id)}
                className="px-4 py-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#FAFAFA] self-start sm:self-center shrink-0"
              >
                View Compatibility
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
