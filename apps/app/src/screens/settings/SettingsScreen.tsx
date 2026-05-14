/**
 * Settings Screen
 * App preferences + role-specific business config.
 *
 * Sections:
 *  - Appearance       (all roles)
 *  - Notifications    (all roles)
 *  - System           (SUPER_ADMIN only)
 *  - Business         (SUPER only)
 *  - Business         (DISTRIBUTOR only)
 *  - Client Defaults  (RETAILER only)
 *  - App              (all roles — version, legal)
 */

import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme, Divider, Switch } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  SafeScreen,
  Text,
  ElevatedCard,
} from '@forge/ui';

import { UserRole } from '../../api/types';
import type { NotificationPreferences } from '../../api/types';
import { useAuthStore, selectUser } from '../../store/authStore';
import {
  useSettingsStore,
  type FontSize,
} from '../../store/settingsStore';
import { SystemScreens } from '../../navigation/screens';
import type { UserStackNavigationProp } from '../../navigation/types';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../../hooks/useNotificationPreferences';
import {
  useUserSettings,
  useUpdateUserSettings,
} from '../../hooks/useUserSettings';

// ─── Constants ────────────────────────────────────────────────────────────────

const APP_VERSION = '1.0.1';
const BUILD_NUMBER = '2';

const FONT_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'small',  label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large',  label: 'L' },
];

// ─── Sub-components (all defined outside render) ─────────────────────────────

// Section header — uppercase label in primary color
const SectionHeader: React.FC<{ label: string; delay?: number }> = ({
  label,
  delay = 0,
}) => {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.sectionHeader}>
      <Text variant="labelSmall" style={{ color: theme.colors.primary, letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
    </Animated.View>
  );
};

SectionHeader.displayName = 'SectionHeader';

// Standard pressable row with icon pill, label, description, and trailing slot
interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  tint?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  delay?: number;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  label,
  description,
  tint,
  trailing,
  onPress,
  delay = 0,
}) => {
  const theme = useTheme();
  const iconColor = tint ?? theme.colors.primary;

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed && onPress ? `${theme.colors.primary}08` : 'transparent' },
        ]}
      >
        {/* Icon pill */}
        <View style={[styles.iconPill, { backgroundColor: `${iconColor}18` }]}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>

        {/* Labels */}
        <View style={styles.rowText}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
            {label}
          </Text>
          {description ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {description}
            </Text>
          ) : null}
        </View>

        {/* Trailing slot */}
        {trailing != null ? (
          <View style={styles.rowTrailing}>{trailing}</View>
        ) : onPress ? (
          <View style={styles.rowTrailing}>
            <Icon name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

SettingRow.displayName = 'SettingRow';

// Toggle row — SettingRow with a Switch trailing
interface ToggleRowProps {
  icon: string;
  label: string;
  description?: string;
  tint?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  delay?: number;
  disabled?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  icon,
  label,
  description,
  tint,
  value,
  onToggle,
  delay = 0,
  disabled = false,
}) => {
  const theme = useTheme();
  return (
    <SettingRow
      icon={icon}
      label={label}
      description={description}
      tint={tint}
      delay={delay}
      onPress={() => !disabled && onToggle(!value)}
      trailing={
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={disabled}
          color={theme.colors.primary}
        />
      }
    />
  );
};

ToggleRow.displayName = 'ToggleRow';

// Numeric stepper — minus / value / plus
interface StepperRowProps {
  icon: string;
  label: string;
  description?: string;
  tint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  delay?: number;
}

const StepperRow: React.FC<StepperRowProps> = ({
  icon,
  label,
  description,
  tint,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  delay = 0,
}) => {
  const theme = useTheme();

  const decrement = useCallback(() => {
    if (value - step >= min) onChange(value - step);
  }, [value, step, min, onChange]);

  const increment = useCallback(() => {
    if (value + step <= max) onChange(value + step);
  }, [value, step, max, onChange]);

  return (
    <SettingRow
      icon={icon}
      label={label}
      description={description}
      tint={tint}
      delay={delay}
      trailing={
        <View style={styles.stepper}>
          <TouchableOpacity
            onPress={decrement}
            disabled={value <= min}
            style={[
              styles.stepBtn,
              { backgroundColor: `${theme.colors.primary}18`, opacity: value <= min ? 0.4 : 1 },
            ]}
          >
            <Icon name="minus" size={14} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text
            variant="bodyMedium"
            style={[styles.stepValue, { color: theme.colors.onSurface }]}
          >
            {value}{unit}
          </Text>
          <TouchableOpacity
            onPress={increment}
            disabled={value >= max}
            style={[
              styles.stepBtn,
              { backgroundColor: `${theme.colors.primary}18`, opacity: value >= max ? 0.4 : 1 },
            ]}
          >
            <Icon name="plus" size={14} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      }
    />
  );
};

StepperRow.displayName = 'StepperRow';

// Dark / light mode toggle — palette is fixed per role
const DarkModePicker: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const theme = useTheme();
  const isDark = useSettingsStore((s) => s.isDark);
  const setIsDark = useSettingsStore((s) => s.setIsDark);

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.row}>
      <View style={[styles.iconPill, { backgroundColor: `${theme.colors.primary}18` }]}>
        <Icon name={isDark ? 'weather-night' : 'weather-sunny'} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
          Mode
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Color palette is based on your role
        </Text>
      </View>
      <View style={[styles.segmented, { borderColor: theme.colors.outlineVariant }]}>
        {([false, true] as const).map((dark, i) => {
          const selected = isDark === dark;
          return (
            <TouchableOpacity
              key={String(dark)}
              onPress={() => setIsDark(dark)}
              style={[
                styles.segmentBtn,
                i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.colors.outlineVariant },
                selected && { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Icon
                name={dark ? 'weather-night' : 'weather-sunny'}
                size={16}
                color={selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

DarkModePicker.displayName = 'DarkModePicker';

// Font size segmented picker
const FontSizePicker: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const theme = useTheme();
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.row}>
      <View style={[styles.iconPill, { backgroundColor: `${theme.colors.primary}18` }]}>
        <Icon name="format-size" size={20} color={theme.colors.primary} />
      </View>

      <View style={styles.rowText}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
          Font Size
        </Text>
      </View>

      <View style={[styles.segmented, { borderColor: theme.colors.outlineVariant }]}>
        {FONT_OPTIONS.map((opt, i) => {
          const selected = fontSize === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setFontSize(opt.value)}
              style={[
                styles.segmentBtn,
                i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.colors.outlineVariant },
                selected && { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text
                variant="labelMedium"
                style={{
                  color: selected
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant,
                  fontWeight: selected ? '700' : '400',
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

FontSizePicker.displayName = 'FontSizePicker';

// ─── Role-specific section components ────────────────────────────────────────

const SuperAdminSection: React.FC = () => {
  const navigation = useNavigation<UserStackNavigationProp>();
  return (
    <>
      <SectionHeader label="System" delay={220} />
      <Animated.View entering={FadeInDown.delay(240).springify()}>
        <ElevatedCard style={styles.card}>
          <SettingRow
            icon="cog"
            label="System Settings"
            description="Pricing, governance, maintenance"
            onPress={() => navigation.navigate(SystemScreens.Settings)}
            delay={250}
          />
          <Divider />
          <SettingRow
            icon="clipboard-text-clock-outline"
            label="Audit Logs"
            description="View all system activity"
            onPress={() => navigation.navigate(SystemScreens.AuditLogs)}
            delay={260}
          />
        </ElevatedCard>
      </Animated.View>
    </>
  );
};

SuperAdminSection.displayName = 'SuperAdminSection';

const SuperSection: React.FC = () => {
  const theme = useTheme();

  const defaultDistributorCommission = useSettingsStore((s) => s.defaultDistributorCommission);
  const autoApproveTransfers = useSettingsStore((s) => s.autoApproveTransfers);
  const showRetailerBalances = useSettingsStore((s) => s.showRetailerBalancesToDistributors);
  const setDefaultDistributorCommission = useSettingsStore((s) => s.setDefaultDistributorCommission);
  const setAutoApproveTransfers = useSettingsStore((s) => s.setAutoApproveTransfers);
  const setShowRetailerBalances = useSettingsStore((s) => s.setShowRetailerBalancesToDistributors);

  const { data: userSettings } = useUserSettings();
  const { mutate: updateUserSettings } = useUpdateUserSettings();

  const lowBalanceThreshold = userSettings?.lowBalanceThreshold ?? 10;

  return (
    <>
      <SectionHeader label="Business" delay={220} />
      <Animated.View entering={FadeInDown.delay(240).springify()}>
        <ElevatedCard style={styles.card}>
          <StepperRow
            icon="percent"
            label="Default Distributor Commission"
            description="Pre-filled when creating a distributor"
            tint={theme.colors.secondary}
            value={defaultDistributorCommission}
            min={0}
            max={30}
            step={1}
            unit="%"
            onChange={setDefaultDistributorCommission}
            delay={250}
          />
          <Divider />
          <ToggleRow
            icon="transfer"
            label="Auto-approve Transfers"
            description="Skip approval for small key transfers"
            tint={theme.colors.secondary}
            value={autoApproveTransfers}
            onToggle={setAutoApproveTransfers}
            delay={260}
          />
          <Divider />
          <ToggleRow
            icon="eye-settings-outline"
            label="Retailer Balances Visible"
            description="Allow distributors to see retailer key balance"
            tint={theme.colors.secondary}
            value={showRetailerBalances}
            onToggle={setShowRetailerBalances}
            delay={270}
          />
        </ElevatedCard>
      </Animated.View>

      <SectionHeader label="Alerts" delay={290} />
      <Animated.View entering={FadeInDown.delay(310).springify()}>
        <ElevatedCard style={styles.card}>
          <StepperRow
            icon="bell-badge-outline"
            label="Low Balance Alert"
            description="Notify when your key balance drops to or below this"
            tint={theme.colors.error}
            value={lowBalanceThreshold}
            min={1}
            max={9999}
            step={1}
            unit=" keys"
            onChange={(v) => updateUserSettings({ lowBalanceThreshold: v })}
            delay={320}
          />
        </ElevatedCard>
      </Animated.View>
    </>
  );
};

SuperSection.displayName = 'SuperSection';

const DistributorSection: React.FC = () => {
  const theme = useTheme();

  const defaultRetailerCommission = useSettingsStore((s) => s.defaultRetailerCommission);
  const autoConfirm = useSettingsStore((s) => s.autoConfirmIncomingTransfers);
  const setDefaultRetailerCommission = useSettingsStore((s) => s.setDefaultRetailerCommission);
  const setAutoConfirm = useSettingsStore((s) => s.setAutoConfirmIncomingTransfers);

  const { data: userSettings } = useUserSettings();
  const { mutate: updateUserSettings } = useUpdateUserSettings();

  const lowBalanceThreshold = userSettings?.lowBalanceThreshold ?? 10;

  return (
    <>
      <SectionHeader label="Business" delay={220} />
      <Animated.View entering={FadeInDown.delay(240).springify()}>
        <ElevatedCard style={styles.card}>
          <StepperRow
            icon="percent"
            label="Default Retailer Commission"
            description="Pre-filled when creating a retailer"
            tint={theme.colors.secondary}
            value={defaultRetailerCommission}
            min={0}
            max={30}
            step={1}
            unit="%"
            onChange={setDefaultRetailerCommission}
            delay={250}
          />
          <Divider />
          <ToggleRow
            icon="check-decagram-outline"
            label="Auto-confirm Incoming Transfers"
            description="Automatically accept keys sent from your SUPER"
            tint={theme.colors.secondary}
            value={autoConfirm}
            onToggle={setAutoConfirm}
            delay={260}
          />
        </ElevatedCard>
      </Animated.View>

      <SectionHeader label="Alerts" delay={290} />
      <Animated.View entering={FadeInDown.delay(310).springify()}>
        <ElevatedCard style={styles.card}>
          <StepperRow
            icon="bell-badge-outline"
            label="Low Balance Alert"
            description="Notify when your key balance drops to or below this"
            tint={theme.colors.error}
            value={lowBalanceThreshold}
            min={1}
            max={9999}
            step={1}
            unit=" keys"
            onChange={(v) => updateUserSettings({ lowBalanceThreshold: v })}
            delay={320}
          />
        </ElevatedCard>
      </Animated.View>
    </>
  );
};

DistributorSection.displayName = 'DistributorSection';

const RetailerSection: React.FC = () => {
  const theme = useTheme();

  const defaultEmiPeriod = useSettingsStore((s) => s.defaultEmiPeriodMonths);
  const setDefaultEmiPeriod = useSettingsStore((s) => s.setDefaultEmiPeriodMonths);

  const { data: userSettings } = useUserSettings();
  const { mutate: updateUserSettings } = useUpdateUserSettings();

  const autoLockEnabled = userSettings?.autoLockDeviceWhenEmiDue ?? true;
  const lockGracePeriod = userSettings?.lockGracePeriodDays ?? 7;
  const lowBalanceThreshold = userSettings?.lowBalanceThreshold ?? 10;

  return (
    <>
      <SectionHeader label="Client Defaults" delay={220} />
      <Animated.View entering={FadeInDown.delay(240).springify()}>
        <ElevatedCard style={styles.card}>
          <StepperRow
            icon="calendar-month-outline"
            label="Default EMI Period"
            description="Pre-filled when creating a new client"
            tint={theme.colors.secondary}
            value={defaultEmiPeriod}
            min={1}
            max={60}
            step={1}
            unit=" mo"
            onChange={setDefaultEmiPeriod}
            delay={250}
          />
        </ElevatedCard>
      </Animated.View>

      <SectionHeader label="Device Auto-Lock" delay={270} />
      <Animated.View entering={FadeInDown.delay(290).springify()}>
        <ElevatedCard style={styles.card}>
          <ToggleRow
            icon="lock-clock"
            label="Auto-lock on Missed EMI"
            description="Device locks itself when EMI due date (+ grace) is reached"
            tint={theme.colors.secondary}
            value={autoLockEnabled}
            onToggle={(v) => updateUserSettings({ autoLockDeviceWhenEmiDue: v })}
            delay={300}
          />
          {autoLockEnabled && (
            <>
              <Divider />
              <StepperRow
                icon="clock-outline"
                label="Grace Period"
                description="Days after EMI due date before device locks"
                tint={theme.colors.secondary}
                value={lockGracePeriod}
                min={0}
                max={30}
                step={1}
                unit=" d"
                onChange={(v) => updateUserSettings({ lockGracePeriodDays: v })}
                delay={310}
              />
            </>
          )}
        </ElevatedCard>
      </Animated.View>

      <SectionHeader label="Alerts" delay={330} />
      <Animated.View entering={FadeInDown.delay(350).springify()}>
        <ElevatedCard style={styles.card}>
          <StepperRow
            icon="bell-badge-outline"
            label="Low Balance Alert"
            description="Notify when your key balance drops to or below this"
            tint={theme.colors.error}
            value={lowBalanceThreshold}
            min={1}
            max={9999}
            step={1}
            unit=" keys"
            onChange={(v) => updateUserSettings({ lowBalanceThreshold: v })}
            delay={360}
          />
        </ElevatedCard>
      </Animated.View>
    </>
  );
};

RetailerSection.displayName = 'RetailerSection';

// ─── Notifications section (role-aware, backend-synced) ──────────────────────

interface NotificationsSectionProps {
  role: UserRole;
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({ role }) => {
  const theme = useTheme();
  const { data: prefs } = useNotificationPreferences();
  const { mutate: updatePrefs } = useUpdateNotificationPreferences();

  const master = prefs?.master ?? true;

  const toggle = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      updatePrefs({ [key]: value });
    },
    [updatePrefs],
  );

  const on = master ? theme.colors.primary : theme.colors.onSurfaceVariant;
  const onErr = master ? theme.colors.error : theme.colors.onSurfaceVariant;

  return (
    <>
      <SectionHeader label="Notifications" delay={80} />
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <ElevatedCard style={styles.card}>

          <ToggleRow
            icon="bell-outline"
            label="Push Notifications"
            description="Master switch for all alerts"
            value={master}
            onToggle={(v) => toggle('master', v)}
            delay={110}
          />

          {/* Orders — SUPER_ADMIN & SUPER */}
          {(role === UserRole.SUPER_ADMIN || role === UserRole.SUPER) && <Divider />}
          {(role === UserRole.SUPER_ADMIN || role === UserRole.SUPER) && (
            <ToggleRow
              icon="package-variant-closed"
              label="Orders"
              description="Order approvals, rejections, and confirmations"
              value={prefs?.orders ?? true}
              onToggle={(v) => toggle('orders', v)}
              disabled={!master}
              tint={on}
              delay={120}
            />
          )}

          {/* Pending Orders — SUPER_ADMIN only */}
          {role === UserRole.SUPER_ADMIN && <Divider />}
          {role === UserRole.SUPER_ADMIN && (
            <ToggleRow
              icon="clipboard-list-outline"
              label="Pending Orders"
              description="New orders from SUPER users awaiting your approval"
              value={prefs?.pendingOrders ?? true}
              onToggle={(v) => toggle('pendingOrders', v)}
              disabled={!master}
              tint={on}
              delay={130}
            />
          )}

          {/* Key Transfers — SUPER, DISTRIBUTOR, RETAILER */}
          {role !== UserRole.SUPER_ADMIN && <Divider />}
          {role !== UserRole.SUPER_ADMIN && (
            <ToggleRow
              icon="key-chain"
              label="Key Transfers"
              description="Incoming transfers, completions, and rejections"
              value={prefs?.keyTransfers ?? true}
              onToggle={(v) => toggle('keyTransfers', v)}
              disabled={!master}
              tint={on}
              delay={140}
            />
          )}

          {/* Transfer Requests — SUPER & DISTRIBUTOR */}
          {(role === UserRole.SUPER || role === UserRole.DISTRIBUTOR) && <Divider />}
          {(role === UserRole.SUPER || role === UserRole.DISTRIBUTOR) && (
            <ToggleRow
              icon="key-arrow-right"
              label="Transfer Requests"
              description="Downstream users requesting keys from you"
              value={prefs?.transferRequests ?? true}
              onToggle={(v) => toggle('transferRequests', v)}
              disabled={!master}
              tint={on}
              delay={150}
            />
          )}

          {/* System Alerts — all roles */}
          <Divider />
          <ToggleRow
            icon="lightning-bolt-outline"
            label="System Alerts"
            description="Maintenance windows, health events, critical alerts"
            value={prefs?.systemAlerts ?? true}
            onToggle={(v) => toggle('systemAlerts', v)}
            disabled={!master}
            tint={onErr}
            delay={160}
          />

          {/* RETAILER-specific */}
          {role === UserRole.RETAILER && <Divider />}
          {role === UserRole.RETAILER && (
            <ToggleRow
              icon="account-clock-outline"
              label="Client Activity"
              description="Remote command acknowledgements from client devices"
              value={prefs?.clientActivity ?? true}
              onToggle={(v) => toggle('clientActivity', v)}
              disabled={!master}
              tint={on}
              delay={170}
            />
          )}
          {role === UserRole.RETAILER && <Divider />}
          {role === UserRole.RETAILER && (
            <ToggleRow
              icon="cellphone-off"
              label="Device Alerts"
              description="Sync warnings (24h, 48h) and gone alerts (72h)"
              value={prefs?.deviceAlerts ?? true}
              onToggle={(v) => toggle('deviceAlerts', v)}
              disabled={!master}
              tint={onErr}
              delay={180}
            />
          )}
          {role === UserRole.RETAILER && <Divider />}
          {role === UserRole.RETAILER && (
            <ToggleRow
              icon="calendar-clock"
              label="EMI Reminders"
              description="EMI due and overdue alerts for your clients"
              value={prefs?.emiReminders ?? true}
              onToggle={(v) => toggle('emiReminders', v)}
              disabled={!master}
              tint={on}
              delay={190}
            />
          )}

          {/* Low Balance — RETAILER & DISTRIBUTOR */}
          {(role === UserRole.RETAILER || role === UserRole.DISTRIBUTOR) && <Divider />}
          {(role === UserRole.RETAILER || role === UserRole.DISTRIBUTOR) && (
            <ToggleRow
              icon="bell-badge-outline"
              label="Low Balance Alert"
              description="Notify when key balance drops below your threshold"
              value={prefs?.lowBalanceAlert ?? true}
              onToggle={(v) => toggle('lowBalanceAlert', v)}
              disabled={!master}
              tint={onErr}
              delay={200}
            />
          )}

        </ElevatedCard>
      </Animated.View>
    </>
  );
};

NotificationsSection.displayName = 'NotificationsSection';

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const user = useAuthStore(selectUser);

  if (!user) return null;

  const role = user.role;

  return (
    <SafeScreen edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── APPEARANCE ── */}
        <SectionHeader label="Appearance" delay={0} />
        <Animated.View entering={FadeInDown.delay(20).springify()}>
          <ElevatedCard style={styles.card}>
            <DarkModePicker delay={30} />
            <Divider />
            <FontSizePicker delay={70} />
          </ElevatedCard>
        </Animated.View>

        {/* ── NOTIFICATIONS ── */}
        <NotificationsSection role={role} />

        {/* ── ROLE-SPECIFIC SECTIONS ── */}
        {role === UserRole.SUPER_ADMIN && <SuperAdminSection />}
        {role === UserRole.SUPER && <SuperSection />}
        {role === UserRole.DISTRIBUTOR && <DistributorSection />}
        {role === UserRole.RETAILER && <RetailerSection />}

        {/* ── APP INFO ── */}
        <SectionHeader label="App" delay={340} />
        <Animated.View entering={FadeInDown.delay(360).springify()}>
          <ElevatedCard style={styles.card}>
            <SettingRow
              icon="information-outline"
              label="Version"
              description={`v${APP_VERSION} (build ${BUILD_NUMBER})`}
              delay={370}
              trailing={
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {`v${APP_VERSION}`}
                </Text>
              }
            />
            <Divider />
            <SettingRow
              icon="file-document-outline"
              label="Terms of Service"
              onPress={() => { /* TODO: open WebView or external link */ }}
              delay={380}
            />
            <Divider />
            <SettingRow
              icon="shield-account-outline"
              label="Privacy Policy"
              onPress={() => { /* TODO: open WebView or external link */ }}
              delay={390}
            />
          </ElevatedCard>
        </Animated.View>

      </ScrollView>
    </SafeScreen>
  );
};

SettingsScreen.displayName = 'SettingsScreen';

export default SettingsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 6,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  rowTrailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Font size segmented control
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    minWidth: 42,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
