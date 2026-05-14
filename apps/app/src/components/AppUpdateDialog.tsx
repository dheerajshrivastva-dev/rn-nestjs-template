import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Modal, Portal, ProgressBar } from 'react-native-paper';
import {
  Text,
  FilledButton,
  OutlinedButton,
  useTheme,
} from '@forge/ui';
import { AppUpdateState, AppRelease } from '../hooks/useAppUpdate';

interface AppUpdateDialogProps {
  state: AppUpdateState;
  onUpdate: (release: AppRelease) => void;
  onDismiss: () => void;
  onRetryInstall: (apkPath: string, release: AppRelease) => void;
}

const FALLBACK_URL = 'https://duetech.in/download';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AppUpdateDialog = ({
  state,
  onUpdate,
  onDismiss,
  onRetryInstall,
}: AppUpdateDialogProps) => {
  const { colors } = useTheme();

  const visible =
    state.status === 'update_available' ||
    state.status === 'downloading' ||
    state.status === 'ready_to_install' ||
    state.status === 'install_permission_required' ||
    state.status === 'error';

  if (!visible) return null;

  const isMandatory =
    (state.status === 'update_available' || state.status === 'downloading') &&
    state.release.isMandatory;

  const renderContent = () => {
    if (state.status === 'update_available') {
      return (
        <>
          <Text variant="titleMedium" style={styles.title}>
            Update Available
          </Text>
          <Text variant="bodyMedium" style={[styles.version, { color: colors.primary }]}>
            Version {state.release.versionName}
          </Text>
          <Text variant="bodySmall" style={[styles.notes, { color: colors.onSurfaceVariant }]}>
            {state.release.releaseNotes}
          </Text>
          <View style={styles.actions}>
            <FilledButton onPress={() => onUpdate(state.release)} style={styles.btn}>
              Update Now
            </FilledButton>
            {!isMandatory && (
              <OutlinedButton onPress={onDismiss} style={styles.btn}>
                Later
              </OutlinedButton>
            )}
          </View>
        </>
      );
    }

    if (state.status === 'downloading') {
      const unknownSize = state.progress === -1;
      const progressValue = unknownSize ? undefined : state.progress / 100;

      return (
        <>
          <Text variant="titleMedium" style={styles.title}>
            Downloading Update...
          </Text>
          <View style={styles.progressLabelRow}>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {formatBytes(state.bytesWritten)}
              {!unknownSize && ` / ${formatBytes(state.contentLength)}`}
            </Text>
            {!unknownSize && (
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {state.progress}%
              </Text>
            )}
          </View>
          <ProgressBar
            progress={progressValue}
            indeterminate={unknownSize}
            color={colors.primary}
            style={styles.progressBar}
          />
          <Text variant="bodySmall" style={[styles.hint, { color: colors.onSurfaceVariant }]}>
            Please do not close the app
          </Text>
        </>
      );
    }

    if (state.status === 'ready_to_install') {
      return (
        <>
          <Text variant="titleMedium" style={styles.title}>
            Ready to Install
          </Text>
          <Text variant="bodySmall" style={[styles.notes, { color: colors.onSurfaceVariant }]}>
            Tap Install to complete the update. The Android installer will open.
          </Text>
          <View style={styles.actions}>
            <FilledButton
              onPress={() => onRetryInstall(state.apkPath, state.release)}
              style={styles.btn}>
              Install
            </FilledButton>
          </View>
        </>
      );
    }

    if (state.status === 'install_permission_required') {
      return (
        <>
          <Text variant="titleMedium" style={styles.title}>
            Permission Required
          </Text>
          <Text variant="bodySmall" style={[styles.notes, { color: colors.onSurfaceVariant }]}>
            Allow this app to install APKs in Settings, then come back and tap Install.
          </Text>
          <View style={styles.actions}>
            <FilledButton
              onPress={() => onRetryInstall(state.apkPath, state.release)}
              style={styles.btn}>
              Install
            </FilledButton>
          </View>
        </>
      );
    }

    if (state.status === 'error') {
      return (
        <>
          <Text variant="titleMedium" style={styles.title}>
            Update Failed
          </Text>
          <Text variant="bodySmall" style={[styles.notes, { color: colors.onSurfaceVariant }]}>
            {state.message}
          </Text>
          <View style={styles.actions}>
            {state.apkPath && state.release && (
              <FilledButton
                onPress={() => onRetryInstall(state.apkPath!, state.release!)}
                style={styles.btn}>
                Retry Install
              </FilledButton>
            )}
            <OutlinedButton
              onPress={() => Linking.openURL(FALLBACK_URL).catch(() => {})}
              style={styles.btn}>
              Open Download Page
            </OutlinedButton>
            <OutlinedButton onPress={onDismiss} style={styles.btn}>
              Dismiss
            </OutlinedButton>
          </View>
        </>
      );
    }

    return null;
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={!isMandatory}
        onDismiss={isMandatory ? undefined : onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.surface },
        ]}>
        {renderContent()}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 24,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    marginBottom: 4,
  },
  version: {
    marginBottom: 12,
  },
  notes: {
    marginBottom: 20,
    lineHeight: 20,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
  },
  hint: {
    textAlign: 'center',
  },
  actions: {
    gap: 10,
  },
  btn: {
    width: '100%',
  },
});
