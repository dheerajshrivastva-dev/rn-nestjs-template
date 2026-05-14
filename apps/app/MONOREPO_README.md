# Duetech-admin (React Native 0.83.1)

This is the admin panel mobile app for the Demigod platform, built with React Native 0.83.1.

## Quick Start

### Development

**From root directory** (`/home/dheeraj/Documents/myprjct/demigod/`):

```bash
# Start Metro bundler
pnpm dev:admin

# In a new terminal, run Android
pnpm android:admin

# Or run iOS
pnpm ios:admin
```

**From this directory** (`apps/demiAdmin/`):

```bash
# Start Metro bundler
pnpm start

# In a new terminal
pnpm android
pnpm ios
```

### Common Commands

```bash
# Lint
pnpm lint

# Run tests
pnpm test

# Reset Metro cache
pnpm start --reset-cache
```

## Project Structure

```
demiAdmin/
├── android/           # Android native code
├── ios/              # iOS native code
├── __tests__/        # Test files
├── App.tsx           # Main app component
├── index.js          # Entry point
├── package.json      # Dependencies
└── tsconfig.json     # TypeScript config
```

## Adding Dependencies

**From root directory:**
```bash
pnpm --filter Duetech-admin add <package-name>
pnpm --filter Duetech-admin add -D <dev-package>
```

**From this directory:**
```bash
pnpm add <package-name>
pnpm add -D <dev-package>
```

## Using Shared Packages

To use shared code from the monorepo's `packages/` directory:

1. Create a shared package (example):
```bash
cd /home/dheeraj/Documents/myprjct/demigod/packages
mkdir shared-types
cd shared-types
pnpm init
```

2. Add to this app's dependencies:
```json
{
  "dependencies": {
    "@demigod/shared-types": "workspace:*"
  }
}
```

3. Import in your code:
```typescript
import { User } from '@demigod/shared-types';
```

## Environment Variables

Create `.env` files for different environments:

```bash
# .env.development
API_URL=http://localhost:3000

# .env.production
API_URL=https://api.demigod.com
```

Use react-native-config to load them:
```bash
pnpm add react-native-config
```

## Build & Release

### Android

```bash
# Debug build
pnpm android

# Release build
cd android
./gradlew assembleRelease
```

### iOS

```bash
# Debug build
pnpm ios

# Release build (use Xcode)
```

## Troubleshooting

### Metro bundler issues
```bash
pnpm start --reset-cache
```

### Android build issues
```bash
cd android
./gradlew clean
cd ..
pnpm android
```

### iOS build issues
```bash
cd ios
pod install
cd ..
pnpm ios
```

### Dependencies not found
```bash
# From root
cd /home/dheeraj/Documents/myprjct/demigod
pnpm install
```

## Version Info

- **React Native**: 0.83.1
- **React**: 19.2.0
- **TypeScript**: 5.8.3
- **Node**: >=20
- **Package Manager**: pnpm 10.22.0
