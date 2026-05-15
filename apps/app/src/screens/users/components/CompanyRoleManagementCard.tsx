/**
 * Company & Role Management Card Component
 * Allows SUPER_ADMIN to manage company assignment and user role
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
import {User, UserRole} from '../../../api/types';
import { getRoleDisplayName } from '../../../navigation/configs';

interface CompanyRoleManagementProps {
  user: User;
  viewerRole: UserRole;
  isSelfView: boolean;
  onAssignCompany: () => void;
  onChangeRole: (role: UserRole) => void;
}

export const CompanyRoleManagementCard = React.memo(
  ({user, viewerRole, isSelfView, onAssignCompany, onChangeRole}: CompanyRoleManagementProps) => {
    const theme = useTheme();

    // Show only for SUPER_ADMIN and not self-view
    if (viewerRole !== UserRole.SUPER_ADMIN || isSelfView) return null;

    const hasCompany = !!user.companyId;

    return (
      <>
        <TitleMedium style={styles.sectionTitle}>
          Company & Role Management
        </TitleMedium>

        <FilledCard style={styles.infoCard}>
          {/* Company Assignment */}
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
              {hasCompany ? (
                <BodyMedium style={styles.infoValue}>
                  Assigned
                </BodyMedium>
              ) : (
                <BodyMedium
                  style={[styles.infoValue, {color: theme.colors.error}]}>
                  Not Assigned
                </BodyMedium>
              )}
            </View>
          </Row>

          {!hasCompany && (
            <>
              <Spacer size="md" />
              <FilledButton
                onPress={onAssignCompany}
                style={styles.actionButtonFull}>
                Assign Company
              </FilledButton>
              <BodySmall
                color={theme.colors.onSurfaceVariant}
                style={{marginTop: 8}}>
                Once assigned, the user cannot be transferred to another
                company.
              </BodySmall>
            </>
          )}

          <Divider style={{marginVertical: 16}} />

          {/* Role Management */}
          <Row style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon
                name="shield-account"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <BodyMedium color={theme.colors.onSurfaceVariant}>
                Current Role
              </BodyMedium>
            </View>
            <View style={styles.infoValueContainer}>
              <BodyMedium style={styles.infoValue}>
                {getRoleDisplayName(user.role)}
              </BodyMedium>
            </View>
          </Row>

          <BodySmall
            color={theme.colors.onSurfaceVariant}
            style={{marginTop: 12, marginBottom: 8}}>
            Change user role:
          </BodySmall>
          <Row style={{gap: 8}}>
            {user.role !== UserRole.SUPER && (
              <OutlinedButton
                onPress={() => onChangeRole(UserRole.SUPER)}
                style={{flex: 1}}>
                Make Admin
              </OutlinedButton>
            )}
            {user.role !== UserRole.RETAILER && (
              <OutlinedButton
                onPress={() => onChangeRole(UserRole.RETAILER)}
                style={{flex: 1}}>
                Make User
              </OutlinedButton>
            )}
          </Row>
        </FilledCard>
      </>
    );
  },
);

CompanyRoleManagementCard.displayName = 'CompanyRoleManagementCard';

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
