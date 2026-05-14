/**
 * HeroCard Component
 * Large card with avatar and glassmorphism effect
 */

import React from 'react';
import { View, ViewStyle, StyleSheet, ImageSourcePropType } from 'react-native';
import { Card as PaperCard, Avatar } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';

export interface HeroCardProps {
  /**
   * Child components to render inside card
   */
  children: React.ReactNode;

  /**
   * Avatar image source (URI or local)
   */
  avatar?: ImageSourcePropType;

  /**
   * Avatar icon name (if no image provided)
   */
  avatarIcon?: string;

  /**
   * Avatar size in dp
   * @default 120
   */
  avatarSize?: number;

  /**
   * Card press handler
   */
  onPress?: () => void;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Custom border radius (default 12dp)
   */
  borderRadius?: number;

  /**
   * Whether to apply glassmorphism effect
   * @default true
   */
  glassmorphism?: boolean;

  /**
   * Elevation level (0-5)
   * @default 2
   */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
}

/**
 * HeroCard
 *
 * Large prominent card with avatar and optional glassmorphism effect.
 * Used for profile cards, feature highlights, or hero sections.
 *
 * @example
 * // Basic hero card with avatar image
 * <HeroCard avatar={{ uri: 'https://example.com/avatar.jpg' }}>
 *   <Card.Content>
 *     <TitleLarge>John Doe</TitleLarge>
 *     <BodyMedium>Software Engineer</BodyMedium>
 *   </Card.Content>
 * </HeroCard>
 *
 * @example
 * // Hero card with icon avatar
 * <HeroCard avatarIcon="account" avatarSize={100}>
 *   <Card.Content>
 *     <DisplaySmall>Welcome</DisplaySmall>
 *     <BodyLarge>Get started with your profile</BodyLarge>
 *   </Card.Content>
 *   <Card.Actions>
 *     <FilledButton>Edit Profile</FilledButton>
 *   </Card.Actions>
 * </HeroCard>
 *
 * @example
 * // Interactive card with glassmorphism
 * <HeroCard
 *   avatar={{ uri: 'profile.jpg' }}
 *   glassmorphism
 *   elevation={3}
 *   onPress={() => navigation.navigate('Profile')}
 * >
 *   <Card.Content>
 *     <TitleLarge>Jane Smith</TitleLarge>
 *     <BodyMedium>View full profile</BodyMedium>
 *   </Card.Content>
 * </HeroCard>
 */
export const HeroCard: React.FC<HeroCardProps> = ({
  children,
  avatar,
  avatarIcon = 'account',
  avatarSize = 120,
  onPress,
  style,
  borderRadius,
  glassmorphism = true,
  elevation = 2,
}) => {
  const theme = useTheme();

  const elevationStyle = theme.elevation[`level${elevation}`];

  const cardStyle: ViewStyle = {
    borderRadius: borderRadius ?? 12,
    backgroundColor: glassmorphism
      ? `${theme.colors.surfaceContainerHigh}CC` // 80% opacity for glassmorphism
      : theme.colors.surfaceContainerHigh,
    ...elevationStyle.shadow,
    overflow: 'hidden',
    ...style,
  };

  return (
    <PaperCard mode="elevated" elevation={elevationStyle.shadowElevation} onPress={onPress} style={cardStyle}>
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Avatar.Image size={avatarSize} source={avatar} />
        ) : (
          <Avatar.Icon
            size={avatarSize}
            icon={avatarIcon}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            color={theme.colors.onPrimaryContainer}
          />
        )}
      </View>

      {/* Content Section */}
      {children}
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingTop: 32,
  },
});
