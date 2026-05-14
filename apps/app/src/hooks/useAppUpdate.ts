import { useState, useCallback } from 'react';
import { Platform, Linking, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { API_BASE_URL, APP_RELEASE_ENDPOINTS } from '../api/endpoints';

const { ApkInstaller } = NativeModules;

export type AppUpdateState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'up_to_date' }
  | { status: 'update_available'; release: AppRelease }
  | { status: 'downloading'; progress: number; bytesWritten: number; contentLength: number; release: AppRelease }
  | { status: 'ready_to_install'; apkPath: string; release: AppRelease }
  | { status: 'install_permission_required'; apkPath: string; release: AppRelease }
  | { status: 'error'; message: string; apkPath?: string; release?: AppRelease };

export interface AppRelease {
  id: string;
  versionCode: number;
  versionName: string;
  releaseNotes: string;
  apkUrl: string;
  isMandatory: boolean;
  createdAt: string;
}

// Fallback download page served directly from the backend
const FALLBACK_URL = `${API_BASE_URL}/download.html`;

export const useAppUpdate = () => {
  const [state, setState] = useState<AppUpdateState>({ status: 'idle' });

  const checkForUpdate = useCallback(async () => {
    // iOS doesn't support sideload installs — skip
    if (Platform.OS !== 'android') return;

    setState({ status: 'checking' });

    try {
      const currentVersionCode = DeviceInfo.getBuildNumber();
      const currentCode = parseInt(currentVersionCode, 10);

      const { data: release } = await axios.get<AppRelease>(
        `${API_BASE_URL}/api/v1${APP_RELEASE_ENDPOINTS.LATEST}?appType=admin`,
        { timeout: 10000 },
      );

      if (release.versionCode <= currentCode) {
        setState({ status: 'up_to_date' });
        return;
      }

      setState({ status: 'update_available', release });
    } catch {
      // Silent fail on check — don't block the user
      setState({ status: 'idle' });
    }
  }, []);

  const downloadAndInstall = useCallback(async (release: AppRelease) => {
    setState({ status: 'downloading', progress: 0, bytesWritten: 0, contentLength: 0, release });

    const destPath = `${RNFS.DownloadDirectoryPath}/forge-app-${release.versionName}.apk`;

    try {
      // Keep existing file if already fully downloaded (avoids re-download on retry)
      const fileExists = await RNFS.exists(destPath);
      if (fileExists) {
        await RNFS.unlink(destPath);
      }

      await RNFS.downloadFile({
        fromUrl: release.apkUrl,
        toFile: destPath,
        progress: (res) => {
          const known = res.contentLength > 0;
          // Guard against contentLength = -1 (chunked/streaming response)
          const progress = known
            ? Math.min(100, Math.round((res.bytesWritten / res.contentLength) * 100))
            : -1; // -1 signals "unknown total size" to the UI
          setState({
            status: 'downloading',
            progress,
            bytesWritten: res.bytesWritten,
            contentLength: res.contentLength,
            release,
          });
        },
        progressDivider: 1,
      }).promise;

      setState({ status: 'ready_to_install', apkPath: destPath, release });
      await triggerInstall(destPath, release);
    } catch {
      setState({
        status: 'error',
        message: 'Download failed. Please try again or visit the download page.',
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerInstall = useCallback(async (apkPath: string, release: AppRelease) => {
    if (!ApkInstaller) {
      // Native module not available — open browser fallback
      await Linking.openURL(FALLBACK_URL).catch(() => {});
      setState({
        status: 'error',
        message: 'Installer not available. Visit the download page to install manually.',
        apkPath,
        release,
      });
      return;
    }

    try {
      const canInstall: boolean = await ApkInstaller.canInstallApks();

      if (!canInstall) {
        // Ask user to grant "Install unknown apps" permission in Settings
        setState({ status: 'install_permission_required', apkPath, release });
        await ApkInstaller.openInstallPermissionSettings();
        return;
      }

      await ApkInstaller.installApk(apkPath);
    } catch (e: any) {
      setState({
        status: 'error',
        message: 'Could not open installer. Tap "Open Download Page" to install manually.',
        apkPath,
        release,
      });
    }
  }, []);

  /**
   * Called after user grants install permission in Settings and returns to the app.
   * Re-attempts install with the already-downloaded APK.
   */
  const retryInstall = useCallback(
    async (apkPath: string, release: AppRelease) => {
      setState({ status: 'ready_to_install', apkPath, release });
      await triggerInstall(apkPath, release);
    },
    [triggerInstall],
  );

  const dismiss = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return {
    state,
    checkForUpdate,
    downloadAndInstall,
    dismiss,
    retryInstall,
  };
};
