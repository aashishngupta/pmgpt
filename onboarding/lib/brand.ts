/**
 * pmGPT Design System — Brand Tokens
 *
 * Single source of truth for all visual decisions.
 * Edit this file to propagate changes across the entire portal.
 *
 * Benchmark: Linear · Vercel Dashboard · Anthropic Console
 * Character:  Professional · Precise · Trustworthy · Intelligent
 */

// ── Core palette ──────────────────────────────────────────────────────────────

export const palette = {
  white:   '#FFFFFF',

  // Page & surface
  canvas:   '#F7F8FA',   // page background — cool near-white
  surface:  '#FFFFFF',   // card / panel
  elevated: '#F1F3F7',   // hover state, highlighted row

  // Sidebar — dark navigation panel (Linear-style)
  sidebarBg:     '#0D1117',
  sidebarHover:  '#161B22',
  sidebarActive: '#1C2333',
  sidebarBorder: '#21262D',

  // Text — content-area ink scale
  ink:  '#0F172A',   // titles, primary labels
  ink2: '#475569',   // body text, descriptions
  ink3: '#94A3B8',   // timestamps, hints, secondary metadata
  ink4: '#CBD5E1',   // placeholder, disabled

  // Text — on dark sidebar
  inkInv:  '#E2E8F0',   // active / primary on dark bg
  inkInv2: '#7D8DA8',   // muted on dark bg

  // Brand accent — the only color with personality
  accent:     '#3B82F6',
  accentDim:  '#2563EB',   // hover / pressed
  accentBg:   '#EFF6FF',   // tinted highlight bg
  accentText: '#1D4ED8',   // accent text on white bg

  // Borders
  line:  '#E2E8F0',   // standard borders
  line2: '#F1F5F9',   // subtle row dividers

  // Semantic status
  green:   '#10B981',
  greenBg: '#F0FDF4',
  amber:   '#D97706',
  amberBg: '#FFFBEB',
  red:     '#EF4444',
  redBg:   '#FEF2F2',
} as const;

// ── Typography ────────────────────────────────────────────────────────────────

export const typography = {
  fontSans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontMono: '"JetBrains Mono", "Fira Code", Menlo, "Courier New", monospace',

  // Size scale
  sizeXs:   '11px',
  sizeSm:   '12px',
  sizeBase: '13px',
  sizeMd:   '14px',
  sizeLg:   '16px',
  sizeXl:   '18px',
  size2xl:  '22px',
  size3xl:  '28px',

  // Weights
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
} as const;

// ── Radii ────────────────────────────────────────────────────────────────────

export const radius = {
  sm:  '4px',
  md:  '6px',
  lg:  '8px',
  xl:  '10px',
  '2xl': '12px',
} as const;

// ── Component design decisions ────────────────────────────────────────────────

export const tokens = {
  card: {
    bg:     palette.surface,
    border: palette.line,
  },
  sidebar: {
    width:      '216px',
    itemHeight: '30px',
  },
  topbar: {
    height: '48px',
    bg:     palette.surface,
    border: palette.line,
  },
  nav: {
    active:  { bg: palette.sidebarActive, text: palette.inkInv    },
    default: { bg: 'transparent',         text: palette.inkInv2   },
    hover:   { bg: palette.sidebarHover,  text: palette.inkInv    },
  },
  status: {
    green: { dot: palette.green, bg: palette.greenBg, text: palette.green },
    amber: { dot: palette.amber, bg: palette.amberBg, text: palette.amber },
    red:   { dot: palette.red,   bg: palette.redBg,   text: palette.red   },
    blue:  { dot: palette.accent, bg: palette.accentBg, text: palette.accentText },
  },
} as const;

// ── Flat Tailwind export ──────────────────────────────────────────────────────
// Used in tailwind.config.ts:  brand: { ...brandColors }
// Then use as: bg-brand-canvas, text-brand-ink, border-brand-line, etc.

export const brandColors = {
  canvas:          palette.canvas,
  surface:         palette.surface,
  elevated:        palette.elevated,
  sidebar:         palette.sidebarBg,
  'sidebar-hover': palette.sidebarHover,
  'sidebar-active':palette.sidebarActive,
  'sidebar-border':palette.sidebarBorder,
  accent:          palette.accent,
  'accent-dim':    palette.accentDim,
  'accent-bg':     palette.accentBg,
  'accent-text':   palette.accentText,
  ink:             palette.ink,
  'ink-2':         palette.ink2,
  'ink-3':         palette.ink3,
  'ink-4':         palette.ink4,
  'ink-inv':       palette.inkInv,
  'ink-inv-2':     palette.inkInv2,
  line:            palette.line,
  'line-2':        palette.line2,
  green:           palette.green,
  'green-bg':      palette.greenBg,
  amber:           palette.amber,
  'amber-bg':      palette.amberBg,
  red:             palette.red,
  'red-bg':        palette.redBg,
} as const;
