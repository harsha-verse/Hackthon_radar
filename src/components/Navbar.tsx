import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ActiveRoute } from '../types/hackathon';

interface NavbarProps {
  activeRoute: ActiveRoute;
  onNavigate: (route: ActiveRoute) => void;
  savedCount: number;
  pendingAdminCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRoute,
  onNavigate,
  savedCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Strict 3-Zone Top Bar Contract: 5 concise single-line links
  const navItems: { id: ActiveRoute; label: string }[] = [
    { id: 'explore', label: 'Explore' },
    { id: 'my-academic-calendar', label: 'Academic PDF' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'sources', label: 'Sources' },
    { id: 'admin', label: 'Admin' },
  ];

  const handleNav = (route: ActiveRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#09090B]/95 backdrop-blur-md border-b border-[#27272A]">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single text element wordmark in the display face */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-display text-lg font-bold tracking-tight text-[#FAFAFA] hover:text-[#A78BFA] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded"
        >
          Hackathon Radar
        </button>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#A1A1AA]"
        >
          {navItems.map((item) => {
            const isActive =
              activeRoute === item.id ||
              (item.id === 'explore' && activeRoute === 'details');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
                  isActive
                    ? 'text-[#FAFAFA] border-[#8B5CF6]'
                    : 'text-[#A1A1AA] border-transparent hover:text-[#FAFAFA] hover:border-[#27272A]'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-xs`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('student-hub')}
            className="px-4 py-2 text-xs font-semibold text-[#FAFAFA] bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAFAFA]"
          >
            {savedCount > 0 ? `Student Hub (${savedCount})` : 'Student Hub'}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] border border-[#27272A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#27272A] bg-[#111114] px-4 py-3 space-y-1">
          {[
            ...navItems,
            { id: 'student-hub' as ActiveRoute, label: 'Student Hub & Saved' },
            { id: 'submit-event' as ActiveRoute, label: 'Submit Event' },
          ].map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#18181B] text-[#FAFAFA]'
                    : 'text-[#A1A1AA] hover:bg-[#18181B]/60 hover:text-[#FAFAFA]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
