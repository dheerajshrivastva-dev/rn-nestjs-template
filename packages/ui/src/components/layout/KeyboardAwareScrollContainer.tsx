/**
 * KeyboardAwareScrollContainer Component
 * Scrollable container that automatically adjusts when keyboard appears
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import {useTheme} from '../../hooks/useTheme';

export interface KeyboardAwareScrollContainerProps extends ScrollViewProps {
  /**
   * Child components to render inside scrollable area
   */
  children: React.ReactNode;

  /**
   * Custom padding (overrides default 16dp)
   */
  padding?: number;

  /**
   * Custom background color (overrides theme surface)
   */
  backgroundColor?: string;

  /**
   * Whether to show vertical scroll indicator
   * @default false
   */
  showsVerticalScrollIndicator?: boolean;

  /**
   * Whether to enable keyboard dismissal on drag
   * @default 'handled'
   */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';

  /**
   * KeyboardAvoidingView behavior
   * @default 'padding' on iOS, 'height' on Android
   */
  keyboardBehavior?: 'height' | 'position' | 'padding';

  /**
   * Additional offset for keyboard avoidance
   * @default 0
   */
  keyboardVerticalOffset?: number;

  /**
   * Whether to enable keyboard avoiding behavior
   * @default true
   */
  enableKeyboardAvoiding?: boolean;
}

/**
 * KeyboardAwareScrollContainer
 *
 * Scrollable container with automatic keyboard avoidance for forms and text inputs.
 * Combines KeyboardAvoidingView and ScrollView for optimal keyboard handling.
 *
 * **Use this instead of ScrollContainer for screens with TextFields.**
 *
 * @example
 * // Basic form container
 * <KeyboardAwareScrollContainer>
 *   <TextField label="Name" />
 *   <TextField label="Email" />
 *   <TextField label="Password" />
 * </KeyboardAwareScrollContainer>
 *
 * @example
 * // With custom padding and offset
 * <KeyboardAwareScrollContainer padding={24} keyboardVerticalOffset={100}>
 *   <Form />
 * </KeyboardAwareScrollContainer>
 *
 * @example
 * // Disable keyboard avoiding (use as regular ScrollContainer)
 * <KeyboardAwareScrollContainer enableKeyboardAvoiding={false}>
 *   <Content />
 * </KeyboardAwareScrollContainer>
 */
export const KeyboardAwareScrollContainer: React.FC<
  KeyboardAwareScrollContainerProps
> = ({
  children,
  padding,
  backgroundColor,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  keyboardBehavior,
  keyboardVerticalOffset = 0,
  enableKeyboardAvoiding = true,
  contentContainerStyle,
  style,
  ...props
}) => {
  const theme = useTheme();

  // Default behavior: padding on iOS, height on Android
  const behavior = keyboardBehavior || (Platform.OS === 'ios' ? 'padding' : 'height');

  const scrollViewStyle: ViewStyle[] = [
    {
      backgroundColor: backgroundColor ?? theme.colors.surface,
    },
    style as ViewStyle,
  ];

  const contentStyle: ViewStyle[] = [
    {
      padding: padding ?? theme.spacing.none,
      flexGrow: 1, // Allow content to grow to fill space
    },
    contentContainerStyle as ViewStyle,
  ];

  const scrollContent = (
    <ScrollView
      style={scrollViewStyle}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      bounces={Platform.OS === 'ios'} // iOS bounce effect
      overScrollMode="never" // Disable Android overscroll glow
      {...props}>
      {children}
    </ScrollView>
  );

  // If keyboard avoiding is disabled, return plain ScrollView
  if (!enableKeyboardAvoiding) {
    return scrollContent;
  }

  // Wrap with KeyboardAvoidingView with theme background
  return (
    <KeyboardAvoidingView
      style={[
        styles.keyboardView,
        {backgroundColor: backgroundColor ?? theme.colors.surface},
      ]}
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled={Platform.OS !== 'web'} // Disable on web
    >
      {scrollContent}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
});
