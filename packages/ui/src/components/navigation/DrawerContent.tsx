/**
 * MD3 Drawer Content Component
 * Role-based navigation drawer with sections and dividers
 *
 * @see https://m3.material.io/components/navigation-drawer/overview
 */

import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Drawer, Avatar, Divider} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../hooks/useTheme';
import {Text} from '../typography/Text';
import {LabelMedium} from '../typography/LabelMedium';
import {BodySmall} from '../typography/BodySmall';

export interface DrawerSection {
  type: 'header' | 'item' | 'divider';
  title?: string; // For header
  label?: string; // For item
  icon?: string; // For item
  route?: string; // For item
  badge?: string | number; // For item
  active?: boolean; // For item
  onPress?: () => void; // For item
  action?: 'logout' | string; // For item with special action
}

export interface DrawerContentProps {
  /**
   * User profile image URL
   */
  profileImageUrl?: string;

  /**
   * User name
   */
  userName: string;

  /**
   * User email
   */
  userEmail: string;

  /**
   * User role
   */
  userRole: string;

  /**
   * Drawer sections (headers, items, dividers)
   */
  sections: DrawerSection[];

  /**
   * Current active route
   */
  activeRoute?: string;

  /**
   * Callback when drawer item is pressed
   */
  onItemPress?: (route: string) => void;

  /**
   * Callback when logout is pressed
   */
  onLogout?: () => void;

  /**
   * Callback when profile header is pressed
   */
  onProfilePress?: () => void;
}

/**
 * MD3 Drawer Content
 * Renders navigation drawer with user profile, sections, and items
 */
export const DrawerContent: React.FC<DrawerContentProps> = ({
  profileImageUrl,
  userName,
  userEmail,
  userRole,
  sections,
  activeRoute,
  onItemPress,
  onLogout,
  onProfilePress,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleItemPress = (section: DrawerSection) => {
    if (section.action === 'logout' && onLogout) {
      onLogout();
    } else if (section.route && onItemPress) {
      onItemPress(section.route);
    } else if (section.onPress) {
      section.onPress();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}>
      {/* User Profile Header */}
      <Drawer.Section
        style={[
          styles.profileSection,
          {
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}>
        <View
          style={styles.profileHeader}
          onTouchEnd={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="View profile">
          {profileImageUrl ? (
            <Avatar.Image source={{uri: profileImageUrl}} size={64} />
          ) : (
            <Avatar.Text
              label={userName
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
              size={64}
              style={{
                backgroundColor: theme.colors.primaryContainer,
              }}
              labelStyle={{
                fontFamily: 'Inter-SemiBold',
                // fontSize: 24 removed - use default Avatar.Text sizing
                color: theme.colors.onPrimaryContainer,
              }}
            />
          )}
          <View style={styles.profileInfo}>
            <Text
              style={[
                styles.userName,
                {
                  color: theme.colors.onSurface,
                },
              ]}>
              {userName}
            </Text>
            <BodySmall
              style={{
                color: theme.colors.onSurfaceVariant,
              }}>
              {userEmail}
            </BodySmall>
            <LabelMedium
              style={[
                styles.roleLabel,
                {
                  color: theme.colors.primary,
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}>
              {userRole}
            </LabelMedium>
          </View>
        </View>
      </Drawer.Section>

      {/* Scrollable Sections */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {sections.map((section, index) => {
          // Render Header
          if (section.type === 'header' && section.title) {
            return (
              <View key={`header-${index}`} style={styles.headerContainer}>
                <LabelMedium
                  style={[
                    styles.sectionHeader,
                    {
                      color: theme.colors.onSurfaceVariant,
                    },
                  ]}>
                  {section.title}
                </LabelMedium>
              </View>
            );
          }

          // Render Divider
          if (section.type === 'divider') {
            return (
              <Divider
                key={`divider-${index}`}
                style={[
                  styles.divider,
                  {
                    backgroundColor: theme.colors.outlineVariant,
                  },
                ]}
              />
            );
          }

          // Render Item
          if (section.type === 'item' && section.label) {
            const isActive = section.active || section.route === activeRoute;

            return (
              <Drawer.Item
                key={`item-${index}`}
                label={section.label}
                icon={section.icon}
                active={isActive}
                onPress={() => handleItemPress(section)}
                style={[
                  styles.drawerItem,
                  isActive && {
                    backgroundColor: theme.colors.secondaryContainer,
                  },
                ]}
                // labelStyle removed - not supported in RN Paper v5+, uses theme typography
                right={
                  section.badge
                    ? () => (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: theme.colors.primary,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color: theme.colors.onPrimary,
                              },
                            ]}>
                            {section.badge}
                          </Text>
                        </View>
                      )
                    : undefined
                }
              />
            );
          }

          return null;
        })}
      </ScrollView>

      {/* App Version (Optional) */}
      <View style={styles.footer}>
        <BodySmall
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
          }}>
          v1.0.0
        </BodySmall>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter-SemiBold',
    // fontSize: 16 removed - will be set inline or use Text component default
    marginBottom: 2,
  },
  roleLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    // fontSize: 12 removed - LabelMedium already provides MD3 labelMedium (12sp)
    fontFamily: 'Inter-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  headerContainer: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    // fontSize: 12 removed - LabelMedium already provides MD3 labelMedium (12sp)
    fontFamily: 'Inter-SemiBold',
  },
  drawerItem: {
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 28,
  },
  divider: {
    marginVertical: 8,
    marginHorizontal: 28,
    height: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    // fontSize: 12 removed - should use LabelMedium or theme typography
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
});
