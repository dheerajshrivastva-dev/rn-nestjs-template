/**
 * NotificationDetailScreen
 *
 * Full notification content with:
 * - Type icon + coloured header band
 * - Read/unread pill
 * - Title, body, timestamp
 * - Optional deep-link action button
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppBar,
  ElevatedCard,
  FilledButton,
  FilledTonalButton,
  SafeScreen,
  Spacer,
  Text,
  useTheme,
} from '@forge/ui';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getFCMScreenMapping } from '../../navigation/configs/fcmMapping';
import { SharedScreens } from '../../navigation/screens';
import { useAuthStore, selectUserRole } from '../../store/authStore';
import type { FCMNotificationType, UserStackParamList } from '../../navigation/types';
import type { NotificationItem } from '../../hooks/queries/useNotifications';

// ─── Types ───────────────────────────────────────────────────────────────────

type RouteParams = RouteProp<
  { [SharedScreens.NotificationDetail]: { id: string; item: NotificationItem } },
  typeof SharedScreens.NotificationDetail
>;

type NavigationProp = NativeStackNavigationProp<UserStackParamList>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface NotificationMeta {
  icon: string;
  label: string;
  color: (colors: ReturnType<typeof useTheme>['colors']) => string;
  containerColor: (colors: ReturnType<typeof useTheme>['colors']) => string;
}

function getNotificationMeta(type: string): NotificationMeta {
  if (type.startsWith('order_'))
    return {
      icon: 'shopping-outline',
      label: 'Order',
      color: (c) => c.primary,
      containerColor: (c) => c.primaryContainer,
    };
  if (type.startsWith('key_transfer_'))
    return {
      icon: 'key-variant',
      label: 'Key Transfer',
      color: (c) => c.tertiary,
      containerColor: (c) => c.tertiaryContainer,
    };
  if (type === 'command_ack')
    return {
      icon: 'phone-check-outline',
      label: 'Command',
      color: (c) => c.secondary,
      containerColor: (c) => c.secondaryContainer,
    };
  if (type === 'system_alert')
    return {
      icon: 'alert-circle-outline',
      label: 'System Alert',
      color: (c) => c.error,
      containerColor: (c) => c.errorContainer,
    };
  return {
    icon: 'bell-outline',
    label: 'Notification',
    color: (c) => c.onSurfaceVariant,
    containerColor: (c) => c.surfaceVariant,
  };
}

function getActionLabel(type: string): string | null {
  if (type.startsWith('order_')) return 'View Order';
  if (type.startsWith('key_transfer_')) return 'View Transfer';
  if (type === 'command_ack') return 'View Client';
  if (type === 'system_alert') return 'View System Health';
  return null;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const NotificationDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { item } = route.params;
  const { colors } = useTheme();
  const userRole = useAuthStore(selectUserRole);

  const meta = getNotificationMeta(item.type);
  const actionLabel = getActionLabel(item.type);

  const handleAction = React.useCallback(() => {
    if (!userRole) return;
    const mapping = getFCMScreenMapping(item.type as FCMNotificationType, userRole);
    if (!mapping) return;
    navigation.navigate(mapping.screen as any, mapping.getParams(item.data ?? {}) as any);
  }, [item, navigation, userRole]);

  const iconColor = meta.color(colors);
  const iconBg = meta.containerColor(colors);

  return (
    <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header band */}
        <View style={[styles.heroBand, { backgroundColor: iconBg }]}>
          <View style={[styles.heroIconCircle, { backgroundColor: iconColor + '22' }]}>
            <Icon name={meta.icon} size={36} color={iconColor} />
          </View>
          <Spacer spacing={12} />
          <View style={[styles.typePill, { backgroundColor: iconColor + '22' }]}>
            <Icon name={meta.icon} size={12} color={iconColor} />
            <Text variant="labelMedium" color={iconColor} style={styles.typePillText}>
              {meta.label}
            </Text>
          </View>
          <Spacer spacing={8} />
          <View style={[
            styles.readPill,
            { backgroundColor: item.isRead ? colors.surfaceVariant : colors.primary },
          ]}>
            <Icon
              name={item.isRead ? 'check-circle-outline' : 'circle-outline'}
              size={12}
              color={item.isRead ? colors.onSurfaceVariant : colors.onPrimary}
            />
            <Text
              variant="labelSmall"
              color={item.isRead ? colors.onSurfaceVariant : colors.onPrimary}
              style={styles.readPillText}
            >
              {item.isRead ? 'Read' : 'Unread'}
            </Text>
          </View>
        </View>

        {/* Content card */}
        <ElevatedCard style={styles.card}>
          {/* Label above title */}
          <Text variant="labelMedium" color={iconColor} style={styles.cardLabel}>
            {meta.label.toUpperCase()}
          </Text>
          <Spacer spacing={6} />

          {/* Title */}
          <Text variant="headlineMedium" style={[styles.title, { color: colors.onSurface }]}>
            {item.title}
          </Text>
          <Spacer spacing={4} />

          {/* Timestamp inline below title */}
          <View style={styles.timestampRow}>
            <Icon name="clock-outline" size={13} color={colors.outline} />
            <Text variant="labelSmall" color={colors.outline} style={styles.timestamp}>
              {formatFullDate(item.createdAt)}
            </Text>
          </View>

          {/* Divider */}
          <Spacer spacing={16} />
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <Spacer spacing={16} />

          {/* Body */}
          <Text variant="bodyLarge" color={colors.onSurfaceVariant} style={styles.body}>
            {item.body}
          </Text>
        </ElevatedCard>

        {/* Action */}
        {actionLabel ? (
          <FilledButton onPress={handleAction} style={styles.actionBtn}>
            {actionLabel}
          </FilledButton>
        ) : (
          <FilledTonalButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
            style={styles.actionBtn}
          >
            Back to Notifications
          </FilledTonalButton>
        )}
      </ScrollView>
    </SafeScreen>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    gap: 0,
    paddingBottom: 32,
  },
  heroBand: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 0,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  typePillText: {
    fontWeight: '600',
  },
  readPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  readPillText: {
    fontWeight: '500',
  },
  card: {
    margin: 16,
    padding: 20,
  },
  cardLabel: {
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontWeight: '700',
    lineHeight: 34,
  },
  body: {
    lineHeight: 26,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    flex: 1,
  },
  actionBtn: {
    marginHorizontal: 16,
    marginTop: 4,
  },
});
