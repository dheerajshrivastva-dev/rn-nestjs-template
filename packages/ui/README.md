# @demigod/ui

Shared UI component library for Demigod apps with Material Design 3.

## Overview

A comprehensive, logic-free UI component library built with React Native Paper and Material Design 3 specifications. This package provides 60+ reusable components with zero business logic, ready to be composed into application screens.

## Features

- ✅ **Material Design 3** - Full MD3 component library
- ✅ **No Business Logic** - Pure presentational components
- ✅ **TypeScript First** - Full type safety with strict typing
- ✅ **Light/Dark Theme** - Automatic theme switching support
- ✅ **Accessibility** - WCAG AA compliant with screen reader support
- ✅ **Performance Optimized** - React.memo, virtualization, lazy loading
- ✅ **Monorepo Ready** - Workspace package for cross-app reuse

## Installation

This package is designed for use within the Demigod monorepo:

```bash
# From your app directory
pnpm add @demigod/ui@workspace:*
```

## Usage

### Wrap your app with ThemeProvider

```tsx
import { ThemeProvider } from '@demigod/ui';

export default function App() {
  return (
    <ThemeProvider>
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

### Using theme in components

```tsx
import { useTheme } from '@demigod/ui';

function MyComponent() {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.surface, padding: theme.spacing.xl }}>
      {/* Component content */}
    </View>
  );
}
```

### Using typography

```tsx
import { Text } from 'react-native';
import { useTheme } from '@demigod/ui';

function MyText() {
  const theme = useTheme();
  const textStyle = theme.typography.headlineSmall;

  return <Text style={textStyle}>Hello World</Text>;
}
```

## Theme System

### Colors

MD3 color palette with semantic tokens:

- Primary, Secondary, Tertiary colors
- Surface colors with elevation tints
- Semantic colors (success, warning, error, info)
- Status colors (online, offline, protected, locked, etc.)

### Typography

Complete MD3 type scale:

- Display (Large, Medium, Small)
- Headline (Large, Medium, Small)
- Title (Large, Medium, Small)
- Body (Large, Medium, Small)
- Label (Large, Medium, Small)

### Spacing

4dp grid system:

- `spacing.xs` - 2dp
- `spacing.sm` - 4dp
- `spacing.md` - 8dp
- `spacing.lg` - 12dp
- `spacing.xl` - 16dp
- `spacing.xxl` - 20dp
- Component-specific spacing constants

### Elevation

MD3 elevation levels (0-5) with shadow configurations for iOS and Android.

## Component Categories

### 1. Typography (10 variants) ✅ COMPLETE

- DisplaySmall, HeadlineSmall, HeadlineMedium, TitleLarge, TitleMedium, BodyLarge, BodyMedium, BodySmall, LabelLarge, LabelMedium

### 2. Buttons (6 types) ✅ COMPLETE

- FilledButton, FilledTonalButton, OutlinedButton, TextButton, IconButton, FAB

### 3. Layout (7 components) ✅ COMPLETE

- Container, Section, Row, Column, Spacer, Divider, ScrollContainer

### 4. Cards (4 types) ✅ COMPLETE

- ElevatedCard, FilledCard, OutlinedCard, HeroCard

### 5. Inputs (9 components) ✅ COMPLETE

- TextField (Filled/Outlined variants), SearchBar, PasswordInput, PhoneInput, OTPInput, CurrencyInput, NumberStepper, MultilineTextField, Dropdown

### 6. Lists (6 types) ✅ COMPLETE

- TwoLineListItem, ThreeLineListItem, SwipeableListItem, AvatarListItem, CheckboxListItem, RadioListItem

### 7. Chips (5 types) ✅ COMPLETE

- FilterChip, AssistChip, StatusChip, InputChip, SuggestionChip

### 8. Modals & Dialogs (3 types) ✅ COMPLETE

- ConfirmDialog, AlertDialog, LoadingDialog

### 9. Progress (3 components) ✅ COMPLETE

- LinearProgressBar, CircularProgressIndicator, StepperIndicator

### 10. Badges (3 types) ✅ COMPLETE

- NotificationBadge, StatusDot, TrendBadge

### 11. Media & Images (3 components) ✅ COMPLETE

- AvatarPicker, DocumentUpload, ImagePreview

### 12. QR Codes (2 components) ✅ COMPLETE

- QRCodeDisplay, QRCodeActions

### 13. Charts (3 types) ✅ COMPLETE

- LineChart, BarChart, ProgressChart

### 14. Date & Time (3 components) ✅ COMPLETE

- DatePicker, TimePicker, DateRangePicker

### 15. Timeline (2 components) ✅ COMPLETE

- ActivityTimeline, TimelineItem

### 16. Navigation (5 components) ⏳ PENDING

- TopAppBar, BottomNavigation, NavigationDrawer, BackButton, MenuButton

### 12. Layout (7 components)

- Container, Section, Row, Column, Spacer, Divider, ScrollContainer

### 13. Feedback (3 states)

- EmptyState, ErrorState, LoadingState

### 14. Animations (4 types)

- SuccessAnimation, ErrorAnimation, SlideInTransition, FadeTransition

### 15. Chips (5 types)

- FilterChip, AssistChip, StatusChip, InputChip, SuggestionChip

### 16. Badges (3 types)

- NotificationBadge, StatusDot, TrendBadge

### 17. Date & Time (3 pickers)

- DatePicker, TimePicker, DateRangePicker

### 18. Timeline (2 components)

- ActivityTimeline, TimelineItem

### 19. Theme (2 components)

- ThemeProvider, ThemeToggle

### 20. Utility (4 components)

- SafeAreaContainer, KeyboardAvoidingContainer, TouchableRipple, Surface

## Development

### Prerequisites

- Node.js >= 20
- pnpm 10.22.0+
- React Native 0.83.1+

### Building

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Testing
pnpm test
```

## Dependencies

### Core Dependencies

- `react-native-paper@^5.14.1` - MD3 components
- `react-native-vector-icons@^10.3.0` - MaterialCommunityIcons
- `react-native-svg@^15.8.0` - SVG support
- `react-native-reanimated@^3.18.0` - Smooth animations
- `react-hook-form@^7.54.2` - Form state management
- `zod@^3.24.1` - Schema validation

### Peer Dependencies

- `react@>=19.0.0`
- `react-native@>=0.83.0`

## Design System

Based on Material Design 3 specifications from:

- [UI_DESIGN_MODERN.md](../../apps/demiAdmin/docs/UI_DESIGN_MODERN.md)
- [DEMI_ADMIN_FLOWS_MODERN.md](../../apps/demiAdmin/docs/DEMI_ADMIN_FLOWS_MODERN.md)

## License

MIT

## Authors

Demigod Team
