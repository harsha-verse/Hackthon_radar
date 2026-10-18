import React from 'react';
import { HackathonEvent } from '../types/hackathon';

export const BrandRadarLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="16" cy="16" r="13.5" stroke="#8B5CF6" strokeWidth="1.75" strokeOpacity="0.45" />
    <circle cx="16" cy="16" r="8.5" stroke="#6366F1" strokeWidth="1.5" strokeOpacity="0.7" />
    <path
      d="M16 16L25.5 6.5"
      stroke="#A78BFA"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M11 11V21M21 11V21M11 16H21"
      stroke="#FAFAFA"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="22.5" cy="9.5" r="2.2" fill="#8B5CF6" />
  </svg>
);

export const EventArtworkBanner: React.FC<{
  variant: HackathonEvent['artworkVariant'];
  category: HackathonEvent['category'];
  city: string;
  className?: string;
}> = ({ variant, category, city, className = 'h-40 w-full' }) => {
  const paletteMap: Record<
    HackathonEvent['artworkVariant'],
    { bg: string; accent: string; secondary: string; grid: string; code: string }
  > = {
    bengaluru_cloud: {
      bg: 'from-[#131126] via-[#151521] to-[#0D0D12]',
      accent: '#8B5CF6',
      secondary: '#38BDF8',
      grid: 'rgba(139, 92, 246, 0.14)',
      code: 'BLR // SDG-BUILD',
    },
    nitk_robotics: {
      bg: 'from-[#101C24] via-[#121620] to-[#0B0D12]',
      accent: '#38BDF8',
      secondary: '#8B5CF6',
      grid: 'rgba(56, 189, 248, 0.14)',
      code: 'NITK // EMBEDDED-36H',
    },
    bmsce_code: {
      bg: 'from-[#1B1328] via-[#14131D] to-[#0C0C10]',
      accent: '#A855F7',
      secondary: '#6366F1',
      grid: 'rgba(168, 85, 247, 0.14)',
      code: 'BMSCE // URBAN-AI',
    },
    mysuru_iot: {
      bg: 'from-[#11221E] via-[#12181B] to-[#0B0E10]',
      accent: '#22C55E',
      secondary: '#38BDF8',
      grid: 'rgba(34, 197, 94, 0.14)',
      code: 'MYS // CIVIC-IOT',
    },
    kle_sprint: {
      bg: 'from-[#1D1811] via-[#161418] to-[#0C0C10]',
      accent: '#F59E0B',
      secondary: '#8B5CF6',
      grid: 'rgba(245, 158, 11, 0.14)',
      code: 'HUB // CLOUD-SPRINT',
    },
    mandya_agri: {
      bg: 'from-[#132217] via-[#121816] to-[#0A0D0C]',
      accent: '#22C55E',
      secondary: '#F59E0B',
      grid: 'rgba(34, 197, 94, 0.15)',
      code: 'MND // AGRI-SENSOR',
    },
    rvce_cyber: {
      bg: 'from-[#221219] via-[#16131A] to-[#0B0B0E]',
      accent: '#EC4899',
      secondary: '#6366F1',
      grid: 'rgba(236, 72, 153, 0.14)',
      code: 'RVCE // ZERO-TRUST',
    },
  };

  const theme = paletteMap[variant] || paletteMap.bengaluru_cloud;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${theme.bg} border-b border-[#27272A] select-none ${className}`}
    >
      <svg
        viewBox="0 0 400 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id={`grid-${variant}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke={theme.grid}
              strokeWidth="0.75"
            />
          </pattern>
        </defs>
        <rect width="400" height="180" fill={`url(#grid-${variant})`} />

        {/* Radar arc and architectural schematic geometry */}
        <circle
          cx="320"
          cy="90"
          r="72"
          stroke={theme.accent}
          strokeOpacity="0.22"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        <circle
          cx="320"
          cy="90"
          r="44"
          stroke={theme.secondary}
          strokeOpacity="0.3"
          strokeWidth="1.2"
        />
        <path
          d="M320 90 L372 42"
          stroke={theme.accent}
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />

        {/* Isometric circuit / node pathways */}
        <path
          d="M28 132 H105 L132 105 H215 L238 82 H320"
          stroke={theme.accent}
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M28 148 H145 L168 125 H260"
          stroke={theme.secondary}
          strokeOpacity="0.3"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="105" cy="132" r="3" fill={theme.accent} />
        <circle cx="215" cy="105" r="3" fill={theme.secondary} />
        <circle cx="320" cy="90" r="4.5" fill={theme.accent} />

        {/* Subtle schematic window */}
        <rect
          x="28"
          y="28"
          width="156"
          height="64"
          rx="6"
          fill="#09090B"
          fillOpacity="0.65"
          stroke="#27272A"
          strokeWidth="1"
        />
        <line x1="40" y1="46" x2="112" y2="46" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="60" x2="154" y2="60" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="40" y1="72" x2="132" y2="72" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Measured bottom scrim for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090B]/90 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-[#A1A1AA] font-mono">
        <span>{city}</span>
        <span className="uppercase tracking-wider text-[#FAFAFA]/80">
          {category === 'both' ? 'Software + Hardware' : category}
        </span>
      </div>
    </div>
  );
};

export const KarnatakaHeroRadarCanvas: React.FC<{
  onSelectDistrict: (district: string) => void;
}> = ({ onSelectDistrict }) => {
  const hubs = [
    { name: 'Bengaluru', district: 'Bengaluru Urban', count: 3, x: '64%', y: '68%' },
    { name: 'Mysuru', district: 'Mysuru', count: 1, x: '44%', y: '76%' },
    { name: 'Mandya', district: 'Mandya', count: 1, x: '53%', y: '70%' },
    { name: 'Surathkal', district: 'Dakshina Kannada', count: 1, x: '22%', y: '64%' },
    { name: 'Hubballi', district: 'Dharwad', count: 1, x: '38%', y: '28%' },
  ];

  return (
    <div className="relative h-full min-h-[360px] w-full rounded-xl bg-[#111114] border border-[#27272A] p-6 flex flex-col justify-between overflow-hidden">
      {/* Subtle radar SVG backdrop */}
      <svg
        viewBox="0 0 480 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="radarGlow" cx="55%" cy="58%" r="55%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#6366F1" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="480" height="360" fill="url(#radarGlow)" />
        <circle cx="264" cy="210" r="165" stroke="#27272A" strokeWidth="1" />
        <circle cx="264" cy="210" r="115" stroke="#27272A" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="264" cy="210" r="65" stroke="#8B5CF6" strokeOpacity="0.35" strokeWidth="1.2" />
        <line x1="264" y1="20" x2="264" y2="340" stroke="#27272A" strokeWidth="0.75" />
        <line x1="60" y1="210" x2="460" y2="210" stroke="#27272A" strokeWidth="0.75" />
        {/* Connecting regional corridor lines */}
        <path
          d="M182 100 L106 230 L211 273 L254 252 L307 244"
          stroke="#6366F1"
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>

      {/* Top header inside the visual frame */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#27272A]/80 pb-3">
        <div>
          <p className="text-xs font-medium text-[#A1A1AA]">Karnataka Regional Coverage</p>
          <h3 className="text-sm font-semibold text-[#FAFAFA] mt-0.5">
            Interactive District Radar — Click a node to filter
          </h3>
        </div>
        <span className="text-xs font-mono tabular-nums text-[#A1A1AA]">
          5 Clusters Tracked
        </span>
      </div>

      {/* Interactive Regional Hub Buttons */}
      <div className="relative z-10 my-auto py-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {hubs.map((hub) => (
          <button
            key={hub.name}
            type="button"
            onClick={() => onSelectDistrict(hub.district)}
            className="text-left p-3 rounded-lg bg-[#18181B]/90 hover:bg-[#27272A]/80 border border-[#27272A] hover:border-[#8B5CF6]/60 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FAFAFA] group-hover:text-[#A78BFA] transition-colors">
                {hub.name}
              </span>
              <span className="text-xs font-mono tabular-nums text-[#8B5CF6]">
                {hub.count}
              </span>
            </div>
            <p className="text-[11px] text-[#71717A] mt-1 truncate">
              {hub.district}
            </p>
          </button>
        ))}
      </div>

      {/* Bottom verification note */}
      <div className="relative z-10 pt-3 border-t border-[#27272A]/80 flex items-center justify-between text-xs text-[#A1A1AA]">
        <span>Source-verified deadlines · Academic conflict aware</span>
        <span className="font-mono tabular-nums text-[#FAFAFA]">Jan – Mar 2025</span>
      </div>
    </div>
  );
};
