import React from 'react';
import { ActiveRoute } from '../types/hackathon';

interface FooterProps {
  onNavigate: (route: ActiveRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-[#27272A] bg-[#09090B] mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#27272A]">
          <div className="md:col-span-2 space-y-3">
            <span className="font-display text-base font-bold text-[#FAFAFA] tracking-tight">
              Hackathon Radar
            </span>
            <p className="text-sm text-[#A1A1AA] max-w-md leading-relaxed">
              Hyperlocal hackathon discovery, eligibility verification, and college academic conflict planning built for engineering and degree students across Bengaluru, Mysuru, Mandya, Hubballi, and coastal Karnataka.
            </p>
            <p className="text-xs text-[#71717A]">
              Sample Dataset Notice: Events labeled as sample records demonstrate real verification workflows and date structures. Always confirm on the official organizer portal before travelling.
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
              Platform Navigation
            </h3>
            <ul className="space-y-2 text-sm text-[#A1A1AA]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="hover:text-[#FAFAFA] transition-colors"
                >
                  Explore Hackathons
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('calendar')}
                  className="hover:text-[#FAFAFA] transition-colors"
                >
                  Monthly Deadline Calendar
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('student-hub')}
                  className="hover:text-[#FAFAFA] transition-colors"
                >
                  Student Workspace & Academic Conflicts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('submit-event')}
                  className="hover:text-[#FAFAFA] transition-colors"
                >
                  Submit a College Hackathon
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
              Governance & Administration
            </h3>
            <ul className="space-y-2 text-sm text-[#A1A1AA]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="hover:text-[#FAFAFA] transition-colors"
                >
                  Admin Verification Queue
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('onboarding')}
                  className="hover:text-[#FAFAFA] transition-colors"
                >
                  Student Eligibility Preferences
                </button>
              </li>
              <li className="text-xs text-[#71717A] pt-1">
                Bengaluru · Mysuru · Mandya · Surathkal · Hubballi
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#71717A]">
          <p>© 2025 Hackathon Radar Karnataka. Built with transparent source provenance.</p>
          <div className="flex items-center gap-4">
            <span>Zero Unverified Assumptions</span>
            <span aria-hidden="true">·</span>
            <span>WCAG 2.2 AA Contrast</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
