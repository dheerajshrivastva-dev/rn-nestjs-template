# demiAdmin - User & Admin Management App

## 1. Overview

**demiAdmin** is a React Native 0.83.1 mobile application for company owners, admins, and agents to manage the EMI Management System. It provides complete control over device protection services, client management, and business operations.

---

## 2. User Roles & Capabilities

### Role Hierarchy

```
SUPER_ADMIN (Platform Admin)
    ↓
OWNER (Company Owner)
    ↓
ADMIN (Company Admin)
    ↓
AGENT (Field User)
```

### Role Permissions Matrix

| Feature | SUPER_ADMIN | OWNER | ADMIN | AGENT |
|---------|-------------|-------|-------|-------|
| **Company Management** |
| Create/Delete Companies | ✅ | ❌ | ❌ | ❌ |
| View All Companies | ✅ | ❌ | ❌ | ❌ |
| Update Own Company | ✅ | ✅ | ❌ | ❌ |
| **User Management** |
| Create Agents | ✅ | ✅ | ❌ | ❌ |
| View All Agents in Company | ✅ | ✅ | ✅ | ❌ |
| Update Any User | ✅ | ✅ | ❌ | ❌ |
| Delete Agents | ✅ | ✅ | ❌ | ❌ |
| Update Own Profile | ✅ | ✅ | ✅ | ✅ |
| **Client Management** |
| Create Clients | ✅ | ✅ | ✅ | ✅ |
| View All Company Clients | ✅ | ✅ | ❌ | ❌ |
| View Own Clients | ✅ | ✅ | ✅ | ✅ |
| Update Any Client | ✅ | ✅ | ❌ | ❌ |
| Update Own Clients | ✅ | ✅ | ✅ | ✅ |
| Delete Clients | ✅ | ✅ | ❌ | ❌ |
| **Device Control** |
| Lock/Unlock Devices | ✅ | ✅ | ✅ | ✅ (own) |
| Mark as Stolen | ✅ | ✅ | ✅ | ✅ (own) |
| Emergency Unlock | ✅ | ✅ | ✅ | ✅ (own) |
| Send Messages to Device | ✅ | ✅ | ✅ | ✅ (own) |
| Track Device Location | ✅ | ✅ | ✅ | ✅ (own) |
| **Financial Operations** |
| Purchase Keys | ✅ | ✅ | ✅ | ✅ |
| Transfer Balance | ✅ | ✅ (to agents) | ❌ | ❌ |
| View Balance Sheet | ✅ | ✅ | ✅ (own) | ✅ (own) |
| **Reports & Analytics** |
| Company Dashboard | ✅ | ✅ | ✅ | ❌ |
| User Performance | ✅ | ✅ | ❌ | ❌ |
| Revenue Reports | ✅ | ✅ | ❌ | ❌ |
| Own Statistics | ✅ | ✅ | ✅ | ✅ |

---

## 3. App Architecture

### 3.1 Technology Stack

```
Frontend:
- React Native 0.83.1 (New Architecture enabled)
- TypeScript 5.8.3
- React 19.2.0
- Hermes JS Engine

Navigation:
- React Navigation 7.x
- Stack, Tab, and Drawer navigators

State Management:
- Zustand (lightweight, minimal updates needed)
- React Query (TanStack Query) for server state

UI Components:
- React Native Paper (Material Design)
- react-native-safe-area-context
- react-native-gesture-handler
- react-native-reanimated

Networking:
- Axios for HTTP requests
- JWT authentication
- Signature-based device auth

Storage:
- @react-native-async-storage/async-storage
- Secure storage for tokens (react-native-keychain)

Maps & Location:
- react-native-maps
- @react-native-community/geolocation

Media:
- react-native-image-picker
- react-native-document-picker
- react-native-audio-recorder-player

Notifications:
- @react-native-firebase/messaging (FCM)
- react-native-push-notification

Forms & Validation:
- React Hook Form
- Zod for schema validation

QR Code:
- react-native-camera (for scanning)
- react-native-qrcode-svg (for generation)

Testing:
- Jest 29.x
- React Native Testing Library
```

### 3.2 Project Structure

```
apps/Duetech-admin/
├── src/
│   ├── api/                        # API client & endpoints
│   │   ├── client.ts              # Axios instance with interceptors
│   │   ├── endpoints/
│   │   │   ├── auth.ts            # Authentication APIs
│   │   │   ├── user.ts           # User management APIs
│   │   │   ├── client.ts          # Client/device APIs
│   │   │   ├── order.ts           # Order & transaction APIs
│   │   │   ├── notification.ts    # Notification APIs
│   │   │   └── report.ts          # Reports & analytics APIs
│   │   └── types/                 # API type definitions
│   │
│   ├── components/                 # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── client/
│   │   │   ├── ClientCard.tsx
│   │   │   ├── ClientList.tsx
│   │   │   ├── DeviceStatus.tsx
│   │   │   └── QRCodeDisplay.tsx
│   │   ├── user/
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentList.tsx
│   │   │   └── BalanceDisplay.tsx
│   │   └── charts/
│   │       ├── PieChart.tsx
│   │       ├── BarChart.tsx
│   │       └── LineChart.tsx
│   │
│   ├── screens/                    # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── VerifyOTPScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   └── ResetPasswordScreen.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx      # Role-based dashboard
│   │   │   ├── OwnerDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── AgentDashboard.tsx
│   │   ├── client/
│   │   │   ├── ClientListScreen.tsx
│   │   │   ├── ClientDetailScreen.tsx
│   │   │   ├── CreateClientScreen.tsx
│   │   │   ├── EditClientScreen.tsx
│   │   │   ├── DeviceControlScreen.tsx
│   │   │   ├── DeviceLocationScreen.tsx
│   │   │   ├── SendMessageScreen.tsx
│   │   │   └── QRCodeScreen.tsx
│   │   ├── user/
│   │   │   ├── AgentListScreen.tsx
│   │   │   ├── UserDetailScreen.tsx
│   │   │   ├── CreateAgentScreen.tsx
│   │   │   ├── EditUserScreen.tsx
│   │   │   └── TransferBalanceScreen.tsx
│   │   ├── order/
│   │   │   ├── PurchaseKeysScreen.tsx
│   │   │   ├── OrderHistoryScreen.tsx
│   │   │   └── OrderDetailScreen.tsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── EditProfileScreen.tsx
│   │   │   ├── ChangePasswordScreen.tsx
│   │   │   └── NotificationSettingsScreen.tsx
│   │   ├── reports/
│   │   │   ├── SalesReportScreen.tsx
│   │   │   ├── AgentPerformanceScreen.tsx
│   │   │   ├── ClientReportScreen.tsx
│   │   │   └── BalanceSheetScreen.tsx
│   │   └── company/                 # SUPER_ADMIN only
│   │       ├── CompanyListScreen.tsx
│   │       ├── CreateCompanyScreen.tsx
│   │       └── CompanyDetailScreen.tsx
│   │
│   ├── navigation/                 # Navigation configuration
│   │   ├── RootNavigator.tsx      # Main navigation root
│   │   ├── AuthNavigator.tsx      # Auth flow
│   │   ├── MainNavigator.tsx      # Authenticated app
│   │   ├── DashboardNavigator.tsx # Tab navigation
│   │   ├── ClientNavigator.tsx    # Client stack
│   │   ├── AgentNavigator.tsx     # User stack
│   │   └── types.ts               # Navigation type definitions
│   │
│   ├── store/                      # Zustand state management
│   │   ├── authStore.ts           # Authentication state
│   │   ├── userStore.ts           # Current user data
│   │   ├── clientStore.ts         # Client management
│   │   ├── agentStore.ts          # User management
│   │   ├── notificationStore.ts   # Notifications
│   │   └── themeStore.ts          # Theme configuration
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts             # Authentication hooks
│   │   ├── useClient.ts           # Client data hooks
│   │   ├── useAgent.ts            # User data hooks
│   │   ├── useOrder.ts            # Order hooks
│   │   ├── usePermissions.ts      # RBAC permission checks
│   │   ├── useTheme.ts            # Theme hooks
│   │   └── useNotification.ts     # Notification hooks
│   │
│   ├── utils/                      # Utility functions
│   │   ├── crypto.ts              # Encryption utilities
│   │   ├── validation.ts          # Input validation
│   │   ├── formatting.ts          # Date, currency formatting
│   │   ├── storage.ts             # AsyncStorage wrappers
│   │   ├── permissions.ts         # RBAC helpers
│   │   └── constants.ts           # App constants
│   │
│   ├── theme/                      # Design system
│   │   ├── colors.ts              # Color palette (see UI_DESIGN.md)
│   │   ├── typography.ts          # Font styles
│   │   ├── spacing.ts             # Spacing scale
│   │   ├── shadows.ts             # Shadow styles
│   │   └── index.ts               # Theme provider
│   │
│   ├── types/                      # TypeScript types
│   │   ├── user.ts
│   │   ├── client.ts
│   │   ├── company.ts
│   │   ├── order.ts
│   │   ├── navigation.ts
│   │   └── common.ts
│   │
│   └── config/                     # App configuration
│       ├── env.ts                 # Environment variables
│       ├── api.config.ts          # API configuration
│       └── firebase.config.ts     # Firebase setup
│
├── android/                        # Android native code
├── ios/                           # iOS native code
├── __tests__/                     # Test files
├── .env.example                   # Environment template
├── app.json                       # App metadata
├── package.json                   # Dependencies
└── tsconfig.json                  # TypeScript config
```

---

## 4. Core Features & Flows

See [DEMI_ADMIN_FLOWS.md](./DEMI_ADMIN_FLOWS.md) for detailed user flows.

### Quick Feature Overview

1. **Authentication**
   - Email/password login
   - 2FA with OTP
   - Biometric login (optional)
   - Token refresh
   - Password reset

2. **Client Management**
   - Create client with device info
   - Generate QR code for Zero-Touch Provisioning
   - View client list (filtered by role)
   - Client details with EMI tracking
   - Device control (lock/unlock)
   - Mark as stolen
   - Track device location
   - Send text/audio messages

3. **User Management** (Owner/SUPER_ADMIN)
   - Create new agents
   - View all company agents
   - Transfer balance to agents
   - View user performance

4. **Financial Operations**
   - Purchase keys from company
   - View balance and transactions
   - Balance sheet with audit trail
   - Payment processing

5. **Reports & Analytics**
   - Dashboard with KPIs
   - Sales reports
   - User performance metrics
   - Client reports
   - Revenue analytics

6. **Notifications**
   - Push notifications
   - In-app notifications
   - Device status alerts
   - Payment reminders

---

## 5. API Integration

### 5.1 Base URL Configuration

```typescript
// src/config/api.config.ts
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://localhost:3000/api/v1'
    : 'https://api.yourservice.com/api/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

### 5.2 Axios Instance with Interceptors

```typescript
// src/api/client.ts
import axios from 'axios';
import { getToken, refreshToken } from '@/utils/storage';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        // navigationRef.navigate('Login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 5.3 API Endpoints

All endpoints follow the HLD specification. See detailed API documentation in backend:
- `/api/v1/auth/*` - Authentication
- `/api/v1/agents/*` - User management
- `/api/v1/clients/*` - Client/device management
- `/api/v1/orders/*` - Order processing
- `/api/v1/reports/*` - Analytics

---

## 6. State Management Strategy

### 6.1 Zustand for UI State

```typescript
// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  login: async (email, password) => {
    // API call
    const { accessToken, user } = await authApi.login(email, password);
    set({ isAuthenticated: true, user: user, token: accessToken });
  },
  logout: () => {
    set({ isAuthenticated: false, user: null, token: null });
  },
}));
```

### 6.2 React Query for Server State

```typescript
// src/hooks/useClient.ts
import { useQuery, useMutation } from '@tanstack/react-query';

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: clientApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateClient = () => {
  return useMutation({
    mutationFn: clientApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
```

---

## 7. Security Implementation

### 7.1 Secure Token Storage

```typescript
// src/utils/storage.ts
import * as Keychain from 'react-native-keychain';

export const saveToken = async (token: string) => {
  await Keychain.setGenericPassword('accessToken', token);
};

export const getToken = async (): Promise<string | null> => {
  const credentials = await Keychain.getGenericPassword();
  return credentials ? credentials.password : null;
};
```

### 7.2 RBAC Permission Checks

```typescript
// src/hooks/usePermissions.ts
import { useAuthStore } from '@/store/authStore';

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  const can = (action: string, resource: string): boolean => {
    if (!user) return false;

    // SUPER_ADMIN can do everything
    if (user.role === 'SUPER_ADMIN') return true;

    // Permission matrix logic
    const permissions = {
      OWNER: ['create:user', 'view:all-clients', 'transfer:balance'],
      ADMIN: ['view:all-agents', 'create:client'],
      AGENT: ['create:client', 'view:own-clients'],
    };

    return permissions[user.role]?.includes(`${action}:${resource}`) ?? false;
  };

  return { can };
};
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// __tests__/components/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/common/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Click</Button>);

    fireEvent.press(getByText('Click'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### 8.2 Integration Tests

Test complete user flows end-to-end.

---

## 9. Performance Optimization

1. **Code Splitting**: Use React.lazy for heavy screens
2. **Memoization**: Use React.memo for list items
3. **FlatList Optimization**: windowSize, maxToRenderPerBatch
4. **Image Optimization**: Use FastImage for remote images
5. **Bundle Size**: Monitor with `npx react-native-bundle-visualizer`

---

## 10. Deployment

### 10.1 Android Build

```bash
cd android
./gradlew assembleRelease
```

### 10.2 iOS Build

```bash
cd ios
pod install
xcodebuild -workspace demiAdmin.xcworkspace -scheme demiAdmin -configuration Release
```

---

## 11. Environment Configuration

```env
# .env.example
API_BASE_URL=https://api.yourservice.com
FIREBASE_API_KEY=your-firebase-key
GOOGLE_MAPS_API_KEY=your-maps-key
SENTRY_DSN=your-sentry-dsn
```

---

## 12. Next Steps

1. Review [UI_DESIGN.md](./UI_DESIGN.md) for design system
2. Review [DEMI_ADMIN_FLOWS.md](./DEMI_ADMIN_FLOWS.md) for user flows
3. Set up dependencies: `pnpm install`
4. Configure environment: Copy `.env.example` to `.env`
5. Start development: `pnpm start`

---

## 13. Support & Resources

- **Backend HLD**: `@apps/Duetech-service/HLD.md`
- **RBAC Guide**: `@apps/Duetech-service/RBAC_GUIDE.md`
- **Backend Flow**: `@apps/Duetech-service/YOUR_PROJECT_FLOW.md`
- **React Native Docs**: https://reactnative.dev
- **React Navigation**: https://reactnavigation.org
