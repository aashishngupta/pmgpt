# pmGPT Design System

## Philosophy

pmGPT is a PM OS — not a chat app, not a dashboard tool. The design should feel like a focused professional workspace: calm, information-dense but not cluttered, every element purposeful.

**Inspirations (conceptual only):**
- **Clay** — vertical card flows, floating config panels, clean step metadata, natural language conditions
- **Perplexity** — trust through citations, structured outputs, follow-up affordances
- **Linear / Notion** — clean typography, fast interactions, no visual noise

**Not inspired by:** n8n (too technical), ChatGPT (too generic), Salesforce (too enterprise-heavy).

---

## Typography

- **Base font:** System font stack (Tailwind default — Inter-equivalent)
- **Page titles:** `text-[18px] font-bold text-brand-ink`
- **Card titles:** `text-[14px] font-semibold text-brand-ink`
- **Body:** `text-[13px] text-brand-ink`
- **Labels / metadata:** `text-[12px] text-brand-ink-2`
- **Section headers:** `text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest`
- **Badges / tags:** `text-[10px] font-semibold`
- **Monospace:** `font-mono text-[11px]` (for IDs, cron expressions, code)

---

## Spacing & Layout

- **Page padding:** `px-8 py-6`
- **Card padding:** `p-4` (small) or `p-5` (standard)
- **Card border radius:** `rounded-xl`
- **Gap between cards:** `gap-4`
- **Sticky headers:** `sticky top-0 z-10 bg-brand-bg border-b border-brand-line`

---

## Component Patterns

### Cards
```tsx
<div className="bg-brand-surface border border-brand-line rounded-xl p-4">
```

### Section label
```tsx
<div className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest mb-3">
  Label
</div>
```

### Status dots
```tsx
// green = active/connected, amber = warning/beta, red = error, grey = inactive
<span className="w-2 h-2 rounded-full bg-brand-green" />
```

### Toggle switch
```tsx
<button className="relative inline-flex h-4 w-7 items-center rounded-full bg-brand-accent">
  <span className="translate-x-3.5 inline-block h-3 w-3 rounded-full bg-white shadow" />
</button>
```

### Tabs (page-level)
```tsx
<button className="px-4 py-3 text-[13px] font-medium border-b-2 border-brand-accent text-brand-ink">
```

### Input
```tsx
<input className="w-full text-[13px] border border-brand-line rounded-lg px-3 py-2 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink placeholder-brand-ink-4" />
```

### Primary button
```tsx
<button className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-dim text-white text-[13px] font-medium">
```

### Secondary button
```tsx
<button className="px-4 py-2 rounded-lg border border-brand-line hover:bg-brand-elevated text-[13px] font-medium text-brand-ink-2">
```

---

## Workflow Builder Design (Clay-inspired, PM-specific)

### Step card
```
┌─────────────────────────────────────────────────┐
│  [icon]  Step Name                              │
│          Step type (Trigger / Agent / Action)   │
│                                                 │
│  ● Jira   →   Sprint Planner   →   Confluence  │
└─────────────────────────────────────────────────┘
         ↓  (dot connector + arrow)
```

### Step types and colors
- **Trigger:** blue icon tint — event-based or schedule
- **Agent:** brand-accent icon tint — which pmGPT agent runs
- **Condition:** amber icon tint — IF/THEN logic with field chips
- **Action:** green icon tint — write to Jira/Notion/Slack/etc.
- **Approval gate:** amber border — human must approve before next step

### Condition card (natural language)
```
[ Sprint velocity ] drops by more than [ 10% ]
AND  [ Active blockers ] is greater than [ 3 ]
```
Each field is a removable chip, not a code input.

### Background
- Canvas: `bg-brand-bg-2` (slightly off-white)
- Cards: white (`bg-white` or `bg-brand-surface`) with `border-brand-line`
- Connector lines: `border-brand-line` dashed

---

## Chat Interface Design (Perplexity-inspired, PM-specific)

### Message layout
- Max width: `max-w-2xl mx-auto` — single column, not full-width
- User message: right-aligned pill, brand-accent background
- Agent response: left-aligned, clean text, no bubble background

### Source citations
```
Response text here...

[Notion: Sprint 24 Notes] [Jira: SCRUM-110] [Confluence: Q2 Roadmap]
```
Small chips below each response, clickable.

### Structured output cards
Agent responses can render as:
- **Decision card** — what was decided, why, confidence
- **Action list** — numbered items with assignee/due date chips
- **Data table** — inline table for comparisons
- **Plain text** — for conversational responses

### Follow-up chips
After every response, 2-3 contextual follow-up suggestions:
```
[→ Break into Jira tickets]  [→ Add to PRD]  [→ Share to Slack]
```

### Human-in-loop preview
Before any write action:
```
┌─ Preview: Create Jira Ticket ──────────────────┐
│  Summary: Add mobile checkout flow to backlog  │
│  Project: SCRUM  Priority: Medium              │
│                                                │
│  [Approve & Create]  [Edit]  [Reject]          │
└────────────────────────────────────────────────┘
```
