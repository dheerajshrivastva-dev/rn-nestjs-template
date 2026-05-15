/**
 * Status Management Card Component
 * Allows ADMIN/SUPER_ADMIN to manage user status
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {
  FilledCard,
  TitleMedium,
  BodyMedium,
  BodySmall,
  FilledButton,
  OutlinedButton,
  Row,
  Spacer,
  Divider,
  useTheme,
} from '@bevarc/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {User, UserRole, UserStatus} from '../../../api/types';
import {getStatusColor} from './helpers';

interface StatusManagementProps {
  user: User;
  viewerRole: UserRole;
  isSelfView: boolean;
  onActivate: () => void;
  onChangeStatus: (status: UserStatus) => void;
}

export const StatusManagementCard = React.memo(
  ({user, viewerRole, isSelfView, onActivate, onChangeStatus}: StatusManagementProps) => {
    const theme = useTheme();

    // Show only for ADMIN/SUPER_ADMIN and not self-view
    const canManageStatus =
      !isSelfView &&
      (viewerRole === UserRole.SUPER || viewerRole === UserRole.SUPER_ADMIN);

    if (!canManageStatus) return null;

    const isInactive = user.status === UserStatus.INACTIVE;

    return (
      <>
        <TitleMedium style={styles.sectionTitle}>Status Management</TitleMedium>

        <FilledCard style={styles.infoCard}>
          <Row style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon
                name="account-check"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <BodyMedium color={theme.colors.onSurfaceVariant}>
                Current Status
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

          {isInactive && (
            <>
              <Spacer size="md" />
              <FilledButton
                onPress={onActivate}
                style={styles.actionButtonFull}>
                Activate User
              </FilledButton>
            </>
          )}

          {!isInactive && (
            <>
              <Divider />
              <BodySmall
                color={theme.colors.onSurfaceVariant}
                style={{marginTop: 12, marginBottom: 8}}>
                Change user status:
              </BodySmall>
              <Row style={{gap: 8}}>
                {user.status !== UserStatus.INACTIVE && (
                  <FilledButton
                    onPress={() => onChangeStatus(UserStatus.ACTIVE)}
                    style={{flex: 1}}>
                    Activate
                  </FilledButton>
                )}
                {user.status !== UserStatus.SUSPENDED && (
                  <OutlinedButton
                    onPress={() => onChangeStatus(UserStatus.SUSPENDED)}
                    style={{flex: 1, borderColor: theme.colors.error}}>
                    Suspend
                  </OutlinedButton>
                )}
              </Row>
            </>
          )}
        </FilledCard>
      </>
    );
  },
);

StatusManagementCard.displayName = 'StatusManagementCard';

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
  actionButtonFull: {
    width: '100%',
  },
});
