import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  Play,
  ShieldCheck,
} from 'lucide-react';
import {
  AcademicCommitmentCategory,
  AcademicScheduleItem,
  ActiveRoute,
  CollegeAcademicCalendar,
  HackathonEvent,
  StudentProfile,
  UploadedAcademicPdfRecord,
} from '../types/hackathon';
import {
  CompatibilityTestCaseResult,
  evaluateAcademicCompatibility,
  formatPrettyRange,
  runCompatibilityEngineTestSuite,
} from '../lib/compatibilityEngine';

interface MyAcademicCalendarPageProps {
  student: StudentProfile;
  onUpdateStudent: (updated: StudentProfile) => void;
  collegeCalendar: CollegeAcademicCalendar;
  onUpdateCalendarItems: (collegeId: string, items: AcademicScheduleItem[]) => void;
  events: HackathonEvent[];
  onSelectEvent: (eventId: string) => void;
  onNavigate: (route: ActiveRoute) => void;
}

export const MyAcademicCalendarPage: React.FC<MyAcademicCalendarPageProps> = ({
  student,
  onUpdateStudent,
  collegeCalendar,
  onUpdateCalendarItems,
  events,
  onSelectEvent,
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatusMsg, setExtractionStatusMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractionEngineUsed, setExtractionEngineUsed] = useState<string | null>(null);

  // Manual entry state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] =
    useState<AcademicCommitmentCategory>('internal_exam');
  const [newStart, setNewStart] = useState('2026-11-10');
  const [newEnd, setNewEnd] = useState('2026-11-10');
  const [newNotes, setNewNotes] = useState('');

  // Automated test suite results
  const [testResults, setTestResults] = useState<CompatibilityTestCaseResult[]>(() =>
    runCompatibilityEngineTestSuite()
  );

  const items = collegeCalendar.items;
  const unconfirmedItems = items.filter((i) => !i.confirmedByStudent);
  const confirmedItems = items.filter((i) => i.confirmedByStudent);

  // Handle real PDF file upload
  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setExtractionStatusMsg(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Invalid file format. Please upload a valid college academic calendar PDF (.pdf).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10 MB limit. Please upload a smaller academic calendar PDF.');
      return;
    }

    setIsExtracting(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const resStr = String(reader.result || '');
          const commaIdx = resStr.indexOf(',');
          resolve(commaIdx >= 0 ? resStr.slice(commaIdx + 1) : resStr);
        };
        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/academic-calendar/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          pdfBase64: base64Data,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'PDF extraction failed');
      }

      const extractedCommitments: AcademicScheduleItem[] = (
        data.commitments || []
      ).map((c: any, idx: number) => ({
        id: `pdf-ext-${Date.now()}-${idx}`,
        title: c.title || 'Extracted Academic Commitment',
        type: ([
          'internal_exam',
          'practical_exam',
          'semester_exam',
          'mandatory_event',
          'holiday',
        ].includes(c.type)
          ? c.type
          : 'internal_exam') as AcademicCommitmentCategory,
        startDate: c.startDate || '2026-11-10',
        endDate: c.endDate || c.startDate || '2026-11-10',
        semester: c.semester || data.semesterDetected || 'Odd Sem 2026',
        notes: c.notes || 'Extracted from uploaded academic calendar PDF.',
        sourceDocumentName: file.name,
        extractionConfidence: Number(c.extractionConfidence ?? 0.85),
        confirmedByStudent: false, // Always require student confirmation before using in compatibility engine!
        ambiguityFlag: c.ambiguityFlag || undefined,
      }));

      onUpdateCalendarItems(collegeCalendar.collegeId, [
        ...extractedCommitments,
        ...items,
      ]);

      const newPdfRecord: UploadedAcademicPdfRecord = {
        id: `pdf-${Date.now()}`,
        fileName: file.name,
        fileSizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        institutionDetected: data.institutionDetected || collegeCalendar.collegeName,
        academicYearDetected: data.academicYearDetected || '2026–2027',
        semesterDetected: data.semesterDetected || 'Odd Semester 2026',
        storagePrivacy: 'private_student_isolated',
        extractionMethod:
          data.extractionEngine === 'gemini-3.8-flash'
            ? 'gemini_pdf_vision'
            : 'text_parser',
        extractedCount: extractedCommitments.length,
        confirmedCount: 0,
      };

      onUpdateStudent({
        ...student,
        uploadedPdfs: [newPdfRecord, ...student.uploadedPdfs],
      });

      setExtractionEngineUsed(data.extractionEngine);
      setExtractionStatusMsg(
        `Extracted ${extractedCommitments.length} dated commitments from "${file.name}". Please review and confirm them below before they are used in compatibility calculations.`
      );
    } catch (err: any) {
      setUploadError(err?.message || 'Error processing PDF.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Simulate extracting a realistic college circular with an ambiguous date for instant testing
  const handleSimulateSamplePdfExtraction = async () => {
    setIsExtracting(true);
    setUploadError(null);
    try {
      const sampleCircularText = `
VISVESVARAYA TECHNOLOGICAL UNIVERSITY / BMSCE AUTONOMOUS CIRCULAR
Academic Calendar for Odd Semester 2026-2027 (B.E. III / V / VII Semesters)
1. Continuous Internal Evaluation I (CIE-1): 2026-11-10 to 2026-11-10
2. Department Practical & Systems Lab Exam: 2026-11-13 to 2026-11-13
3. Pre-Final / End-Semester Examination: 2026-11-20 to 2026-11-22
4. Mini-Project Phase-1 Jury Viva: Tentatively 27th November (exact year not printed on circular scan)
`;
      const response = await fetch('/api/academic-calendar/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'VTU_Odd_Sem_2026_27_Scanned_Circular.pdf',
          rawText: sampleCircularText,
        }),
      });
      const data = await response.json();

      const extractedCommitments: AcademicScheduleItem[] = (
        data.commitments || []
      ).map((c: any, idx: number) => ({
        id: `sim-ext-${Date.now()}-${idx}`,
        title: c.title,
        type: c.type as AcademicCommitmentCategory,
        startDate: c.startDate,
        endDate: c.endDate,
        semester: c.semester || 'Odd Sem 2026',
        notes: c.notes || '',
        sourceDocumentName: 'VTU_Odd_Sem_2026_27_Scanned_Circular.pdf',
        extractionConfidence: Number(c.extractionConfidence ?? 0.9),
        confirmedByStudent: false,
        ambiguityFlag: c.ambiguityFlag || undefined,
      }));

      onUpdateCalendarItems(collegeCalendar.collegeId, extractedCommitments);
      setExtractionEngineUsed(data.extractionEngine);
      setExtractionStatusMsg(
        `Extracted ${extractedCommitments.length} commitments from VTU_Odd_Sem_2026_27_Scanned_Circular.pdf. Notice that unconfirmed dates are held for your review.`
      );
    } catch (err: any) {
      setUploadError(err?.message || 'Failed sample extraction');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmCommitment = (id: string) => {
    onUpdateCalendarItems(
      collegeCalendar.collegeId,
      items.map((item) =>
        item.id === id
          ? { ...item, confirmedByStudent: true, ambiguityFlag: undefined }
          : item
      )
    );
  };

  const handleConfirmAll = () => {
    onUpdateCalendarItems(
      collegeCalendar.collegeId,
      items.map((item) => ({
        ...item,
        confirmedByStudent: true,
        ambiguityFlag: undefined,
      }))
    );
  };

  const handleUpdateCommitmentDate = (
    id: string,
    field: 'startDate' | 'endDate',
    value: string
  ) => {
    onUpdateCalendarItems(
      collegeCalendar.collegeId,
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteCommitment = (id: string) => {
    onUpdateCalendarItems(
      collegeCalendar.collegeId,
      items.filter((item) => item.id !== id)
    );
  };

  const handlePurgeUploadedPdf = (pdfId: string, fileName: string) => {
    onUpdateStudent({
      ...student,
      uploadedPdfs: student.uploadedPdfs.filter((p) => p.id !== pdfId),
    });
    onUpdateCalendarItems(
      collegeCalendar.collegeId,
      items.filter((i) => i.sourceDocumentName !== fileName)
    );
  };

  const handleAddManualCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const added: AcademicScheduleItem = {
      id: `manual-${Date.now()}`,
      title: newTitle.trim(),
      type: newCategory,
      startDate: newStart,
      endDate: newEnd,
      semester: 'Odd Sem 2026',
      notes: newNotes.trim() || 'Added manually by student.',
      sourceDocumentName: 'Manual Student Entry',
      extractionConfidence: 1.0,
      confirmedByStudent: true,
    };
    onUpdateCalendarItems(collegeCalendar.collegeId, [added, ...items]);
    setNewTitle('');
    setNewNotes('');
  };

  const current2026Events = events.filter((e) => e.editionYear >= 2026);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Page Header */}
      <div className="border-b border-[#27272A] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#A78BFA] font-medium mb-1">
            <span>Stage 3 & Stage 4 Implementation</span>
            <span aria-hidden="true">·</span>
            <span>Private Student Document Isolation</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#FAFAFA]">
            My Academic Calendar & Compatibility Engine
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1 max-w-3xl">
            Upload your college’s academic calendar PDF, confirm extracted exam and practical dates, configure your pre-exam preparation buffer, and see deterministic compatibility explanations across all 2026 hackathons.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#A1A1AA] bg-[#111114] border border-[#27272A] rounded-xl px-4 py-2.5 shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
          <span>Confirmed Commitments: {confirmedItems.length} · Pending Review: {unconfirmedItems.length}</span>
        </div>
      </div>

      {/* Top Row: PDF Upload Box + Preparation & Travel Buffer Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left 7 Columns: PDF Upload & Extraction */}
        <div className="lg:col-span-7 bg-[#111114] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                1. Upload College Academic Calendar PDF
              </h2>
              <span className="text-xs text-[#71717A] font-mono">
                Max 10 MB · Private Storage
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Upload an official college schedule PDF. Our server-side extraction pipeline identifies internal assessments, practicals, end-semester exams, mandatory events, and holidays, then places them in your review queue so ambiguous dates are never guessed silently.
            </p>

            {/* Upload Dropzone */}
            <label className="mt-2 border-2 border-dashed border-[#27272A] hover:border-[#8B5CF6] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#09090B]/60">
              <Upload className="w-7 h-7 text-[#8B5CF6] mb-2" />
              <span className="text-sm font-semibold text-[#FAFAFA]">
                {isExtracting
                  ? 'Extracting academic dates on server...'
                  : 'Click to select your College Academic Calendar (.pdf)'}
              </span>
              <span className="text-xs text-[#71717A] mt-1">
                Supports text-based PDFs and scanned circulars via server-side Gemini PDF analysis
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePdfFileUpload}
                disabled={isExtracting}
                className="hidden"
              />
            </label>

            {/* Instant Demo Preset Button for Beginners without a PDF handy */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="text-xs text-[#71717A]">
                Don’t have a college PDF file on your device right now?
              </span>
              <button
                type="button"
                disabled={isExtracting}
                onClick={handleSimulateSamplePdfExtraction}
                className="px-3.5 py-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#A78BFA] transition-colors"
              >
                Run Sample VTU / BMSCE 2026 PDF Extraction (Includes Ambiguous Date)
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
                {uploadError}
              </div>
            )}

            {extractionStatusMsg && (
              <div className="p-3.5 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs text-[#22C55E] space-y-1">
                <p className="font-semibold">
                  Extraction Complete ({extractionEngineUsed})
                </p>
                <p className="text-[#FAFAFA]/90">{extractionStatusMsg}</p>
              </div>
            )}
          </div>

          {/* Private Uploaded Documents List with Delete Control */}
          <div className="pt-4 border-t border-[#27272A] space-y-2.5">
            <h3 className="text-xs font-semibold text-[#FAFAFA]">
              Your Private Uploaded Academic Documents ({student.uploadedPdfs.length})
            </h3>
            {student.uploadedPdfs.length === 0 ? (
              <p className="text-xs text-[#71717A]">
                No PDF documents currently stored. Upload a PDF above to extract commitments.
              </p>
            ) : (
              <div className="space-y-2">
                {student.uploadedPdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="p-3 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-[#FAFAFA] truncate">
                          {pdf.fileName}
                        </p>
                        <p className="text-[11px] text-[#71717A]">
                          {pdf.institutionDetected} · {pdf.semesterDetected} · Isolated Private Bucket
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePurgeUploadedPdf(pdf.id, pdf.fileName)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#111114] hover:bg-[#EF4444]/20 border border-[#27272A] text-[#A1A1AA] hover:text-[#EF4444] transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete PDF</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Preparation Buffer & Travel Settings */}
        <div className="lg:col-span-5 bg-[#111114] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
              2. Compatibility Buffer Rules
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              The compatibility engine uses deterministic date math. Changing your preparation buffer or travel buffer below immediately recalculates compatibility across all hackathons.
            </p>

            {/* Preparation Buffer Selector */}
            <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#FAFAFA]">
                  Pre-Examination Preparation Buffer
                </label>
                <span className="font-mono tabular-nums text-xs font-bold text-[#8B5CF6]">
                  {student.prepBufferDays} {student.prepBufferDays === 1 ? 'day' : 'days'} before exam
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA]">
                Example: With a 2-day buffer before the Nov 20 exam, Nov 18 and Nov 19 are treated as protected study days (flagging events on Nov 18–19 as Preparation Risk).
              </p>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[0, 1, 2, 3, 5].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() =>
                      onUpdateStudent({ ...student, prepBufferDays: days })
                    }
                    className={`py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                      student.prepBufferDays === days
                        ? 'bg-[#8B5CF6] border-[#8B5CF6] text-[#FAFAFA]'
                        : 'bg-[#111114] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Buffer Selector */}
            <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#FAFAFA]">
                  Out-of-City Offline Travel Buffer
                </label>
                <span className="font-mono tabular-nums text-xs font-bold text-[#38BDF8]">
                  ±{student.travelBufferDays} {student.travelBufferDays === 1 ? 'day' : 'days'}
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA]">
                Adds travel/recovery buffer before and after physical hackathons outside {student.city}.
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[0, 1, 2].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() =>
                      onUpdateStudent({ ...student, travelBufferDays: days })
                    }
                    className={`py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                      student.travelBufferDays === days
                        ? 'bg-[#8B5CF6] border-[#8B5CF6] text-[#FAFAFA]'
                        : 'bg-[#111114] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]'
                    }`}
                  >
                    ±{days} day{days === 1 ? '' : 's'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#27272A] text-xs text-[#71717A]">
            Active Student Location: <span className="text-[#FAFAFA] font-medium">{student.city}</span> · Max Travel Limit: <span className="font-mono text-[#FAFAFA]">{student.preferredTravelDistanceKm} km</span>
          </div>
        </div>
      </div>

      {/* Section 3: Extracted Academic Commitments Review & Confirmation Table */}
      <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
              3. Review & Confirm Extracted Academic Commitments ({items.length})
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Unconfirmed or ambiguous entries are flagged below. Edit any date if needed and click "Confirm" to activate it in compatibility calculations.
            </p>
          </div>
          {unconfirmedItems.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmAll}
              className="px-4 py-2 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-xs font-semibold text-[#09090B] shrink-0"
            >
              Confirm All {unconfirmedItems.length} Pending Dates
            </button>
          )}
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                !item.confirmedByStudent
                  ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40'
                  : 'bg-[#18181B] border-[#27272A]'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-[#FAFAFA]">
                    {item.type === 'internal_exam'
                      ? 'Internal Exam'
                      : item.type === 'practical_exam'
                      ? 'Practical / Lab Exam'
                      : item.type === 'semester_exam'
                      ? 'End-Semester Exam'
                      : item.type === 'mandatory_event'
                      ? 'Mandatory College Event'
                      : 'Holiday / Break'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-[#A1A1AA]">
                    Confidence: {Math.round(item.extractionConfidence * 100)}%
                  </span>
                  {item.sourceDocumentName && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#71717A] font-mono">
                        Source: {item.sourceDocumentName}
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  {item.confirmedByStudent ? (
                    <span className="text-[#22C55E] font-medium">
                      Confirmed by Student
                    </span>
                  ) : (
                    <span className="text-[#F59E0B] font-semibold">
                      Awaiting Student Confirmation
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-[#FAFAFA]">{item.title}</h3>
                {item.ambiguityFlag && (
                  <p className="text-xs text-[#F59E0B] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.ambiguityFlag}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <input
                    type="date"
                    value={item.startDate}
                    onChange={(e) =>
                      handleUpdateCommitmentDate(item.id, 'startDate', e.target.value)
                    }
                    aria-label={`Start date for ${item.title}`}
                    className="bg-[#111114] border border-[#27272A] rounded px-2.5 py-1.5 text-xs text-[#FAFAFA]"
                  />
                  <span className="text-[#71717A]">to</span>
                  <input
                    type="date"
                    value={item.endDate}
                    onChange={(e) =>
                      handleUpdateCommitmentDate(item.id, 'endDate', e.target.value)
                    }
                    aria-label={`End date for ${item.title}`}
                    className="bg-[#111114] border border-[#27272A] rounded px-2.5 py-1.5 text-xs text-[#FAFAFA]"
                  />
                </div>

                {!item.confirmedByStudent && (
                  <button
                    type="button"
                    onClick={() => handleConfirmCommitment(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#22C55E] text-[#09090B] text-xs font-semibold"
                  >
                    Confirm Date
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteCommitment(item.id)}
                  aria-label={`Delete ${item.title}`}
                  className="p-2 rounded-lg bg-[#111114] border border-[#27272A] text-[#71717A] hover:text-[#EF4444]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Manual Entry Form */}
        <form
          onSubmit={handleAddManualCommitment}
          className="pt-5 border-t border-[#27272A] grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <label className="text-xs text-[#A1A1AA] block mb-1">
              Add Exam / Practical / Mandatory Commitment
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Operating Systems Practical Exam"
              className="w-full px-3 py-2 rounded-lg bg-[#18181B] border border-[#27272A] text-xs text-[#FAFAFA]"
            />
          </div>
          <div>
            <label className="text-xs text-[#A1A1AA] block mb-1">Category</label>
            <select
              value={newCategory}
              onChange={(e) =>
                setNewCategory(e.target.value as AcademicCommitmentCategory)
              }
              className="w-full px-3 py-2 rounded-lg bg-[#18181B] border border-[#27272A] text-xs text-[#FAFAFA]"
            >
              <option value="internal_exam">Internal Exam</option>
              <option value="practical_exam">Practical Exam</option>
              <option value="semester_exam">End-Semester Exam</option>
              <option value="mandatory_event">Mandatory Event</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#A1A1AA] block mb-1">Date</label>
            <input
              type="date"
              value={newStart}
              onChange={(e) => {
                setNewStart(e.target.value);
                setNewEnd(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#18181B] border border-[#27272A] text-xs text-[#FAFAFA] font-mono"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-[#FAFAFA]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Confirmed</span>
          </button>
        </form>
      </div>

      {/* Section 4: Live Compatibility Matrix Across Current 2026 Hackathons */}
      <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
        <div className="border-b border-[#27272A] pb-4">
          <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
            4. Live Compatibility Matrix Against Your Confirmed Schedule
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Evaluates actual participation dates (not registration deadlines) against your confirmed commitments, {student.prepBufferDays}-day preparation buffer, and ±{student.travelBufferDays}-day inter-city travel window.
          </p>
        </div>

        <div className="space-y-3">
          {current2026Events.map((ev) => {
            const comp = evaluateAcademicCompatibility(ev, items, student);
            return (
              <div
                key={ev.id}
                className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`font-semibold ${
                        comp.status === 'compatible'
                          ? 'text-[#22C55E]'
                          : comp.status === 'academic_conflict'
                          ? 'text-[#EF4444]'
                          : comp.status === 'prep_risk'
                          ? 'text-[#F59E0B]'
                          : comp.status === 'travel_risk'
                          ? 'text-[#38BDF8]'
                          : 'text-[#A78BFA]'
                      }`}
                    >
                      {comp.badgeLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-[#FAFAFA]">
                      Participation: {formatPrettyRange(ev.startDate, ev.endDate)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#A1A1AA]">
                      {ev.city} ({ev.mode})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(ev.id)}
                    className="text-sm font-bold text-[#FAFAFA] hover:text-[#A78BFA] text-left block"
                  >
                    {ev.title}
                  </button>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {comp.headlineReasoning}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectEvent(ev.id)}
                  className="px-3.5 py-2 rounded-lg bg-[#111114] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#FAFAFA] shrink-0 self-start lg:self-center"
                >
                  Inspect Round-by-Round Proof
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: Automated Deterministic Compatibility Test Suite Runner (Stage 4 Verification) */}
      <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
              5. Deterministic Compatibility Engine Automated Unit Tests
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Verifies the exact November exam schedule test cases from Section 2 & Section 8 of the specification (Nov 10 Internal, Nov 13 Practical, Nov 20 End-Sem + 2-day prep buffer).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTestResults(runCompatibilityEngineTestSuite())}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-[#FAFAFA] shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Re-Run All {testResults.length} Unit Assertions</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testResults.map((tr) => (
            <div
              key={tr.id}
              className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#FAFAFA]">{tr.name}</span>
                <span
                  className={`font-mono font-semibold ${
                    tr.passed ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {tr.passed ? 'PASS' : 'FAIL'} ({tr.actualStatus})
                </span>
              </div>
              <p className="text-[#A1A1AA]">{tr.scenarioDescription}</p>
              <p className="font-mono text-[11px] text-[#A78BFA] pt-1 border-t border-[#27272A]">
                Output: {tr.explanationOutput}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
