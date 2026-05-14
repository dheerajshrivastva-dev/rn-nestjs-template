# Navigation — Quick Reference

**React Navigation v7 — Native Stack + Drawer**

## Quick Start

### Import Screen Names (always use constants, never strings)

```tsx
import { DashboardScreens, SharedScreens, AccountScreens } from './navigation/screens';
```

### Navigate

```tsx
import { useNavigation } from '@react-navigation/native';
import type { MainStackNavigationProp } from '../navigation/types';
import { DashboardScreens } from '../navigation/screens';

const MyComponent = () => {
  const navigation = useNavigation<MainStackNavigationProp>();

  navigation.navigate(DashboardScreens.Main);
  navigation.navigate(SharedScreens.Notifications);
};
```

### Check Role-Based Access

```tsx
import { canAccessScreen } from './navigation/configs/roleAccess';

if (canAccessScreen(MyScreens.Create, userRole)) {
  navigation.navigate(MyScreens.Create);
}
```

### Register a Screen

```tsx
import { appBarScreenOptions } from './navigation/components/AppBarHeader';

<Stack.Screen
  name={MyScreens.Detail}
  component={MyDetailScreen}
  options={{ ...appBarScreenOptions, title: 'Detail' }}
/>
```

### Handle FCM Notifications

```tsx
import { getFCMScreenMapping } from './navigation/configs/fcmMapping';

const mapping = getFCMScreenMapping(notification.type, userRole);
if (mapping) {
  navigation.navigate(mapping.screen, mapping.getParams(notification.data));
}
```

## File Structure

```
src/navigation/
├── screens.ts              # ✅ SINGLE SOURCE OF TRUTH — all screen name constants
├── types.ts                # TypeScript param list types
├── RootNavigator.tsx       # Auth routing + deep linking
├── PublicStack.tsx         # Auth screens
├── private/
│   └── PrivateRoot.tsx     # Drawer with all authenticated stacks
├── stacks/
│   ├── DashboardStack.tsx  # Main app entry stack
│   └── AccountStack.tsx    # Profile / account management
├── components/
│   ├── AppBarHeader.tsx    # Shared header (used as stack screenOptions.header)
│   ├── BottomTabs.tsx      # Optional bottom tab component
│   └── CustomDrawerContent.tsx
├── drawerConfig.ts         # Role-based drawer menu items
└── configs/
    ├── roleAccess.ts       # canAccessScreen() helper
    ├── screenOptions.ts    # Reusable screen option presets
    ├── deepLinking.ts      # URL → screen mapping
    └── fcmMapping.ts       # FCM notification → screen routing
```

## Screen Name Categories

1. **AuthScreens** — Login, OTP, ForgotPassword, ResetPassword, PinSetup, BiometricLogin
2. **SharedScreens** — Notifications, NotificationDetail, Settings
3. **AccountScreens** — Center, EditProfile, Security, ChangePassword, TwoFactor, Sessions
4. **DashboardScreens** — Main *(add role-specific screens here)*

Add your domain screens by exporting a new const in `screens.ts`:

```ts
export const ProjectScreens = {
  List:   'project/list',
  Detail: 'project/detail',
  Create: 'project/create',
} as const;
```

Then add entries to `types.ts` (MainStackParamList), `roleAccess.ts`, and `deepLinking.ts`.

## Role-Based Access

| Screen Category  | ADMIN | MANAGER | USER |
|------------------|-------|---------|------|
| Dashboard        | ✅    | ✅      | ✅   |
| Notifications    | ✅    | ✅      | ✅   |
| Account          | ✅    | ✅      | ✅   |
| *(your screens)* | —     | —       | —    |

## Deep Linking

```
forge://dashboard
forge://notifications/detail?id=123
forge://settings
```

Configured in `configs/deepLinking.ts`.
