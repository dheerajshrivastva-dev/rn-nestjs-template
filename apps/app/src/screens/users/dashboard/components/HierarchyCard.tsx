/**
 * HierarchyCard Component
 *
 * Displays parent user(s) in the hierarchy chain.
 * - For DISTRIBUTOR: Shows SUPER parent
 * - For RETAILER: Shows SUPER + DISTRIBUTOR (if applicable)
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { View, StyleSheet, Linking, TouchableOpacity, Pressable } from 'react-native';
import { ElevatedCard, Text, Divider, useTheme, Row } from '@bevarc/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserRole } from '../../../../api/types';
import { UserScreens } from '../../../../navigation/screens';

export interface ParentUserInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  level: number;
}

interface HierarchyCardProps {
  parents: ParentUserInfo[];
  isLoading?: boolean;
  role?: UserRole;
}

type NavigationProp = NativeStackNavigationProp<any>;

export const HierarchyCard = React.memo<HierarchyCardProps>(({
  parents,
  isLoading = false,
  role,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleParentPress = React.useCallback((parentId: string) => {
    navigation.navigate(UserScreens.Detail, { userId: parentId });
  }, [navigation]);

  const handleEmailPress = React.useCallback((email: string) => {
    Linking.openURL(`mailto:${email}`);
  }, []);

  const handlePhonePress = React.useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const formatRole = React.useCallback((role: string) => {
    return role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }, []);

  if (parents.length === 0 && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <ElevatedCard style={styles.card}>
        <View style={styles.header}>
          <Text variant="titleMedium">Hierarchy</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Loading hierarchy...
          </Text>
        </View>
      </ElevatedCard>
    );
  }

  return (
    <ElevatedCard style={styles.card}>
      <View style={styles.header}>
        <Text variant="titleMedium">Reporting Structure</Text>
      </View>

      {parents.map((parent, index) => (
        <View key={parent.id}>
          {index > 0 && <Divider style={styles.divider} />}
          <Pressable
            onPress={role === UserRole.SUPER_ADMIN ? () => handleParentPress(parent.id): null}
            style={({ pressed }) => [
              styles.parentItem,
              pressed && { backgroundColor: theme.colors.surfaceVariant, opacity: 0.8 }
            ]}
            android_ripple={{ color: theme.colors.primary, borderless: false }}
          >
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text variant="titleMedium" style={[styles.avatarText, { color: theme.colors.onPrimaryContainer }]}>
                {parent.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>

            {/* Parent Details */}
            <View style={styles.parentDetails}>
              {/* Name and Role */}
              <Row style={styles.nameRow}>
                <Text variant="titleSmall" style={styles.parentName}>
                  {parent.name}
                </Text>
                {role === UserRole.SUPER_ADMIN && <Icon name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />}
              </Row>

              {/* User ID */}
              <Row style={styles.detailRow}>
                <Icon name="badge-account-outline" size={14} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={styles.detailText}>
                  {parent.userId}
                </Text>
              </Row>

              {/* Role */}
              <Row style={styles.detailRow}>
                <Icon name="shield-account-outline" size={14} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={styles.detailText}>
                  {formatRole(parent.role)}
                </Text>
              </Row>

              {/* Email (clickable) */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleEmailPress(parent.email);
                }}
              >
                <Row style={styles.detailRow}>
                  <Icon name="email-outline" size={14} color={theme.colors.primary} />
                  <Text variant="bodySmall" style={[styles.detailText, { color: theme.colors.primary }]}>
                    {parent.email}
                  </Text>
                </Row>
              </TouchableOpacity>

              {/* Phone (clickable, if available) */}
              {parent.phone && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePhonePress(parent.phone!);
                  }}
                >
                  <Row style={styles.detailRow}>
                    <Icon name="phone-outline" size={14} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={[styles.detailText, { color: theme.colors.primary }]}>
                      {parent.phone}
                    </Text>
                  </Row>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </View>
      ))}
    </ElevatedCard>
  );
});

HierarchyCard.displayName = 'HierarchyCard';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  parentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '600',
  },
  parentDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  parentName: {
    fontWeight: '600',
  },
  detailRow: {
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    flex: 1,
  },
  divider: {
    marginHorizontal: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});
