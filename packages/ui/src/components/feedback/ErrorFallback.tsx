/**
 * ErrorFallback Component
 * Universal error display with retry functionality
 *
 * Features:
 * - Material Design 3 error states
 * - Retry button with callback
 * - Customizable error messages
 * - Different error types (network, server, not found, etc.)
 * - Inline and full-screen variants
 *
 * Usage:
 * ```tsx
 * {error ? (
 *   <ErrorFallback
 *     error={error}
 *     onRetry={refetch}
 *     type="network"
 *   />
 * ) : (
 *   <YourContent />
 * )}
 * ```
 */

import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {Text} from '../typography/Text';
import {FilledButton, TextButton} from '../buttons';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from 'react-native-paper';

export type ErrorType = 'network' | 'server' | 'notFound' | 'unauthorized' | 'generic';

export interface ErrorFallbackProps {
  /**
   * The error object or message
   */
  error?: Error | string;

  /**
   * Callback fired when user clicks retry
   */
  onRetry?: () => void;

  /**
   * Type of error to display appropriate icon and message
   * @default 'generic'
   */
  type?: ErrorType;

  /**
   * Custom error title
   */
  title?: string;

  /**
   * Custom error description
   */
  description?: string;

  /**
   * Whether to show the retry button
   * @default true
   */
  showRetry?: boolean;

  /**
   * Variant: 'inline' for small sections, 'fullScreen' for whole screen
   * @default 'inline'
   */
  variant?: 'inline' | 'fullScreen';

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * Get error details based on error type
 */
const getErrorDetails = (type: ErrorType) => {
  switch (type) {
    case 'network':
      return {
        icon: 'wifi-off',
        title: 'Connection Error',
        description: 'Unable to connect. Please check your internet connection and try again.',
      };
    case 'server':
      return {
        icon: 'server-off',
        title: 'Server Error',
        description: 'Something went wrong on our end. Please try again later.',
      };
    case 'notFound':
      return {
        icon: 'file-search-outline',
        title: 'Not Found',
        description: 'The content you\'re looking for doesn\'t exist or has been removed.',
      };
    case 'unauthorized':
      return {
        icon: 'lock-alert-outline',
        title: 'Access Denied',
        description: 'You don\'t have permission to access this content.',
      };
    case 'generic':
    default:
      return {
        icon: 'alert-circle-outline',
        title: 'Something Went Wrong',
        description: 'An unexpected error occurred. Please try again.',
      };
  }
};

/**
 * ErrorFallback Component
 * Displays error states with retry functionality
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  type = 'generic',
  title: customTitle,
  description: customDescription,
  showRetry = true,
  variant = 'inline',
  style,
}) => {
  const theme = useTheme();
  const errorDetails = getErrorDetails(type);

  const title = customTitle || errorDetails.title;
  const description = customDescription ||
    (typeof error === 'string' ? error : error?.message) ||
    errorDetails.description;

  const isFullScreen = variant === 'fullScreen';

  return (
    <View
      style={[
        styles.container,
        isFullScreen ? styles.fullScreen : styles.inline,
        {backgroundColor: isFullScreen ? theme.colors.background : 'transparent'},
        style,
      ]}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View
          style={[
            styles.iconContainer,
            {backgroundColor: theme.colors.errorContainer},
          ]}>
          <Icon
            source={errorDetails.icon}
            size={isFullScreen ? 64 : 48}
            color={theme.colors.onErrorContainer}
          />
        </View>

        {/* Error Title */}
        <Text
          variant={isFullScreen ? 'headlineSmall' : 'titleMedium'}
          style={[
            styles.title,
            {color: theme.colors.onSurface},
          ]}>
          {title}
        </Text>

        {/* Error Description */}
        <Text
          variant="bodyMedium"
          style={[
            styles.description,
            {color: theme.colors.onSurfaceVariant},
          ]}>
          {description}
        </Text>

        {/* Retry Button */}
        {showRetry && onRetry && (
          <View style={styles.actions}>
            <FilledButton
              onPress={onRetry}
              icon="refresh"
              style={styles.retryButton}>
              Try Again
            </FilledButton>
          </View>
        )}

        {/* Technical Details (Development only) */}
        {__DEV__ && error instanceof Error && error.stack && (
          <View style={styles.debugInfo}>
            <TextButton
              onPress={() => console.log('Error Stack:', error.stack)}
              >
              View Technical Details
            </TextButton>
          </View>
        )}
      </View>
    </View>
  );
};

/**
 * Inline Error Fallback
 * Small error display for sections/cards
 */
export const InlineErrorFallback: React.FC<
  Omit<ErrorFallbackProps, 'variant'>
> = (props) => <ErrorFallback {...props} variant="inline" />;

/**
 * Full Screen Error Fallback
 * Large error display for entire screens
 */
export const FullScreenErrorFallback: React.FC<
  Omit<ErrorFallbackProps, 'variant'>
> = (props) => <ErrorFallback {...props} variant="fullScreen" />;

/**
 * Empty State Component
 * For when there's no data (not an error)
 */
export interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox-outline',
  title = 'No Data',
  description = 'There\'s nothing here yet.',
  actionLabel,
  onAction,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, styles.inline, style]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            {backgroundColor: theme.colors.surfaceVariant},
          ]}>
          <Icon
            source={icon}
            size={48}
            color={theme.colors.onSurfaceVariant}
          />
        </View>

        <Text
          variant="titleMedium"
          style={[styles.title, {color: theme.colors.onSurface}]}>
          {title}
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>
          {description}
        </Text>

        {actionLabel && onAction && (
          <View style={styles.actions}>
            <FilledButton onPress={onAction}>
              {actionLabel}
            </FilledButton>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
  },
  inline: {
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    marginTop: 8,
  },
  retryButton: {
    minWidth: 140,
  },
  debugInfo: {
    marginTop: 16,
  },
});
