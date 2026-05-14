/**
 * AuthScreenLayout
 * Shared layout for all auth screens.
 * Back button lives in AppBar (fixed header) — no layout shift.
 */

import React from 'react';
import {View, StyleSheet, Image} from 'react-native';
import {
  ScreenWrapper,
  KeyboardAwareScrollContainer,
  Text,
  useTheme,
  IconButton,
} from '@forge/ui';

interface AuthScreenLayoutProps {
  /** Back button press handler. If undefined, AppBar is not shown. */
  onBack?: () => void;
  /** Disable back button during loading */
  backDisabled?: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({
  onBack,
  backDisabled,
  title,
  subtitle,
  children,
}) => {
  const theme = useTheme();

  return (
    <ScreenWrapper edges={['top', 'bottom', 'left', 'right']}>
      {/* Always-present AppBar — back button shown/hidden based on onBack */}
      <View style={styles.header}>
        {onBack ? (
          <IconButton
          icon="arrow-left"
          onPress={onBack}
          disabled={backDisabled}
          style={styles.backButton}
        />) : null}
      </View>

      <KeyboardAwareScrollContainer
        backgroundColor={theme.colors.surface}
        keyboardBehavior="padding"
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>

          {/* Logo — shown on all auth screens */}
          <View style={styles.logoSection}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text
              variant="bodyMedium"
              align="center"
              color={theme.colors.onSurfaceVariant}>
              Device Management Made Simple
            </Text>
          </View>

          <Text
            variant="headlineMedium"
            align="center"
            style={styles.title}
            color={theme.colors.onSurface}>
            {title}
          </Text>

          {subtitle != null && (
            <Text
              variant="bodyMedium"
              align="center"
              color={theme.colors.onSurfaceVariant}>
              {subtitle}
            </Text>
          )}

          {children}
        </View>
      </KeyboardAwareScrollContainer>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: "transparent",
  },
  backButton: {
    padding: 0,
    width: 32,
    height: 32,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 32,
  },
  content: {
    paddingHorizontal: 20,
    width: '100%',
    alignSelf: 'center',
    gap: 20,
    maxWidth: 420,
  },
  logoSection: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  logo: {
    width: 144,
    height: 144,
    marginBottom: 8,
  },
  title: {
    fontWeight: '600',
  },
});
