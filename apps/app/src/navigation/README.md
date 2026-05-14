# Navigation - Quick Reference

**React Navigation v7 (2026) - Native Stack Navigation**

## 🚀 Quick Start

### Import Screen Names (Always!)

```tsx
import {
  ClientScreens,
  SharedScreens,
  CompanyScreens,
  UserScreens,
  OrderScreens,
  ReportScreens,
} from './navigation/screenNames';
```

### Navigate to a Screen

```tsx
import { useNavigation } from '@react-navigation/native';
import { ClientScreens } from '../navigation/screenNames';
import type { MainDrawerNavigationProp } from '../navigation/types';

const MyComponent = () => {
  const navigation = useNavigation<MainDrawerNavigationProp>();

  const handlePress = () => {
    // ✅ Navigate with params
    navigation.navigate(ClientScreens.Detail, { clientId: '123' });

    // ✅ Navigate without params
    navigation.navigate(SharedScreens.Profile);
  };
};
```

### Check Role-Based Access

```tsx
import { canAccessScreen } from './navigation/configs/roleAccess';
import { CompanyScreens } from './navigation/screenNames';

// Before navigation
if (canAccessScreen(CompanyScreens.Create, userRole)) {
  navigation.navigate(CompanyScreens.Create);
} else {
  Alert.alert('Unauthorized', 'You do not have permission to create companies.');
}

// Conditional rendering
{canAccessScreen(ClientScreens.Create, userRole) && (
  <Button onPress={() => navigation.navigate(ClientScreens.Create)}>
    Create Client
  </Button>
)}
```

### Register a Screen

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { modalScreenOptions, detailScreenOptions } from './navigation/configs/screenOptions';
import { ClientScreens } from './navigation/screenNames';

const Stack = createNativeStackNavigator();

// Modal screen
<Stack.Screen
  name={ClientScreens.Create}
  component={CreateClientScreen}
  options={modalScreenOptions('Create Client')}
/>

// Detail screen
<Stack.Screen
  name={ClientScreens.Detail}
  component={ClientDetailScreen}
  options={detailScreenOptions('Client Details')}
/>
```

### Handle FCM Notifications

```tsx
import { getFCMScreenMapping } from './navigation/configs/fcmMapping';

const handleNotification = (notification: FCMNotificationData) => {
  const { type, data } = notification;
  const userRole = useAuthStore.getState().user?.role;

  const mapping = getFCMScreenMapping(type, userRole);

  if (mapping) {
    navigation.navigate(mapping.screen, mapping.getParams(data));
  } else {
    console.warn(`Cannot handle notification: ${type}`);
  }
};
```

## 📁 File Structure

```
src/navigation/
├── screenNames.ts          # ✅ SINGLE SOURCE OF TRUTH
├── types.ts                # TypeScript types
├── RootNavigator.tsx       # Auth routing + deep linking
├── MainNavigator.tsx       # Drawer navigation
├── AuthNavigator.tsx       # Auth screens
├── drawerConfig.ts         # Drawer menu config
└── configs/
    ├── roleAccess.ts       # Role-based access control
    ├── screenOptions.ts    # Reusable screen options
    ├── deepLinking.ts      # Deep link URL patterns
    ├── fcmMapping.ts       # FCM notification routing
    └── index.ts            # Config exports
```

## 📚 Screen Name Categories

1. **AuthScreens** - Login, OTP, Password Reset
2. **SharedScreens** - Profile, Notifications, Settings
3. **DashboardScreens** - SuperAdmin, Owner, Admin, User
4. **CompanyScreens** - List, Detail, Create, Edit, Settings
5. **UserScreens** - List, Detail, Create, Edit, Transfer
6. **ClientScreens** - List, Detail, Create, Edit, QRCode, Documents
7. **DeviceScreens** - Lock, Unlock, Track, History
8. **OrderScreens** - List, Detail, Create, PurchaseKeys, Balance
9. **ReportScreens** - Overview, Revenue, Agents, Clients, EMI
10. **SystemScreens** - Settings, AuditLogs, Health, Maintenance

## 🔐 Role-Based Access

| Screen Category | SUPER_ADMIN | OWNER | ADMIN | AGENT |
|----------------|-------------|-------|-------|-------|
| Company CRUD   | ✅          | ❌    | ❌    | ❌    |
| User CRUD     | ✅          | ✅    | ✅    | ❌    |
| Client CRUD    | ✅          | ✅    | ✅    | ✅    |
| Device Control | ✅          | ✅    | ✅    | ✅    |
| Order CRUD     | ✅          | ✅    | ✅    | ✅    |
| System Settings| ✅          | ❌    | ❌    | ❌    |

## 🔗 Deep Linking

### URL Format
```
demigod://screen-path?param=value
https://admin.demigod.app/screen-path?param=value
```

### Examples
```
demigod://companies/123
demigod://clients/456/qr
demigod://profile
demigod://reports
```

## 🔔 FCM Notification Types

| Type                    | Navigates To          | Roles                    |
|-------------------------|-----------------------|--------------------------|
| `client_payment_due`    | ClientDetail          | All                      |
| `client_registered`     | ClientQRCode          | All                      |
| `device_locked`         | DeviceHistory         | All                      |
| `order_placed`          | OrderDetail           | All                      |
| `agent_created`         | AgentDetail           | Owner, Admin             |
| `company_created`       | CompanyDetail         | Super Admin only         |
| `system_alert`          | SystemHealth          | Super Admin only         |

## ⚙️ Screen Options

```tsx
import {
  modalScreenOptions,
  detailScreenOptions,
  editScreenOptions,
  fullscreenModalOptions,
  cardModalOptions,
  transparentModalOptions,
} from './navigation/configs/screenOptions';

// Modal (slide from bottom)
options={modalScreenOptions('Create Client')}

// Detail (slide from right)
options={detailScreenOptions('Client Details')}

// Edit form
options={editScreenOptions('Edit Client')}

// Fullscreen modal
options={fullscreenModalOptions('Multi-Step Form')}

// Card modal
options={cardModalOptions('Confirmation')}

// Transparent (bottom sheet)
options={transparentModalOptions}
```

## 🛠️ Helper Functions

### roleAccess.ts

```tsx
// Check screen access
canAccessScreen(screen: string, role: UserRole): boolean

// Get all accessible screens
getAccessibleScreens(role: UserRole): string[]

// Check category access
canAccessCategory(category: string, role: UserRole): boolean

// Get role display name
getRoleDisplayName(role: UserRole): string
```

### fcmMapping.ts

```tsx
// Get screen mapping for notification
getFCMScreenMapping(type: FCMNotificationType, role: UserRole)

// Check if user can handle notification
canHandleNotification(type: FCMNotificationType, role: UserRole): boolean
```

## ✅ Best Practices

1. **Always use screen name constants**
   ```tsx
   // ✅ Good
   navigation.navigate(ClientScreens.Detail, { clientId });

   // ❌ Bad
   navigation.navigate('ClientDetail', { clientId });
   ```

2. **Check access before restricted navigation**
   ```tsx
   // ✅ Good
   if (canAccessScreen(CompanyScreens.Create, userRole)) {
     navigation.navigate(CompanyScreens.Create);
   }

   // ❌ Bad (could crash or show unauthorized screen)
   navigation.navigate(CompanyScreens.Create);
   ```

3. **Use centralized screen options**
   ```tsx
   // ✅ Good
   options={modalScreenOptions('Create')}

   // ❌ Bad (duplicates code)
   options={{ presentation: 'modal', ... }}
   ```

4. **Type your navigation props**
   ```tsx
   // ✅ Good
   const navigation = useNavigation<MainDrawerNavigationProp>();

   // ❌ Bad (no type safety)
   const navigation = useNavigation();
   ```

## 📖 Full Documentation

- **Complete Guide**: [docs/NAVIGATION_GUIDE.md](../docs/NAVIGATION_GUIDE.md)
- **Project Instructions**: [CLAUDE.md](../../../CLAUDE.md)
- **Implementation Status**: [NAVIGATION_IMPLEMENTATION_COMPLETE.md](../NAVIGATION_IMPLEMENTATION_COMPLETE.md)

---

**Remember**: NEVER hardcode screen name strings - always import from `screenNames.ts`! 🚀
