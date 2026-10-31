# Design System

## Core Theme: Nordic Precision & Clarity
- **Style**: Calm, crisp, high-density utility dashboard.
- **Background**: `bg-slate-50` (`#F8FAFC`).
- **Cards**: `bg-white` with `border-slate-200/90`, `rounded-2xl`, and `shadow-xs`.
- **Hero Card (Printer Payoff)**: `bg-slate-900` with subtle emerald/indigo radial glows.
- **Primary Ink**: `text-slate-900` (`#0F172A`).
- **Secondary Ink**: `text-slate-500` (`#64748B`).
- **Accents**:
  - Indigo: `indigo-600` (`#4F46E5`) for primary actions and brand badges.
  - Emerald: `emerald-700` (`#047857`) for active toners and paid orders.
  - Rose: `rose-700` (`#BE123C`) for finished toners and unpaid debt.
  - Amber: `amber-600` (`#D97706`) for warnings.

## Typography
- System font stack via Next.js Geist font.
- `tabular-nums` used consistently for prices, counters, and dates.
- Maximum body line length capped to prevent wide text strain.

## Motion & Transitions
- Micro-interactions: `transition-all duration-150` on hover and active click states (`active:scale-[0.98]`).
- Modal entrances: `animate-in fade-in zoom-in-95 duration-150`.
- All transitions respect user settings.
