/**
 * Profile Header Component
 * Displays user avatar, name, role, and status
 */

import React from 'react';
import {View, StyleSheet, Pressable, Image} from 'react-native';
import {
  ElevatedCard,
  TitleLarge,
  BodyMedium,
  BodySmall,
  Row,
  Spacer,
  useTheme,
} from '@bevarc/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {UserRole} from '../../../api/types';
import {getRoleIcon, getStatusColor} from './helpers';
import { getRoleDisplayName } from '../../../navigation/configs';

interface ProfileHeaderProps {
  user: any;
  isSelfView: boolean;
  viewerRole: UserRole;
  onEdit?: () => void;
  onAssignCompany?: () => void;
}

export const ProfileHeader = React.memo(
  ({user, isSelfView, onEdit}: ProfileHeaderProps) => {
    const theme = useTheme();

    return (
      <ElevatedCard>
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user.profilePicture?.url ? (
              <Image
                source={{uri: user.profilePicture?.url}}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  {backgroundColor: theme.colors.primaryContainer},
                ]}>
                <Icon
                  name={getRoleIcon(user.role)}
                  size={48}
                  color={theme.colors.onPrimaryContainer}
                />
              </View>
            )}

            {/* Role Badge - Overlaid on avatar */}
            <View
              style={[
                styles.roleBadge,
                {backgroundColor: theme.colors.tertiaryContainer},
              ]}>
              <Icon
                name={getRoleIcon(user.role)}
                size={16}
                color={theme.colors.onTertiaryContainer}
              />
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <TitleLarge>{user.name}</TitleLarge>
            <BodyMedium color={theme.colors.onSurfaceVariant}>
              {getRoleDisplayName(user.role)}
            </BodyMedium>

            <Spacer size="sm" />

            {/* Status and Assign Company Row */}
            <Row style={{gap: 8}}>
              {/* Status Badge */}
              <View
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: `${getStatusColor(user.status, theme)}20`,
                  },
                ]}>
                <View
                  style={[
                    styles.statusDot,
                    {backgroundColor: getStatusColor(user.status, theme)},
                  ]}
                />
                <BodySmall
                  style={{color: getStatusColor(user.status, theme)}}>
                  {user.status}
                </BodySmall>
              </View>
            </Row>
          </View>

          {/* Edit Button - Top Right */}
          {isSelfView && onEdit && (
            <Pressable onPress={onEdit} style={styles.editButton}>
              <Icon
                name="pencil"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
          )}
        </View>
      </ElevatedCard>
    );
  },
);

ProfileHeader.displayName = 'ProfileHeader';

const styles = StyleSheet.create({
  profileHeader: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  profileInfo: {
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  assignCompanyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
