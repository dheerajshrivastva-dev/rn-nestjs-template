# demiAdmin Navigation Architecture

## Overview

The demiAdmin app uses a comprehensive navigation structure with proper safe area handling, Material Design 3 components, and role-based drawer navigation.

## Architecture Layers

```
App.tsx (Root)
├── SafeAreaProvider (from react-native-safe-area-context)
├── ThemeProvider (from @demigod/ui)
├── QueryProvider (TanStack Query)
└── RootNavigator
    ├── Auth Stack (when not authenticated)
    │   ├── LoginScreen
    │   └── OTPScreen
    └── Main Stack (when authenticated)
        └── MainNavigator (Drawer)
            ├── Dashboard (role-based)
            ├── Clients
            ├── Agents
            ├── Reports
            └── Settings
```

## Safe Area Handling Strategy

### 1. **Root Level** (`App.tsx`)
```tsx
<GestureHandlerRootView style={{flex: 1}}>
  <SafeAreaProvider>
    <StatusBar translucent backgroundColor="transparent" />
    {/* App content */}
  </SafeAreaProvider>
</GestureHandlerRootView>
```

**Why this works:**
- `SafeAreaProvider` tracks device safe areas (notch, home indicator)
- `StatusBar` is translucent for edge-to-edge layout
- All child components can access safe area insets via `useSafeAreaInsets()`

### 2. **AppBar Component** (`@demigod/ui`)
```tsx
const insets = useSafeAreaInsets();

<View style={{ paddingTop: insets.top }}>
  <2Appbar.Header statusBarHeight={0} />
</View>
```

**Features:**
- Automatically handles status bar height
- Consistent across iOS notch, Android notch, and standard devices
- No manual height calculations needed

### 3. **Screen Components** (`SafeScreen`)
```tsx
<SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
  <2AppBar />  {/* Handles top safe area */}
  <Content /> {/* No padding needed */}
</SafeScreen>
```

**Why `noSafeArea` for screens with AppBar:**
- AppBar already handles top safe area
- Prevents double padding
- Still applies safe area to sides and bottom

### 4. **Drawer Content**
```tsx
<View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
  {/* Drawer content */}
</View>
```

**Features:**
- Profile header respects status bar
- Content scrolls within safe bounds
- Footer stays above home indicator

### 5. **Bottom Navigation** (when implemented)
```tsx
<View style={{ paddingBottom: insets.bottom, height: 80 + insets.bottom }}>
  <BottomNavigation />
</View>
```

## Navigation Structure

### Root Navigator (`RootNavigator.tsx`)

**Responsibility:** Authentication routing

```typescript
<Stack.Navigator>
  {!isAuthenticated ? (
    <Stack.Screen name="Auth" component={AuthNavigator} />
  ) : (
    <Stack.Screen name="Main" component={MainNavigator} />
  )}
</Stack.Navigator>
```

### Main Navigator (`MainNavigator.tsx`)

**Responsibility:** Drawer navigation with role-based content

```typescript
<Drawer.Navigator drawerContent={CustomDrawerContent}>
  <Drawer.Screen name="Dashboard" component={DashboardScreen} />
  {/* Other screens */}
</Drawer.Navigator>
```

**Features:**
- Custom drawer content based on user role
- AppBar with hamburger menu
- Screen wrappers with consistent layout

### Drawer Configuration (`drawerConfig.ts`)

**Responsibility:** Role-based menu structure

```typescript
export const getDrawerSections = (role: UserRole): DrawerSection[]
```

**Super Admin Menu:**
- Dashboard
- Companies
- Reports
- System Settings
- Audit Logs
- System Health

**Admin Menu:**
- Dashboard
- Company Details (own company)
- Clients
- Agents
- Reports
- Orders & Balance
- Settings

**Note**: The OWNER role is deprecated. ADMIN is now the primary role for company management. Each company has one admin.

**User Menu:**
- Dashboard
- My Clients
- Reports
- Purchase Keys
- Balance

## Component Hierarchy

### Screen Wrapper Pattern

All authenticated screens use this pattern:

```tsx
<SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
  <2AppBar
    title="Dashboard"
    showMenu
    onMenuPress={() => navigation.openDrawer()}
    showNotifications
    showProfile
  />
  <View style={{flex: 1}}>
    {/* Screen content */}
  </View>
</SafeScreen>
```

**Why this pattern:**
- ✅ DRY code - shared layout logic
- ✅ Consistent AppBar across all screens
- ✅ Proper safe area handling
- ✅ Easy to add screen-specific actions

### Auth Screens

Auth screens DON'T use AppBar:

```tsx
<SafeScreen edges={['top', 'bottom', 'left', 'right']}>
  {/* Full safe area for auth screens */}
  <LoginForm />
</SafeScreen>
```

## Material Design 3 Components from `@demigod/ui`

### Navigation Components

1. **AppBar** - Top app bar with safe area
   - Hamburger menu / back button
   - Title and subtitle
   - Notification badge
   - Settings icon
   - Profile avatar

2. **DrawerContent** - Role-based drawer
   - User profile header
   - Section headers
   - Menu items with icons
   - Active state highlighting
   - Logout action

3. **BottomNavigation** - Bottom nav bar (when needed)
   - Safe area for home indicator
   - Badge support
   - Material You design

4. **SafeScreen** - Screen wrapper
   - Configurable safe area edges
   - Theme-aware background
   - Optional standard View mode

## Installation

### Required Dependencies

```bash
# Navigation
pnpm add @react-navigation/native @react-navigation/native-stack @react-navigation/drawer --filter demiAdmin
pnpm add react-native-drawer-layout --filter demiAdmin

# Safe Area
pnpm add react-native-safe-area-context --filter demiAdmin

# Gesture Handler (required for drawer)
pnpm add react-native-gesture-handler --filter demiAdmin

# Reanimated (required for smooth animations)
pnpm add react-native-reanimated --filter demiAdmin
```

### Android Setup (`android/app/src/main/java/.../MainActivity.java`)

```java
import android.os.Bundle;

@Override
protected void onCreate(Bundle savedInstanceState) {
  super.onCreate(null); // Important for react-native-screens
}
```

### iOS Setup

Run after installing:
```bash
cd ios && pod install && cd ..
```

## Best Practices

### ✅ DO

1. **Use SafeScreen for all screens**
   ```tsx
   <SafeScreen>
     <2AppBar />
     <Content />
   </SafeScreen>
   ```

2. **Import from @demigod/ui**
   ```tsx
   import { AppBar, DrawerContent, SafeScreen } from '@demigod/ui';
   ```

3. **Use role-based drawer config**
   ```tsx
   const sections = getDrawerSections(userRole);
   ```

4. **Handle safe area consistently**
   - AppBar handles top
   - BottomNavigation handles bottom
   - Content fills the middle

### ❌ DON'T

1. **Don't nest SafeAreaProvider**
   ```tsx
   // ❌ Wrong - already at root
   <SafeAreaProvider>
     <Screen />
   </SafeAreaProvider>
   ```

2. **Don't manually calculate status bar height**
   ```tsx
   // ❌ Wrong - platform-specific, error-prone
   paddingTop: Platform.OS === 'ios' ? 44 : 24

   // ✅ Correct - automatic
   const insets = useSafeAreaInsets();
   paddingTop: insets.top
   ```

3. **Don't import Paper components directly in screens**
   ```tsx
   // ❌ Wrong
   import { Appbar } from 'react-native-paper';

   // ✅ Correct
   import { AppBar } from '@demigod/ui';
   ```

## Role-Based Features

### Super Admin

- Full system access
- Company management (all companies)
- System-wide reports
- Required 2FA

### Admin

- Full access to own company
- Can view company details and statistics
- User management within company
- Client oversight (all company clients)
- Revenue reports

**Important**: The OWNER role is deprecated. Each company has ONE admin.

### User

- Own clients only
- Purchase keys
- Client management (assigned clients)
- Performance reports

## Future Enhancements

- [ ] Bottom navigation for main screens
- [ ] Tab navigation within sections
- [ ] Modal sheets for quick actions
- [ ] Deep linking support
- [ ] Push notification navigation
- [ ] Offline mode navigation

## References

- [Material Design 3 Navigation](https://m3.material.io/components/navigation-drawer/overview)
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)
- [SUPER_ADMIN_FLOWS.md](./docs/SUPER_ADMIN_FLOWS.md)
- [DEMI_ADMIN_FLOWS_MODERN.md](./docs/DEMI_ADMIN_FLOWS_MODERN.md)
- [UI_DESIGN_MODERN.md](./docs/UI_DESIGN_MODERN.md)
