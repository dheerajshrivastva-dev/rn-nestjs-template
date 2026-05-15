/**
 * Account Details Component
 * Displays user role, status, company, and account metadata
 */

import React from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {
  FilledCard,
  TitleMedium,
  BodyMedium,
  BodySmall,
  Row,
  Divider,
  useTheme,
} from '@bevarc/ui';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {UserRole} from '../../../api/types';
import {UsersStackNavigationProp} from '../../../navigation/types';
import {getStatusColor, formatDate, formatDateTime} from './helpers';
import { getRoleDisplayName } from '../../../navigation/configs';

interface AccountDetailsProps {
  user: any;
  viewerRole: UserRole;
  currentUserId: string;
}

export const AccountDetails = React.memo(
  ({user, viewerRole}: AccountDetailsProps) => {
    const theme = useTheme();
    const navigation = useNavigation<UsersStackNavigationProp>();

    const canViewCompany =
      viewerRole === UserRole.SUPER_ADMIN ||
      (viewerRole === UserRole.SUPER && user.role === UserRole.RETAILER);

    const handleViewCompany = React.useCallback(() => {
      // Company detail navigation not yet implemented
    }, []);

    return (
      <>
        <TitleMedium style={styles.sectionTitle}>Account Details</TitleMedium>

        <FilledCard style={styles.infoCard}>
          {/* Role & Permissions */}
          <Row style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon
                name="shield-account"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <BodyMedium color={theme.colors.onSurfaceVariant}>
                Role
              </BodyMedium>
            </View>
            <View style={styles.infoValueContainer}>
              <BodyMedium style={styles.infoValue}>
                {getRoleDisplayName(user.role)}
              </BodyMedium>
            </View>
          </Row>


          {/* Status */}
          <Row style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon
                name="account-check"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <BodyMedium color={theme.colors.onSurfaceVariant}>
                Status
              </BodyMedium>
            </View>
            <View style={styles.infoValueContainer}>
              <BodyMedium
                style={[
                  styles.infoValue,
                  {color: getStatusColor(user.status, theme)},
                ]}>
                {user.status}
              </BodyMedium>
            </View>
          </Row>

          {/* Company Affiliation (if not SUPER_ADMIN) */}
          {user.company && canViewCompany && (
            <>
              <Divider />
              <Pressable onPress={handleViewCompany}>
                <Row style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <Icon
                      name="office-building"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <BodyMedium color={theme.colors.onSurfaceVariant}>
                      Company
                    </BodyMedium>
                  </View>
                  <View style={styles.infoValueContainer}>
                    <BodyMedium
                      style={[styles.infoValue, {color: theme.colors.primary}]}>
                      {user.company.name}
                    </BodyMedium>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                </Row>
              </Pressable>
            </>
          )}

          {user.role === UserRole.SUPER_ADMIN && (
            <>
              <Divider />
              <Row style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Icon
                    name="office-building"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <BodyMedium color={theme.colors.onSurfaceVariant}>
                    Company
                  </BodyMedium>
                </View>
                <View style={styles.infoValueContainer}>
                  <BodyMedium
                    style={[
                      styles.infoValue,
                      {color: theme.colors.onSurfaceVariant},
                    ]}>
                    System-wide Access
                  </BodyMedium>
                </View>
              </Row>
            </>
          )}


          {/* Member Since */}
          <Row style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon
                name="calendar"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <BodyMedium color={theme.colors.onSurfaceVariant}>
                Member Since
              </BodyMedium>
            </View>
            <View style={styles.infoValueContainer}>
              <BodyMedium style={styles.infoValue}>
                {formatDate(user.createdAt)}
              </BodyMedium>
            </View>
          </Row>


          {/* Last Login */}
          <Row style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon
                name="login"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <BodyMedium color={theme.colors.onSurfaceVariant}>
                Last Login
              </BodyMedium>
            </View>
            <View style={styles.infoValueContainer}>
              <BodyMedium style={styles.infoValue}>
                {formatDateTime(user.lastLoginAt)}
              </BodyMedium>
            </View>
          </Row>

          {/* Last Login IP (if viewer is SUPER_ADMIN or ADMIN viewing their user) */}
          {(viewerRole === UserRole.SUPER_ADMIN ||
            (viewerRole === UserRole.SUPER &&
              user.role === UserRole.RETAILER)) &&
            user.lastLoginIp && (
              <>
                <Divider />
                <Row style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <Icon
                      name="ip"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <BodyMedium color={theme.colors.onSurfaceVariant}>
                      Last IP
                    </BodyMedium>
                  </View>
                  <View style={styles.infoValueContainer}>
                    <BodySmall
                      style={[
                        styles.infoValue,
                        styles.monospaceText, // Use monospace for IP, BodySmall is already 12sp
                      ]}>
                      {user.lastLoginIp}
                    </BodySmall>
                  </View>
                </Row>
              </>
            )}
        </FilledCard>
      </>
    );
  },
);

AccountDetails.displayName = 'AccountDetails';

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
    paddingVertical: 12,
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
  monospaceText: {
    fontFamily: 'monospace',
  },
});
