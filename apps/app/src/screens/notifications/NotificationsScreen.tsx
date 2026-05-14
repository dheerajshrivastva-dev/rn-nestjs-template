/**
 * NotificationsScreen — Notification inbox for all roles
 *
 * - Infinite scroll with accumulating pages
 * - Date group separators (like messaging apps)
 * - Arrow buttons to jump between date groups
 * - Unread / read visual distinction
 * - Pull-to-refresh
 * - Floating "Read all" pill
 */

import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import {
  EmptyState,
  ListItemShimmer,
  SafeScreen,
  Text,
  useTheme,
} from '@forge/ui';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { SharedScreens } from '../../navigation/screens';
import type { UserStackParamList } from '../../navigation/types';
import {
  useMarkAllRead,
  useMarkRead,
  useNotificationsInfinite,
  type NotificationItem,
} from '../../hooks/queries/useNotifications';

// ─── Types ────────────────────────────────────────────────────────────────────

type DateHeaderItem = { _type: 'header'; label: string; date: string };
type NotificationListItem = { _type: 'item' } & NotificationItem;
type FlatItem = DateHeaderItem | NotificationListItem;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDayKey(dateString: string): string {
  return new Date(dateString).toISOString().slice(0, 10); // "2026-03-10"
}

function formatDayLabel(dayKey: string): string {
  const date = new Date(dayKey);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const toKey = (d: Date) => d.toISOString().slice(0, 10);

  if (dayKey === toKey(today)) return 'Today';
  if (dayKey === toKey(yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const s = Math.floor(diffMs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (s < 60) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(dateString).toLocaleDateString();
}

/** Interleave date header items into the flat list */
function buildFlatList(items: NotificationItem[]): FlatItem[] {
  const result: FlatItem[] = [];
  let lastKey = '';

  for (const item of items) {
    const key = getDayKey(item.createdAt);
    if (key !== lastKey) {
      result.push({ _type: 'header', label: formatDayLabel(key), date: key });
      lastKey = key;
    }
    result.push({ _type: 'item', ...item });
  }
  return result;
}

interface NotificationMeta {
  icon: string;
  color: (colors: ReturnType<typeof useTheme>['colors']) => string;
  containerColor: (colors: ReturnType<typeof useTheme>['colors']) => string;
  label: string;
}

function getNotificationMeta(type: string): NotificationMeta {
  if (type.startsWith('order_'))
    return {
      icon: 'shopping-outline',
      color: (c) => c.primary,
      containerColor: (c) => c.primaryContainer,
      label: 'Order',
    };
  if (type.startsWith('key_transfer_'))
    return {
      icon: 'key-variant',
      color: (c) => c.tertiary,
      containerColor: (c) => c.tertiaryContainer,
      label: 'Key Transfer',
    };
  if (type === 'command_ack')
    return {
      icon: 'phone-check-outline',
      color: (c) => c.secondary,
      containerColor: (c) => c.secondaryContainer,
      label: 'Command',
    };
  if (type === 'system_alert')
    return {
      icon: 'alert-circle-outline',
      color: (c) => c.error,
      containerColor: (c) => c.errorContainer,
      label: 'Alert',
    };
  return {
    icon: 'bell-outline',
    color: (c) => c.onSurfaceVariant,
    containerColor: (c) => c.surfaceVariant,
    label: 'Notification',
  };
}

// ─── Date Header ──────────────────────────────────────────────────────────────

interface DateHeaderProps {
  label: string;
}

const DateHeader = React.memo<DateHeaderProps>(({ label }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.dateHeaderWrap}>
      <View style={[styles.dateHeaderLine, { backgroundColor: colors.outlineVariant }]} />
      <View style={[styles.dateHeaderPill, { backgroundColor: colors.surfaceVariant }]}>
        <Text variant="labelSmall" color={colors.onSurfaceVariant} style={styles.dateHeaderText}>
          {label}
        </Text>
      </View>
      <View style={[styles.dateHeaderLine, { backgroundColor: colors.outlineVariant }]} />
    </View>
  );
});
DateHeader.displayName = 'DateHeader';

// ─── Notification Row ─────────────────────────────────────────────────────────

interface NotificationRowProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}

const NotificationRow = React.memo<NotificationRowProps>(({ item, onPress }) => {
  const { colors } = useTheme();
  const meta = getNotificationMeta(item.type);

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.7}
      style={[
        styles.row,
        !item.isRead && { backgroundColor: colors.primaryContainer + '28' },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.containerColor(colors) }]}>
        <Icon name={meta.icon} size={20} color={meta.color(colors)} />
      </View>

      <View style={styles.rowBody}>
        {/* Time on its own line above title — always fully visible */}
        <Text variant="labelSmall" color={colors.onSurfaceVariant} style={styles.rowTime}>
          {formatRelativeTime(item.createdAt)}
        </Text>
        <Text
          variant="labelLarge"
          style={[styles.rowTitle, { color: colors.onSurface }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <Text
          variant="bodySmall"
          color={colors.onSurfaceVariant}
          numberOfLines={2}
          style={styles.rowMessage}
        >
          {item.body}
        </Text>

        <View style={styles.rowMeta}>
          <View style={[styles.typeChip, { backgroundColor: meta.containerColor(colors) }]}>
            <Text variant="labelSmall" color={meta.color(colors)}>
              {meta.label}
            </Text>
          </View>
          {!item.isRead && (
            <View style={[styles.unreadPill, { backgroundColor: colors.primary }]}>
              <Text variant="labelSmall" color={colors.onPrimary}>New</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});
NotificationRow.displayName = 'NotificationRow';

// ─── Screen ───────────────────────────────────────────────────────────────────

type NavigationProp = NativeStackNavigationProp<UserStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const listRef = React.useRef<FlatList<FlatItem>>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useNotificationsInfinite();

  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();

  const items = React.useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const flatList = React.useMemo(() => buildFlatList(items), [items]);

  // Indices of every date header in the flat list — used for arrow navigation
  const groupIndexes = React.useMemo(
    () => flatList.reduce<number[]>((acc, item, i) => {
      if (item._type === 'header') acc.push(i);
      return acc;
    }, []),
    [flatList],
  );

  const [activeGroup, setActiveGroup] = React.useState(0);

  const unreadCount = items.filter((i) => !i.isRead).length;

  const handleItemPress = React.useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) markRead.mutate(item.id);
      navigation.navigate(SharedScreens.NotificationDetail as any, { id: item.id, item });
    },
    [markRead, navigation],
  );

  const handleLoadMore = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleReadAll = React.useCallback(() => {
    markAllRead.mutate();
  }, [markAllRead]);

  const scrollToGroup = React.useCallback((groupIdx: number) => {
    const clamped = Math.max(0, Math.min(groupIdx, groupIndexes.length - 1));
    setActiveGroup(clamped);
    const flatIdx = groupIndexes[clamped];
    if (flatIdx !== undefined) {
      listRef.current?.scrollToIndex({ index: flatIdx, animated: true, viewOffset: 4 });
    }
  }, [groupIndexes]);

  const renderItem = React.useCallback(({ item }: { item: FlatItem }) => {
    if (item._type === 'header') {
      return <DateHeader label={item.label} />;
    }
    return <NotificationRow item={item} onPress={handleItemPress} />;
  }, [handleItemPress]);

  const keyExtractor = React.useCallback((item: FlatItem) =>
    item._type === 'header' ? `header-${item.date}` : item.id,
  []);

  const ItemSeparator = React.useCallback(() => (
    <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
  ), [colors.outlineVariant]);

  return (
    <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
      {isLoading ? (
        <View style={styles.shimmerWrap}>
          <ListItemShimmer count={8} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={flatList}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              icon="bell-off-outline"
              title="No Notifications"
              description="You're all caught up! Notifications will appear here."
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ListItemShimmer count={2} />
              </View>
            ) : null
          }
          refreshing={isRefetching}
          onRefresh={refetch}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={() => {/* ignore — list may not be rendered yet */}}
        />
      )}

      {/* Bottom overlay: date arrows + read-all FAB */}
      {groupIndexes.length > 1 && (
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Arrow nav */}
          <View style={styles.arrowRow}>
            <TouchableOpacity
              onPress={() => scrollToGroup(activeGroup - 1)}
              disabled={activeGroup === 0}
              style={[
                styles.arrowBtn,
                { backgroundColor: colors.surfaceVariant },
                activeGroup === 0 && styles.arrowDisabled,
              ]}
              accessibilityLabel="Previous day"
            >
              <Icon
                name="chevron-up"
                size={18}
                color={activeGroup === 0 ? colors.outline : colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <View style={[styles.groupLabel, { backgroundColor: colors.surfaceVariant }]}>
              <Text variant="labelSmall" color={colors.onSurfaceVariant}>
                {flatList[groupIndexes[activeGroup]]?._type === 'header'
                  ? (flatList[groupIndexes[activeGroup]] as DateHeaderItem).label
                  : ''}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => scrollToGroup(activeGroup + 1)}
              disabled={activeGroup === groupIndexes.length - 1}
              style={[
                styles.arrowBtn,
                { backgroundColor: colors.surfaceVariant },
                activeGroup === groupIndexes.length - 1 && styles.arrowDisabled,
              ]}
              accessibilityLabel="Next day"
            >
              <Icon
                name="chevron-down"
                size={18}
                color={activeGroup === groupIndexes.length - 1 ? colors.outline : colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {/* Read all FAB */}
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleReadAll}
              style={[styles.readAllFab, { backgroundColor: colors.primaryContainer }]}
              accessibilityLabel="Mark all as read"
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Icon name="check-all" size={16} color={colors.onPrimaryContainer} />
              <Text variant="labelMedium" style={{ color: colors.onPrimaryContainer }}>
                Read all
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Read all FAB when no groups (single-day list) */}
      {groupIndexes.length <= 1 && unreadCount > 0 && (
        <TouchableOpacity
          onPress={handleReadAll}
          style={[styles.readAllFab, { backgroundColor: colors.primaryContainer }]}
          accessibilityLabel="Mark all as read"
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <Icon name="check-all" size={16} color={colors.onPrimaryContainer} />
          <Text variant="labelMedium" style={{ color: colors.onPrimaryContainer }}>
            Read all
          </Text>
        </TouchableOpacity>
      )}
    </SafeScreen>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shimmerWrap: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100, // space for overlay
  },
  // Date header
  dateHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  dateHeaderLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dateHeaderPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateHeaderText: {
    fontWeight: '600',
  },
  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTime: {
    marginBottom: 2,
  },
  rowTitle: {
    fontWeight: '600',
  },
  rowMessage: {
    lineHeight: 18,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  divider: {
    height: 2,
    marginLeft: 72,
    backgroundColor: '#ff0',
  },
  footer: {
    padding: 8,
  },
  // Bottom overlay
  overlay: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  arrowDisabled: {
    opacity: 0.4,
  },
  groupLabel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  readAllFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
