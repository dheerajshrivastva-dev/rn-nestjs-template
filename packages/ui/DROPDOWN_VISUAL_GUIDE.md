# Dropdown Component Visual Guide (2026)

## UI Comparison: Before vs After

### Before (Menu-based)
```
┌─────────────────────────────┐
│ Select Country       ▼      │
└─────────────────────────────┘
    │
    ├─────────────────────────┐
    │ 🔍 Search...            │
    ├─────────────────────────┤
    │ India                   │
    │ United States           │
    │ United Kingdom          │
    │ Canada                  │
    │ Australia               │
    └─────────────────────────┘
```
- Floating menu overlay
- Limited to screen space
- Can be cut off on small screens

### After (Bottom Sheet)
```
┌─────────────────────────────┐
│ Select Country       ▼      │
└─────────────────────────────┘
    │ (tap)
    ▼
╔═════════════════════════════╗
║ ═══  (drag handle)          ║
╠═════════════════════════════╣
║ Select Country   [Clear All]║
╠─────────────────────────────╣
║ 🔍 Search...                ║
╠─────────────────────────────╣
║ ○ India                     ║
║ ○ United States             ║
║ ● United Kingdom  ✓         ║  <- Selected (radio)
║ ○ Canada                    ║
║ ○ Australia                 ║
║                             ║
║ (scroll for more)           ║
╚═════════════════════════════╝
```
- Full bottom sheet modal
- Gesture-based dismissal (swipe down)
- Better mobile UX
- More space for content
- Keyboard-aware

---

## Feature Showcase

### 1. Single Select (Default)

**Trigger Field:**
```
┌─────────────────────────────┐
│ Country              ▼      │
│ United States               │
└─────────────────────────────┘
```

**Bottom Sheet:**
```
╔═════════════════════════════╗
║ Country                     ║
╠─────────────────────────────╣
║ 🔍 Search...                ║
╠─────────────────────────────╣
║ ○ India                     ║
║ ● United States  ✓          ║  <- Selected
║ ○ United Kingdom            ║
╚═════════════════════════════╝
```
- Radio button selection
- **Auto-closes** on select
- No footer button needed

---

### 2. Multi-Select

**Trigger Field:**
```
┌─────────────────────────────┐
│ Skills               ▼      │
│ 3 selected                  │  <- Shows count
└─────────────────────────────┘
```

**Bottom Sheet:**
```
╔═════════════════════════════╗
║ Skills          [Clear All] ║  <- Clear button
╠─────────────────────────────╣
║ 🔍 Search...                ║
╠─────────────────────────────╣
║ ☑ JavaScript                ║  <- Checked
║ ☑ TypeScript                ║  <- Checked
║ ☐ Python                    ║
║ ☑ React                     ║  <- Checked
║ ☐ Vue                       ║
╠─────────────────────────────╣
║  [ Continue (3) ]           ║  <- Footer button
╚═════════════════════════════╝
```
- Checkbox selection
- "Clear All" in header
- **Footer button** with count
- Backdrop dismiss disabled
- Swipe down disabled

---

### 3. Auto-Search (>10 items)

**Small List (≤10 items):**
```
╔═════════════════════════════╗
║ Status                      ║
╠─────────────────────────────╣
║ ○ Active                    ║  <- No search
║ ○ Inactive                  ║
║ ○ Pending                   ║
╚═════════════════════════════╝
```

**Large List (>10 items):**
```
╔═════════════════════════════╗
║ City                        ║
╠─────────────────────────────╣
║ 🔍 Search cities...         ║  <- Auto-shown
╠─────────────────────────────╣
║ ○ Mumbai                    ║
║ ○ Delhi                     ║
║ ○ Bangalore                 ║
║   ... (47 more)             ║
╚═════════════════════════════╝
```

---

### 4. Network Search

**Initial State:**
```
╔═════════════════════════════╗
║ Search Users                ║
╠─────────────────────────────╣
║ 🔍 Type to search...        ║
╠─────────────────────────────╣
║                             ║
║   No options found          ║  <- Empty state
║                             ║
╚═════════════════════════════╝
```

**Typing "john":**
```
╔═════════════════════════════╗
║ Search Users                ║
╠─────────────────────────────╣
║ 🔍 john                     ║  <- User types
╠─────────────────────────────╣
║                             ║
║   Searching...              ║  <- Loading state
║                             ║
╚═════════════════════════════╝
```

**Results Loaded:**
```
╔═════════════════════════════╗
║ Search Users                ║
╠─────────────────────────────╣
║ 🔍 john                     ║
╠─────────────────────────────╣
║ 👤 John Doe                 ║
║    john.doe@example.com     ║  <- Subtitle
║ 👤 John Smith               ║
║    john.smith@example.com   ║
║ 👤 Johnny Walker            ║
║    johnny@example.com       ║
╚═════════════════════════════╝
```

---

### 5. With Icons and Subtitles

```
╔═════════════════════════════╗
║ User Role                   ║
╠─────────────────────────────╣
║ 🛡️  Super Admin             ║  <- Icon
║    Full system access       ║  <- Subtitle
│                             │
║ ⭐  Super                   ║
║    Top-level distributor    ║
│                             │
║ 👥  Distributor             ║
║    Mid-tier distributor     ║
│                             │
║ 👤  Retailer                ║
║    End-tier seller          ║
╚═════════════════════════════╝
```

---

### 6. Custom Render (Team Member)

```
╔═════════════════════════════╗
║ Assign To                   ║
╠─────────────────────────────╣
║ ┌────────────────────────┐  ║
║ │ 🖼️  John Doe       🟢 │  ║  <- Custom
║ │    Frontend Dev        │  ║     layout
║ └────────────────────────┘  ║
│                             │
║ ┌────────────────────────┐  ║
║ │ 🖼️  Jane Smith      🟢 │  ║
║ │    Backend Dev         │  ║
║ └────────────────────────┘  ║
│                             │
║ ┌────────────────────────┐  ║
║ │ 🖼️  Mike Johnson    ⚫ │  ║  <- Offline
║ │    DevOps Engineer     │  ║
║ └────────────────────────┘  ║
╚═════════════════════════════╝
```

---

### 7. Error State

**Trigger Field with Error:**
```
┌─────────────────────────────┐
│ Country *            ▼      │
│                             │
├─────────────────────────────┤
│ ⚠️ Country is required      │  <- Error message
└─────────────────────────────┘
```

---

### 8. Disabled State

**Disabled Field:**
```
┌─────────────────────────────┐
│ Country              ▼      │
│ Loading...                  │  <- Grayed out
└─────────────────────────────┘
    (not tappable)
```

**Disabled Option:**
```
╔═════════════════════════════╗
║ ○ India                     ║
║ ○ United States             ║
║ ○ Enterprise Plan           ║  <- Grayed text
║   Contact sales             ║     (not tappable)
╚═════════════════════════════╝
```

---

## Interaction Flow

### Single Select Flow
```
1. Tap field
   ↓
2. Bottom sheet slides up
   ↓
3. Search or scroll
   ↓
4. Tap option
   ↓
5. Sheet auto-closes ✓
   ↓
6. Field shows selection
```

### Multi-Select Flow
```
1. Tap field
   ↓
2. Bottom sheet slides up
   ↓
3. Search or scroll
   ↓
4. Tap multiple options (checkboxes)
   ↓
5. Tap "Continue (3)"
   ↓
6. Sheet closes ✓
   ↓
7. Field shows "3 selected"
```

### Network Search Flow
```
1. Tap field
   ↓
2. Bottom sheet opens
   ↓
3. Type in search field
   ↓
4. onSearch() called with query
   ↓
5. Shows "Searching..."
   ↓
6. Options update with results
   ↓
7. Select and close
```

---

## Responsive Behavior

### Small Screen (Phone)
```
╔═══════════════╗
║ ═══           ║
╠───────────────╣
║ Title         ║
╠───────────────╣
║ Search        ║
╠───────────────╣
║ Options...    ║
║ (scrollable)  ║
╚═══════════════╝
```
- Snap to 50% or 90%
- Swipe to adjust height

### Large Screen (Tablet)
```
╔═════════════════════════════╗
║ ═══                         ║
╠─────────────────────────────╣
║ Title                       ║
╠─────────────────────────────╣
║ Search                      ║
╠─────────────────────────────╣
║ Options...                  ║
║ (more visible)              ║
║                             ║
╚═════════════════════════════╝
```
- Better use of space
- More options visible

---

## Keyboard Behavior

### Search Field Focused
```
╔═════════════════════════════╗
║ Search Users                ║
╠─────────────────────────────╣
║ 🔍 john|                    ║  <- Focused
╠─────────────────────────────╣
║ Results...                  ║
║                             ║
╠═════════════════════════════╣
║ ⌨️  Keyboard                ║  <- Auto-appears
╚═════════════════════════════╝
```
- Sheet auto-adjusts above keyboard
- No content hidden
- Dismiss keyboard by scrolling

---

## Accessibility

### Screen Reader
```
"Country, dropdown button"
  → Tap
"Bottom sheet opened"
"Search field" (if searchable)
"India, radio button, not selected"
"United States, radio button, selected"
  → Tap
"Selected United States"
"Bottom sheet closed"
```

### High Contrast
- All text meets WCAG AA standards
- Clear selection indicators
- Visible focus states

---

## Animation

### Open Animation
```
Field (tap)
   ↓
Sheet slides up from bottom (300ms ease-out)
   ↓
Backdrop fades in (200ms)
```

### Close Animation
```
Select option (single) / Tap Continue (multi)
   ↓
Sheet slides down (250ms ease-in)
   ↓
Backdrop fades out (150ms)
```

### Gesture Dismiss
```
Swipe down on handle
   ↓
Sheet follows finger
   ↓
Release → Snaps to next point or dismisses
```

---

## Theme Support

All app themes supported:
- **Dark Theme**: Proper contrast
- **Blue Theme**: Primary blue accents
- **Red Theme**: Primary red accents
- **Purple Theme**: Primary purple accents
- **Green Theme**: Primary green accents

Colors auto-adapt to selected theme!

---

## Best Practices

### ✅ DO
- Use multi-select for selecting multiple items
- Use network search for large datasets (users, products)
- Use custom render for rich option displays
- Add subtitles for context
- Show loading states during async operations

### ❌ DON'T
- Don't use multi-select for single choice
- Don't show search for <5 items
- Don't forget loading states on network search
- Don't use without error messages
- Don't disable without visual feedback

---

## Performance Tips

1. **Large Lists**: Use network search instead of loading 1000+ items
2. **Custom Render**: Keep simple to avoid scroll lag
3. **Search**: Debounce network search (300ms recommended)
4. **Options**: Memoize option arrays to prevent re-renders
5. **Handlers**: Use useCallback for event handlers

---

This visual guide shows the modern, mobile-first design of the upgraded Dropdown component!
