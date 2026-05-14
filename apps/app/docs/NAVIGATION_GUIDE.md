# Navigation Architecture Guide

**React Navigation v7 (2026) - Production-Ready Structure**

## Overview

This document describes the centralized navigation architecture used in the demiAdmin app. The system is designed for:

- Type-safe navigation with centralized screen names
- Role-based access control
- Deep linking support
- FCM notification routing
- Easy debugging and maintenance
- Small app bundle size

---

## File Structure

```
apps/demiAdmin/src/navigation/
├── screenNames.ts          # ✅ SINGLE SOURCE OF TRUTH
│                           # All screen name constants organized by category
│
├── types.ts                # Navigation param list types
│                           # Type definitions for screen parameters
│
├── RootNavigator.tsx       # Root navigator (Auth vs Main)
│                           # Handles authentication routing
│                           # Includes deep linking configuration
│
├── MainNavigator.tsx       # Main drawer navigation
│                           # Role-based screen rendering
│                           # Drawer content with AppBar
│
├── AuthNavigator.tsx       # Authentication stack
│                           # Login → OTP → Dashboard flow
│
├── drawerConfig.ts         # Drawer menu items by role
│                           # Icons, labels, routes per role
│
└── configs/
    ├── index.ts            # Exports all config modules
    │
    ├── deepLinking.ts      # Deep link URL patterns
    │                       # demigod://screen-name
    │
    ├── fcmMapping.ts       # FCM notification → Screen mapping
    │                       # Notification type → Screen + params
    │
    ├── roleAccess.ts       # Role-based access control
    │                       # Which roles can access which screens
    │
    └── screenOptions.ts    # Reusable screen options
                            # Modal, detail, edit screen configs
```

---

## Screen Names - SINGLE SOURCE OF TRUTH

**File**: `navigation/screenNames.ts`

All screen names are defined as string constants organized by category. **NEVER hardcode screen name strings** - always import from this file.

### Categories

```typescript
// Authentication
export enum AuthScreens {
  Login = 'Login',
  OTP = 'OTP',
  ForgotPassword = 'ForgotPassword',
  ResetPassword = 'ResetPassword',
}

// Shared (all roles)
export enum SharedScreens {
  Profile = 'Profile',
  EditProfile = 'EditProfile',
  Notifications = 'Notifications',
  NotificationDetail = 'NotificationDetail',
  Settings = 'Settings',
  ChangePassword = 'ChangePassword',
}

// Dashboards (role-specific)
export enum DashboardScreens {
  SuperAdmin = 'SuperAdminDashboard',
  Owner = 'OwnerDashboard',
  Admin = 'AdminDashboard',
  User = 'AgentDashboard',
}

// Companies (Super Admin only)
export enum CompanyScreens {
  List = 'Companies',
  Detail = 'CompanyDetail',
  Create = 'CreateCompany',
  Edit = 'EditCompany',
  Settings = 'CompanySettings',
}

// Agents (Owner/Admin)
export enum UserScreens {
  List = 'Agents',
  Detail = 'AgentDetail',
  Create = 'CreateAgent',
  Edit = 'EditAgent',
  AddToCompany = 'AddAgentToCompany',
  Transfer = 'TransferAgent',
}

// Clients (Owner/Admin/User)
export enum ClientScreens {
  List = 'Clients',
  Detail = 'ClientDetail',
  Create = 'CreateClient',
  Edit = 'EditClient',
  QRCode = 'ClientQRCode',
  Documents = 'ClientDocuments',
  EMIHistory = 'ClientEMIHistory',
}

// Devices (Owner/Admin/User)
export enum DeviceScreens {
  Lock = 'LockDevice',
  Unlock = 'UnlockDevice',
  Track = 'TrackDevice',
  History = 'DeviceHistory',
  SendMessage = 'SendDeviceMessage',
}

// Orders & Balance
export enum OrderScreens {
  List = 'Orders',
  Detail = 'OrderDetail',
  Create = 'CreateOrder',
  PurchaseKeys = 'PurchaseKeys',
  ApproveOrder = 'ApproveOrder',
  Balance = 'Balance',
}

// Reports & Analytics
export enum ReportScreens {
  Overview = 'Reports',
  Revenue = 'RevenueReport',
  Agents = 'AgentsReport',
  Clients = 'ClientsReport',
  EMI = 'EMIReport',
  Devices = 'DevicesReport',
  SystemWide = 'SystemWideReport',
}

// System (Super Admin only)
export enum SystemScreens {
  Settings = 'SystemSettings',
  AuditLogs = 'AuditLogs',
  Health = 'SystemHealth',
  Maintenance = 'Maintenance',
}
```

### Usage Examples

```tsx
// ✅ CORRECT - Always use screen name constants
import { ClientScreens, SharedScreens } from '../navigation/screenNames';

// Navigation
navigation.navigate(ClientScreens.Detail, { clientId: '123' });
navigation.navigate(SharedScreens.Profile);

// Screen registration
<Stack.Screen name={ClientScreens.Create} component={CreateClientScreen} />

// Type-safe params
type ClientDetailParams = {
  [ClientScreens.Detail]: { clientId: string };
};
```

```tsx
// ❌ WRONG - Never hardcode strings
navigation.navigate('ClientDetail', { clientId: '123' }); // ❌
<Stack.Screen name="CreateClient" component={Screen} />  // ❌
```

---

## Role-Based Access Control

**File**: `navigation/configs/roleAccess.ts`

Defines which roles can access which screens. Prevents unauthorized navigation attempts.

### Access Map Structure

```typescript
export const screenAccessMap: Record<string, UserRole[]> = {
  [CompanyScreens.Create]: [UserRole.SUPER_ADMIN],
  [ClientScreens.Create]: [UserRole.OWNER, UserRole.SUPER, UserRole.RETAILER],
  [UserScreens.Create]: [UserRole.OWNER, UserRole.SUPER],
  // ... etc
};
```

### Functions

```typescript
// Check if user can access a screen
canAccessScreen(screen: string, userRole: UserRole): boolean

// Get all screens accessible by a role
getAccessibleScreens(userRole: UserRole): string[]

// Check if role has access to any screen in a category
canAccessCategory(category: string, userRole: UserRole): boolean

// Get role display name for UI
getRoleDisplayName(role: UserRole): string
```

### Usage Examples

```tsx
import { canAccessScreen } from '../navigation/configs/roleAccess';
import { CompanyScreens } from '../navigation/screenNames';

// Before navigation
if (canAccessScreen(CompanyScreens.Create, userRole)) {
  navigation.navigate(CompanyScreens.Create);
} else {
  // Show unauthorized message
}

// Conditional rendering
{canAccessScreen(ClientScreens.Create, userRole) && (
  <Button onPress={() => navigation.navigate(ClientScreens.Create)}>
    Add Client
  </Button>
)}

// Get all accessible screens for drawer menu
const accessibleScreens = getAccessibleScreens(userRole);
```

---

## Screen Options

**File**: `navigation/configs/screenOptions.ts`

Reusable screen option configurations for consistent styling.

### Available Options

```typescript
// Modal screen (slide from bottom)
modalScreenOptions(title: string, options?: {
  showBack?: boolean;
  showClose?: boolean;
  showSave?: boolean;
}): NativeStackNavigationOptions

// Detail screen (slide from right)
detailScreenOptions(title: string): NativeStackNavigationOptions

// Edit screen (with save action)
editScreenOptions(title: string): NativeStackNavigationOptions

// Fullscreen modal (multi-step forms)
fullscreenModalOptions(title: string): NativeStackNavigationOptions

// Card modal (smaller overlays)
cardModalOptions(title: string): NativeStackNavigationOptions

// Transparent modal (bottom sheets)
transparentModalOptions: NativeStackNavigationOptions

// Drawer screen (no header)
drawerScreenOptions: NativeStackNavigationOptions
```

### Usage Examples

```tsx
import { modalScreenOptions, detailScreenOptions } from '../navigation/configs/screenOptions';
import { CompanyScreens, ClientScreens } from '../navigation/screenNames';

// Modal screen
<Stack.Screen
  name={CompanyScreens.Create}
  component={CreateCompanyScreen}
  options={modalScreenOptions('Create Company')}
/>

// Detail screen
<Stack.Screen
  name={ClientScreens.Detail}
  component={ClientDetailScreen}
  options={detailScreenOptions('Client Details')}
/>

// Custom modal with save button
<Stack.Screen
  name={ClientScreens.Edit}
  component={EditClientScreen}
  options={modalScreenOptions('Edit Client', {
    showSave: true,
    onSavePress: handleSave,
  })}
/>
```

---

## Deep Linking

**File**: `navigation/configs/deepLinking.ts`

Maps URL patterns to navigation screens for deep linking support.

### URL Format

```
demigod://screen-path?param1=value1&param2=value2
https://admin.demigod.app/screen-path?param1=value1
```

### Configuration Structure

```typescript
export const deepLinkingConfig: LinkingOptions<RootStackParamList>['config'] = {
  screens: {
    Auth: {
      screens: {
        [AuthScreens.Login]: 'login',
        [AuthScreens.OTP]: 'otp',
      },
    },
    SuperAdmin: {
      screens: {
        [DashboardScreens.SuperAdmin]: 'super-admin/dashboard',
        [CompanyScreens.List]: 'companies',
        [CompanyScreens.Detail]: 'companies/:companyId',
        [ClientScreens.Detail]: 'clients/:clientId',
        // ... etc
      },
    },
  },
};

export const linkingPrefixes = [
  'demigod://',
  'https://admin.demigod.app',
  'https://*.demigod.app',
];
```

### URL Examples

```
demigod://companies
  → Navigate to CompanyScreens.List

demigod://companies/123
  → Navigate to CompanyScreens.Detail with companyId: '123'

demigod://clients/456/qr
  → Navigate to ClientScreens.QRCode with clientId: '456'

https://admin.demigod.app/profile
  → Navigate to SharedScreens.Profile
```

### Usage

Deep linking is automatically configured in `RootNavigator.tsx`:

```tsx
<NavigationContainer
  linking={{
    prefixes: linkingPrefixes,
    config: deepLinkingConfig,
  }}
>
  {/* ... */}
</NavigationContainer>
```

---

## FCM Notification Routing

**File**: `navigation/configs/fcmMapping.ts`

Maps FCM notification types to navigation screens with parameters.

### Mapping Structure

```typescript
export const fcmScreenMapping: FCMScreenMapping = {
  client_payment_due: {
    screen: ClientScreens.Detail,
    getParams: (data) => ({ clientId: data.clientId }),
    roles: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.SUPER, UserRole.RETAILER],
  },
  device_locked: {
    screen: DeviceScreens.History,
    getParams: (data) => ({ clientId: data.clientId }),
    roles: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.SUPER, UserRole.RETAILER],
  },
  company_created: {
    screen: CompanyScreens.Detail,
    getParams: (data) => ({ companyId: data.companyId }),
    roles: [UserRole.SUPER_ADMIN],
  },
  // ... etc
};
```

### Functions

```typescript
// Get screen mapping for notification type
getFCMScreenMapping(type: FCMNotificationType, userRole: UserRole)

// Check if user can handle notification type
canHandleNotification(type: FCMNotificationType, userRole: UserRole): boolean
```

### Usage Example

```tsx
import { getFCMScreenMapping } from '../navigation/configs/fcmMapping';

// In FCM notification handler
const handleNotification = (notification) => {
  const { type, data } = notification;
  const userRole = useAuthStore.getState().user?.role;

  const mapping = getFCMScreenMapping(type, userRole);

  if (mapping) {
    const params = mapping.getParams(data);
    navigation.navigate(mapping.screen, params);
  } else {
    console.warn(`Cannot handle notification type: ${type}`);
  }
};
```

### Available Notification Types

- **Client**: `client_payment_due`, `client_payment_overdue`, `client_registered`
- **Device**: `device_locked`, `device_unlocked`
- **Order**: `order_placed`, `order_approved`, `order_rejected`
- **User**: `agent_created`, `agent_balance_low`
- **Company**: `company_created` (Super Admin only)
- **System**: `system_alert` (Super Admin only)

---

## Navigation Types

**File**: `navigation/types.ts`

TypeScript type definitions for navigation parameters.

### Type Structure

```typescript
// Root navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  [CompanyScreens.Create]: undefined;
};

// Drawer navigation types
export type MainDrawerParamList = {
  Dashboard: undefined;
  [SharedScreens.Profile]: undefined;
  [SharedScreens.Notifications]: undefined;
  [CompanyScreens.List]: undefined;
  [ClientScreens.List]: undefined;
  [UserScreens.List]: undefined;
  // ... etc
};

// Screen-specific param types
export type ClientStackParamList = {
  [ClientScreens.List]: undefined;
  [ClientScreens.Detail]: { clientId: string };
  [ClientScreens.Create]: undefined;
  [ClientScreens.Edit]: { clientId: string };
  [ClientScreens.QRCode]: {
    clientId: string;
    clientName: string;
  };
};

// Navigation prop types
export type ClientDetailScreenNavigationProp = NativeStackNavigationProp<
  ClientStackParamList,
  ClientScreens.Detail
>;

export type ClientDetailScreenRouteProp = RouteProp<
  ClientStackParamList,
  ClientScreens.Detail
>;
```

### Usage in Components

```tsx
import { ClientScreens } from '../navigation/screenNames';
import type { ClientDetailScreenNavigationProp, ClientDetailScreenRouteProp } from '../navigation/types';

interface Props {
  navigation: ClientDetailScreenNavigationProp;
  route: ClientDetailScreenRouteProp;
}

const ClientDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { clientId } = route.params; // Type-safe!

  const handleEdit = () => {
    navigation.navigate(ClientScreens.Edit, { clientId }); // Type-safe!
  };

  return (
    // ...
  );
};
```

---

## Best Practices

### ✅ DO

1. **Always use screen name constants**
   ```tsx
   import { ClientScreens } from '../navigation/screenNames';
   navigation.navigate(ClientScreens.Detail, { clientId: '123' });
   ```

2. **Check role-based access before navigation**
   ```tsx
   if (canAccessScreen(CompanyScreens.Create, userRole)) {
     navigation.navigate(CompanyScreens.Create);
   }
   ```

3. **Use centralized screen options**
   ```tsx
   <Stack.Screen
     name={ClientScreens.Create}
     component={CreateClientScreen}
     options={modalScreenOptions('Create Client')}
   />
   ```

4. **Type screen parameters**
   ```tsx
   type ParamList = {
     [ClientScreens.Detail]: { clientId: string };
   };
   ```

5. **Handle FCM notifications with role checks**
   ```tsx
   const mapping = getFCMScreenMapping(type, userRole);
   if (mapping) {
     navigation.navigate(mapping.screen, mapping.getParams(data));
   }
   ```

### ❌ DON'T

1. **Never hardcode screen name strings**
   ```tsx
   navigation.navigate('ClientDetail'); // ❌ WRONG
   ```

2. **Don't navigate without access checks (restricted screens)**
   ```tsx
   // Missing role check - could fail!
   navigation.navigate(CompanyScreens.Create); // ❌ WRONG
   ```

3. **Don't create custom screen options unnecessarily**
   ```tsx
   // Use modalScreenOptions instead!
   options={{
     presentation: 'modal',
     headerShown: true,
     // ... ❌ WRONG
   }}
   ```

4. **Don't duplicate deep linking config**
   ```tsx
   // Already configured in deepLinking.ts!
   <NavigationContainer linking={myCustomConfig}> // ❌ WRONG
   ```

5. **Don't skip FCM role checks**
   ```tsx
   // Missing role check - could crash!
   navigation.navigate(CompanyScreens.Detail, params); // ❌ WRONG
   ```

---

## Debugging

### Finding Screen Names

All screen names are in `navigation/screenNames.ts` - search there first!

```bash
# Find all uses of a screen
grep -r "ClientScreens.Detail" apps/demiAdmin/src/

# Find screen registration
grep -r "Stack.Screen.*CreateCompany" apps/demiAdmin/src/
```

### Navigation Logs

Enable React Navigation dev tools:

```tsx
import { NavigationContainer } from '@react-navigation/native';

<NavigationContainer
  onStateChange={(state) => {
    console.log('[Navigation]', state);
  }}
>
```

### Role Access Issues

Check role access configuration:

```tsx
import { screenAccessMap } from '../navigation/configs/roleAccess';

// See which roles can access a screen
console.log(screenAccessMap[CompanyScreens.Create]);
// Output: [UserRole.SUPER_ADMIN]
```

### Deep Link Testing

Test deep links in development:

```bash
# Android
adb shell am start -W -a android.intent.action.VIEW -d "demigod://companies/123"

# iOS
xcrun simctl openurl booted "demigod://companies/123"
```

---

## Migration Guide

### Updating Existing Screens

1. **Replace hardcoded strings with constants**:
   ```tsx
   // Before
   navigation.navigate('ClientDetail', { clientId });

   // After
   import { ClientScreens } from '../navigation/screenNames';
   navigation.navigate(ClientScreens.Detail, { clientId });
   ```

2. **Add role-based access checks**:
   ```tsx
   // Before
   <Button onPress={() => navigation.navigate('CreateCompany')}>
     Create
   </Button>

   // After
   import { canAccessScreen } from '../navigation/configs/roleAccess';
   import { CompanyScreens } from '../navigation/screenNames';

   {canAccessScreen(CompanyScreens.Create, userRole) && (
     <Button onPress={() => navigation.navigate(CompanyScreens.Create)}>
       Create
     </Button>
   )}
   ```

3. **Use centralized screen options**:
   ```tsx
   // Before
   <Stack.Screen
     name="CreateCompany"
     component={CreateCompanyScreen}
     options={{
       presentation: 'modal',
       headerShown: true,
       // ...
     }}
   />

   // After
   import { modalScreenOptions } from '../navigation/configs/screenOptions';
   import { CompanyScreens } from '../navigation/screenNames';

   <Stack.Screen
     name={CompanyScreens.Create}
     component={CreateCompanyScreen}
     options={modalScreenOptions('Create Company')}
   />
   ```

---

## Summary

This navigation architecture provides:

- ✅ **Type Safety**: TypeScript ensures correct screen names and params
- ✅ **Centralization**: Single source of truth for all navigation config
- ✅ **Role-Based Access**: Automatic enforcement of permissions
- ✅ **Deep Linking**: Universal link support out of the box
- ✅ **FCM Integration**: Automatic notification routing with role checks
- ✅ **Maintainability**: Easy to find and debug navigation issues
- ✅ **Small Bundle**: No duplication, tree-shakeable exports

**Remember**: Always import from `screenNames.ts` - NEVER hardcode screen name strings!
