# File Upload Setup Guide

The FileUploadInput component now includes production-grade file upload with full permission handling.

## Libraries Used

- `react-native-image-picker` - For camera and photo library access
- `react-native-permissions` - For permission management

## Native Setup Required

### Android Setup

1. **Update AndroidManifest.xml** (`apps/demiAdmin/android/app/src/main/AndroidManifest.xml`):

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- Camera Permission -->
  <uses-permission android:name="android.permission.CAMERA" />

  <!-- Photo Library Permissions -->
  <!-- For Android 13+ (API 33+) -->
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

  <!-- For Android 10-12 (API 29-32) -->
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />

  <!-- For file URI handling -->
  <uses-feature android:name="android.hardware.camera" android:required="false" />

  <application>
    <!-- ... -->
  </application>
</manifest>
```

2. **No additional Gradle configuration needed** - react-native-image-picker auto-links.

### iOS Setup

1. **Update Info.plist** (`apps/demiAdmin/ios/demiAdmin/Info.plist`):

```xml
<dict>
  <!-- Camera Permission -->
  <key>NSCameraUsageDescription</key>
  <string>We need access to your camera to take photos for client profiles and documents.</string>

  <!-- Photo Library Permission -->
  <key>NSPhotoLibraryUsageDescription</key>
  <string>We need access to your photo library to select photos for client profiles and documents.</string>

  <!-- For iOS 14+ Photo Library (recommended) -->
  <key>NSPhotoLibraryAddUsageDescription</key>
  <string>We need permission to save photos to your library.</string>
</dict>
```

2. **Install Pods**:

```bash
cd apps/demiAdmin/ios
pod install
cd ../../..
```

## Permission Flow

The component automatically handles:

1. **Permission Check** - Checks if permission is already granted
2. **Rationale Display** - Shows explanation before requesting (Android)
3. **Permission Request** - Requests permission from OS
4. **Blocked Handling** - Guides user to settings if permission is permanently denied
5. **Error Handling** - Shows user-friendly error messages

## Usage Example

```tsx
import { FileUploadInput } from '@demigod/ui';

const MyForm = () => {
  const [profileUrl, setProfileUrl] = useState('');

  return (
    <FileUploadInput
      label="Profile Photo"
      value={profileUrl}
      onChangeText={setProfileUrl}
      fileType="image"
      placeholder="Upload or enter URL"
      // Optional: Custom upload handler
      onUpload={async (blob) => {
        const formData = new FormData();
        formData.append('file', blob);
        const response = await api.uploadFile(formData);
        return response.url;
      }}
    />
  );
};
```

## Permission States Handled

### 1. Granted
- User has granted permission
- Picker opens immediately

### 2. Denied (First Time)
- Shows rationale (Android)
- Requests permission
- Can ask again later

### 3. Blocked (Permanently Denied)
- Shows alert with explanation
- Offers to open Settings
- User must manually enable in Settings

### 4. Unavailable
- Platform doesn't support feature
- Gracefully falls back to URL input

## Features

✅ **Camera Access** - Take photos directly
✅ **Photo Library** - Select from existing photos
✅ **Permission Management** - Full permission handling with rationale
✅ **Error Handling** - User-friendly error messages
✅ **Image Preview** - Shows selected image
✅ **URL Fallback** - Manual URL input option
✅ **Custom Upload** - Optional upload handler
✅ **Multi-Platform** - Works on iOS, Android, and Web

## Testing Checklist

- [ ] Test camera on physical device (camera not available on emulator)
- [ ] Test photo library selection
- [ ] Test permission denial
- [ ] Test permission blocking (deny + "Don't ask again")
- [ ] Test Settings redirect
- [ ] Test custom upload handler
- [ ] Test URL input mode
- [ ] Test image preview and removal

## Troubleshooting

### Camera not working on emulator
- Camera requires physical device
- Use photo library for testing on emulator

### Permission always denied
- Check native configuration (AndroidManifest.xml / Info.plist)
- Uninstall and reinstall app to reset permissions

### Image picker not opening
- Check console for permission errors
- Verify native setup is complete
- Run `cd ios && pod install` for iOS

### Build errors
- Clean build: `cd android && ./gradlew clean` or `cd ios && xcodebuild clean`
- Re-run: `pnpm install` from root
- Rebuild native code

## Next Steps

After native setup:

1. Add to AndroidManifest.xml and Info.plist
2. Run `pod install` for iOS
3. Rebuild app: `pnpm run android` or `pnpm run ios`
4. Test on physical device (for camera)
5. Test all permission scenarios
