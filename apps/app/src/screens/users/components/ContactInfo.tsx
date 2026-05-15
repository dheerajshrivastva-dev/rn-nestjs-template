/**
 * Contact Information Component
 * Displays user email, phone, and 2FA status
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {
  FilledCard,
  TitleMedium,
  BodyMedium,
  Row,
  useTheme,
} from '@bevarc/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ContactInfoProps {
  user: any;
}

export const ContactInfo = React.memo(({user}: ContactInfoProps) => {
  const theme = useTheme();

  return (
    <>
      <TitleMedium style={styles.sectionTitle}>Contact Information</TitleMedium>

      <FilledCard style={styles.infoCard}>
        {/* Email */}
        <Row style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Icon
              name="email"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <BodyMedium color={theme.colors.onSurfaceVariant}>
              Email
            </BodyMedium>
          </View>
          <View style={styles.infoValueContainer}>
            <BodyMedium style={styles.infoValue}>{user.email}</BodyMedium>
            {user.emailVerified && (
              <Icon
                name="check-circle"
                size={16}
                color={theme.semanticColors.success.main}
              />
            )}
          </View>
        </Row>


        {/* Phone */}
        <Row style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Icon
              name="phone"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <BodyMedium color={theme.colors.onSurfaceVariant}>
              Phone
            </BodyMedium>
          </View>
          <View style={styles.infoValueContainer}>
            <BodyMedium style={styles.infoValue}>{user.phone}</BodyMedium>
            {user.phoneVerified && (
              <Icon
                name="check-circle"
                size={16}
                color={theme.semanticColors.success.main}
              />
            )}
          </View>
        </Row>


        {/* 2FA Status */}
        <Row style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Icon
              name="shield-lock"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <BodyMedium color={theme.colors.onSurfaceVariant}>
              2FA Security
            </BodyMedium>
          </View>
          <View style={styles.infoValueContainer}>
            <BodyMedium
              style={[
                styles.infoValue,
                {
                  color: user.twoFactorEnabled
                    ? theme.semanticColors.success.main
                    : theme.semanticColors.warning.main,
                },
              ]}>
              {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </BodyMedium>
          </View>
        </Row>
      </FilledCard>
    </>
  );
});

ContactInfo.displayName = 'ContactInfo';

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 12,
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoValue: {
    textAlign: 'right',
  },
});
