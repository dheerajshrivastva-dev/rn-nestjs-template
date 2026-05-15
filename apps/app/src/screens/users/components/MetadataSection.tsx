/**
 * Metadata Section Component
 * Displays who created and last modified the user
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {
  FilledCard,
  TitleMedium,
  BodyMedium,
  LabelSmall,
  Row,
  Divider,
  useTheme,
} from '@bevarc/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {formatDateTime} from './helpers';
import { getRoleDisplayName } from '../../../navigation/configs';

interface MetadataSectionProps {
  user: any;
}

export const MetadataSection = React.memo(({user}: MetadataSectionProps) => {
  const theme = useTheme();

  if (!user.createdByAgent && !user.lastModifiedByAgent) {
    return null;
  }

  return (
    <>
      <TitleMedium style={styles.sectionTitle}>Management Info</TitleMedium>

      <FilledCard style={styles.infoCard}>
        {/* Created By */}
        {user.createdByAgent && (
          <>
            <Row style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Icon
                  name="account-plus"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <BodyMedium color={theme.colors.onSurfaceVariant}>
                  Created By
                </BodyMedium>
              </View>
              <View style={styles.infoValueContainer}>
                <BodyMedium style={styles.infoValue}>
                  {user.createdByAgent.name}
                </BodyMedium>
              </View>
            </Row>
            <View style={styles.metadataSubRow}>
              <LabelSmall color={theme.colors.onSurfaceVariant}>
                {user.createdByAgent.email} ·{' '}
                {getRoleDisplayName(user.createdByAgent.role)}
              </LabelSmall>
            </View>
          </>
        )}

        {/* Last Modified By */}
        {user.lastModifiedByAgent && (
          <>
            <Divider />
            <Row style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Icon
                  name="account-edit"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <BodyMedium color={theme.colors.onSurfaceVariant}>
                  Last Modified By
                </BodyMedium>
              </View>
              <View style={styles.infoValueContainer}>
                <BodyMedium style={styles.infoValue}>
                  {user.lastModifiedByAgent.name}
                </BodyMedium>
              </View>
            </Row>
            <View style={styles.metadataSubRow}>
              <LabelSmall color={theme.colors.onSurfaceVariant}>
                {formatDateTime(user.updatedAt)}
              </LabelSmall>
            </View>
          </>
        )}
      </FilledCard>
    </>
  );
});

MetadataSection.displayName = 'MetadataSection';

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
  metadataSubRow: {
    paddingLeft: 32,
    paddingBottom: 8,
  },
});
