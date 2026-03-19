## Spotify × GitHub Projects Fusion / Rhythmic Dark Engineering

***

### ① Name & Core Philosophy

**CADENCE** — *The rhythm of shipping.*

A deliberate collision between two masterclass dark UIs: Spotify's emotional warmth, dynamic card-based content presentation, and its iconic green-on-black identity — fused with GitHub Primer's systematic semantic color architecture, structured information density, and label-first organizational model. The result is a developer tool that feels as confident as a music player and as precise as a code review dashboard.

**Guiding principles:**
- **Emotional precision** — every color token is borrowed from systems that handle it at scale (Spotify's `#1DB954` and GitHub's `#0D1117` are not guesses; they are battle-tested in the wild at 500M+ users)
- **Label-first hierarchy** — like GitHub Issues, labels are the primary organizational unit, not folder trees or priority scores
- **Card as album** — ticket cards reference Spotify's content card anatomy: contained, self-sufficient, scannable at a glance without opening anything

**For whom:** Full-stack developers who live in GitHub but wish their project board had the visual confidence of a Spotify playlist. Engineers who organize their Spotify playlists the same way they triage issues — with the same obsessive taxonomy.

***

### ② Color Palette

All dark surface tokens are taken directly from GitHub's Primer dark theme.  The accent and interactive layer is anchored on Spotify's brand green. [auareyou](https://auareyou.com/projects/github-dark-mode/)

| Role | Token | Hex | Source Lineage |
|---|---|---|---|
| Background (shell) | `--bg-void` | `#0D1117` | GitHub Primer `canvas-default` (exact) |
| Surface (panels) | `--bg-surface` | `#161B22` | GitHub Primer `canvas-overlay` (exact) |
| Raised (hover/detail) | `--bg-raised` | `#1C2128` | GitHub Primer `canvas-inset` (exact) |
| Card bg | `--bg-card` | `#1C2128` | GitHub Primer `canvas-subtle` |
| Border default | `--border-default` | `#30363D` | GitHub Primer `border-default` (exact) |
| Border muted | `--border-muted` | `#21262D` | GitHub Primer `border-muted` |
| Border active | `--border-active` | `#1DB954` | Spotify Green (exact) |
| Primary text | `--text-primary` | `#E6EDF3` | GitHub Primer `fg-default` (exact) |
| Secondary text | `--text-secondary` | `#8B949E` | GitHub Primer `fg-muted` (exact) |
| Tertiary text | `--text-tertiary` | `#484F58` | GitHub Primer `fg-subtle` |
| **Accent** | `--accent-grove` | `#1DB954` | Spotify Green (exact) |
| Accent bright | `--accent-loud` | `#1ED760` | Spotify Green hover state (exact) |
| Accent dim | `--accent-moss` | `#0A2818` | Derived: Spotify green at 8% on `#0D1117` |
| Success | `--status-done` | `#3FB950` | GitHub Primer `success-emphasis` |
| Warning | `--status-warn` | `#D29922` | GitHub Primer `attention-emphasis` |
| Error | `--status-err` | `#F85149` | GitHub Primer `danger-emphasis` |
| Info | `--status-info` | `#58A6FF` | GitHub Primer `accent-emphasis` |

**Label color system** (8 GitHub-native semantic label colors, dark-mode calibrated):
```
--label-green:   bg #0D4429 | text #3FB950 | border #196C2E
--label-blue:    bg #0C2D6B | text #58A6FF | border #1158C7
--label-yellow:  bg #341A00 | text #D29922 | border #693E00
--label-red:     bg #3D0914 | text #F85149 | border #8E1519
--label-purple:  bg #271052 | text #BC8CFF | border #3D1F8A
--label-orange:  bg #3D1C00 | text #F0883E | border #793000
--label-pink:    bg #3A0F2B | text #F778BA | border #7D2457
--label-gray:    bg #21262D | text #8B949E | border #30363D
```

**Usage ratio:** 68% GitHub-dark surfaces → 24% text hierarchy → 8% Spotify-green accent + semantic labels

**Psychological reasoning:** The GitHub dark palette `#0D1117` to `#1C2128` is a cool blue-black gradient — it reads as "professional infrastructure." Injecting Spotify's `#1DB954` into this environment creates a single vivid warm-green signal in a cold blue-gray world. This is precisely how Spotify's green works in its own UI — one bright accent in a sea of neutrals.  The green here doesn't reference "success" — it references *energy*, *motion*, and *now playing*. The semantic success color (`#3FB950`) is a slightly different green shade so the two never blur. [creativesoup](https://creativesoup.io/blogs/news/spotify-brand-guidelines)

**Contrast strategy:** `#E6EDF3` on `#0D1117` = ~14.5:1. `#1DB954` on `#0D1117` = ~6.9:1 — used only as borders and fills, never as body text. Secondary text `#8B949E` on `#161B22` = ~4.7:1 (AA).  All label text colors are checked against their label backgrounds at minimum 4.5:1. [github](https://github.blog/engineering/user-experience/unlocking-inclusive-design-how-primers-color-system-is-making-github-com-more-inclusive/)

***

### ③ Typography System

| Role | Font | Fallback | Why |
|---|---|---|---|
| Headings / project names | `Plus Jakarta Sans` | `system-ui, sans-serif` | Closest public match to Spotify's "Circular" geometric DNA — tall x-height, friendly but confident |
| Body / descriptions / MD | `Inter` | `system-ui, sans-serif` | GitHub's actual production body face in most surfaces |
| UI labels / buttons / tags | `Plus Jakarta Sans` | `system-ui, sans-serif` | Consistent with headings for UI chrome |
| Data / IDs / mono | `JetBrains Mono` | `'Courier New', monospace` | Developer-grade monospace with clear digit disambiguation |
| Column headers | `Plus Jakarta Sans` uppercase | — | Circular-style tracking matches Spotify's playlist category headers |

**The pairing rationale:** Spotify's own design system (Encore) uses Circular — a geometric sans with near-circular letterforms.  Plus Jakarta Sans shares the same wide, circular `O` and tall ascenders. GitHub's body font is Inter in practice. Keeping Inter for descriptions means any Markdown content feels native to GitHub's own rendering aesthetic. [newsroom.spotify](https://newsroom.spotify.com/2024-05-22/introducing-spotify-mix-our-new-and-exclusive-font/)

**Modular scale** — Base: 14px, Ratio: 1.25 (major third):

| Token | Size | Weight | Usage |
|---|---|---|---|
| `--text-2xs` | 10px | 500 | Label chip text, timestamps |
| `--text-xs` | 11px | 400/500 | Ticket IDs (mono), badge counts |
| `--text-sm` | 13px | 400 | Body copy, descriptions, base UI |
| `--text-base` | 14px | 400 | Detail panel body |
| `--text-md` | 16px | 600 | Card titles, nav items |
| `--text-lg` | 18px | 700 | Panel section headers |
| `--text-xl` | 22px | 700 | Sidebar project names |
| `--text-2xl` | 28px | 800 | Command palette heading, empty states |

**Weight & spacing rules:**
- Plus Jakarta Sans headings: 700–800, `letter-spacing: -0.025em`, `line-height: 1.2`
- Plus Jakarta Sans UI labels: 600, `letter-spacing: 0`, `line-height: 1.4`
- Inter body: 400, `letter-spacing: 0`, `line-height: 1.65`
- JetBrains Mono IDs: 400, `letter-spacing: 0.02em`, rendered in `--text-tertiary` color
- Column headers: Plus Jakarta Sans 600, `text-transform: uppercase`, `letter-spacing: 0.08em`, 11px

**Example pairing in context:**
```
#TKT-088                               ← JetBrains Mono 11px/400, #484F58
Implement token refresh endpoint       ← Plus Jakarta Sans 16px/600, #E6EDF3
                                       
Fixes expired JWT sessions on mobile   ← Inter 13px/400, #8B949E
 
[backend]  [auth]  [p1]               ← Label chips (see label system above)
```

***

### ④ Spacing & Grid System

**Base unit: 4px**

Scale: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80`

**Layout grid:**
| Region | Size | Notes |
|---|---|---|
| Sidebar | `248px` fixed | Collapsed: `52px` |
| Kanban center | fluid | fills available width |
| Detail panel | `368px` fixed | hidden off-screen by default |
| Bottom status bar | `32px` | 8×4 grid-aligned |
| Panel divider | `1px solid #21262D` | no gap, no shadow |
| Min app width | `900px` | detail panel auto-hides below |

**Card geometry:**
- Padding: `14px 16px`
- Stack gap (between cards): `8px`
- **Border-radius: `8px`** — this is the single biggest visual departure from the previous five systems and the core of Cadence's Spotify DNA. Spotify uses 8–12px radius on cards universally; GitHub uses 6px. `8px` is the compromise.
- Card min-height: `72px`

**Column spacing:**
- Column header height: `44px`, `padding: 0 12px`
- Column body padding: `8px`
- Kanban column min-width: `240px`, max-width: `320px`

**Detail panel:**
- Inner padding: `24px`
- Field group gap: `20px`
- Section header margin-bottom: `8px`

***

### ⑤ Signature Visual Element

**The "now playing" top stripe** — a `3px` top border on ticket cards rendered in a label-derived or accent color. This is directly inspired by Spotify's "now playing" green underline on the active track in a playlist, and by GitHub's colored label system applied at the card level.

Every ticket card has a `3px solid` top border. The color is derived from the ticket's **primary label**:
- No labels → `3px solid #30363D` (default border color — invisible but present)
- `[backend]` → `3px solid #196C2E` (green)
- `[bug]` → `3px solid #8E1519` (red)
- `[infra]` → `3px solid #1158C7` (blue)
- Currently selected/active ticket → `3px solid #1DB954` (Spotify green — overrides label color)

This mechanism makes the kanban board scannable by color at a glance — exactly how Spotify's color-coded playlists and GitHub's label system both work, synthesized into a single structural element.

**Manifests in:**
- **Ticket cards:** 3px top stripe; the only colored element above the fold before the user reads anything
- **Sidebar active board item:** A `3px solid #1DB954` top border on the active nav item (rotated logic — horizontal → top, matching the card convention rather than using a left border like every other system in this document)
- **Command palette:** Currently active suggestion has a `3px solid #1DB954` top border on the highlighted row — consistent application of the same primitive across three different components

***

### ⑥ Component Snapshot

**Primary Button**
```
Default:
  bg: #1DB954 | text: #0D1117 | border: none
  padding: 7px 20px | border-radius: 6px
  font: Plus Jakarta Sans 13px/600 | letter-spacing: 0.01em

Hover:
  bg: #1ED760 | text: #0D1117
  transition: background 120ms ease

Active:
  bg: #17A349 | text: #0D1117 | scale(0.98)
  transition: transform 80ms ease

Disabled:
  bg: #0A2818 | text: #484F58 | cursor: not-allowed

Focus:
  outline: 2px solid #1DB954 | outline-offset: 3px | border-radius: 6px
```
The green-on-dark-black filled button is a direct Spotify primary CTA translation. It is the only filled-green element in the UI.

**Ticket Card**
```
bg: #1C2128
border: 1px solid #30363D
border-top: 3px solid [label-derived or #1DB954 if selected]
border-radius: 8px
padding: 14px 16px
gap between rows: 6px

Row 1: #TKT-088 — JetBrains Mono 11px/400, #484F58 (left-aligned)
Row 2: Plus Jakarta Sans 15px/600, #E6EDF3 — ticket title
Row 3: label chips (see label system) — flex row, gap: 6px

Hover:
  border-color: #8B949E | bg: #21262D
  transition: border-color 150ms ease, background 150ms ease

Selected:
  border-color: #30363D
  border-top: 3px solid #1DB954
  bg: #21262D
  box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.15)  ← only shadow in the system
```
The `box-shadow` on selected state is the only shadow token in CADENCE — and it is used exclusively here, referencing the "glow" Spotify uses on active album art.

**Navigation Bar (Sidebar)**
```
Width: 248px | bg: #0D1117 | border-right: 1px solid #21262D

Section label:
  Plus Jakarta Sans 10px/600 | uppercase | letter-spacing: 0.1em
  color: #484F58 | padding: 20px 16px 6px

Nav item:
  Plus Jakarta Sans 14px/500 | color: #8B949E
  height: 36px | padding: 0 12px | border-radius: 6px | margin: 2px 8px

Nav item hover:
  bg: #161B22 | color: #E6EDF3

Nav item active:
  bg: #161B22 | color: #E6EDF3
  border-top: 3px solid #1DB954  ← same top-stripe primitive as cards
  (border-radius: 6px still applies — the stripe clips to the radius)

Sidebar collapse button:
  Ctrl+B — icon only, 52px width mode
  border-radius: 6px | bg: transparent
  icon color: #484F58 → #E6EDF3 on hover
```

***

### ⑦ Motion & Interaction Principles

**Motion philosophy:** *Motion plays the next track — it doesn't make you wait for it.*

Spotify's interactions are fast, confident, and always feel like the UI is *ahead* of the user. GitHub's are precise and stateful. CADENCE merges both: snappy transitions that communicate state without theatrics.

- **Hover:** `150ms ease` on background and border-color — slightly slower than an instant swap, reflecting Spotify's smooth hover feedback
- **Card top-stripe color change** (when a label is added): `200ms ease` on `border-top-color` — the stripe transitions between colors like a track crossfade
- **Detail panel slide-in:** `220ms cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) — fast start, graceful arrival; Spotify's own sheet animations use this curve
- **Focus ring:** `0ms` appear, `150ms ease` disappear — appears instantly to indicate keyboard navigation, fades when the element loses focus
- **Command palette:** `100ms ease-out` on `opacity` + `translateY(-4px) → 0` — minimal, purposeful
- **Label chip appear** (when added to a ticket): `scale(0.85) → scale(1)` + `opacity 0 → 1` over `180ms ease-out` — the only "delightful" micro-interaction in the system; labels are the personality of a ticket

**Intentionally motion-free zones:**
1. **Status bar** — counts and branch name update instantly; the bar is a read-out, not a notification center
2. **Kanban column reorder / ticket status change via arrow keys** — instantaneous card teleport; keyboard-driven state mutations should be instantaneous to feel like direct manipulation
3. **The top-stripe on initial card render** — it renders with its color already set, no entrance animation; the board loads as a complete state, not a sequence of reveals

***

### ⑧ Inspiration & References

1. **Spotify Web Player** (`open.spotify.com`) — Borrowed: the `#121212`/`#1DB954` dark base + green accent contract, the 8px card border-radius, and the "now playing" green indicator as a positional highlight.  Adapted: the "now playing" indicator is rotated from a left-rail marker into a card-level top-stripe, making it a structural taxonomy signal rather than a playback state. The filled green CTA button is a direct 1:1 translation — `#1DB954` fill with black text. Fits: CADENCE's entire interaction model is "your board is a playlist — each ticket is a track." [color-hex](https://www.color-hex.com/color-palette/53188)

2. **GitHub Projects Board** (`github.com`) — Borrowed: the exact Primer dark color tokens (`#0D1117`, `#161B22`, `#30363D`, `#E6EDF3`, `#8B949E`), the semantic label chip system with 8 color families, and the concept of labels as the primary organizational primitive over folders or priority tiers.  Adapted: labels in GitHub are rectangular pills with colored backgrounds; in CADENCE they drive the card's top stripe, elevating them from metadata to structural hierarchy. Fits: GitHub Projects users already understand that labels are the taxonomy — CADENCE makes that taxonomy visible at the board level without opening any ticket. [auareyou](https://auareyou.com/projects/github-dark-mode/)

3. **Linear** (`linear.app`) — Borrowed: the principle that a keyboard-driven developer tool can have strong, opinionated visual personality without sacrificing density.  Specifically: the smooth panel slide-in with `cubic-bezier(0.16, 1, 0.3, 1)` easing — Linear uses this curve across all of its panel and modal transitions and it is now recognizable as the "confident app" easing. Adapted: kept the easing, swapped Linear's purple-gray accent for Spotify green + GitHub neutrals. Fits: Linear proved the market exists for a developer tool with aesthetic opinions; CADENCE proves that two existing design languages can fuse into a third, coherent one. [blog.logrocket](https://blog.logrocket.com/ux-design/linear-design/)

***

**Tailwind config skeleton for CADENCE:**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          void:    '#0D1117',
          surface: '#161B22',
          raised:  '#1C2128',
          card:    '#1C2128',
        },
        border: {
          default: '#30363D',
          muted:   '#21262D',
          active:  '#1DB954',
        },
        text: {
          primary:   '#E6EDF3',
          secondary: '#8B949E',
          tertiary:  '#484F58',
        },
        accent: {
          grove: '#1DB954',
          loud:  '#1ED760',
          moss:  '#0A2818',
        },
        status: {
          done: '#3FB950',
          warn: '#D29922',
          err:  '#F85149',
          info: '#58A6FF',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        btn:  '6px',
        chip: '4px',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
}
```