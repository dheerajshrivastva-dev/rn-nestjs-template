/**
 * Approve Order Bottom Sheet Component
 * Bottom sheet for confirming order approval with payment verification
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
  BottomSheet,
  TextField,
  BodyMedium,
  TitleLarge,
  Spacer,
  Row,
  FilledButton,
  OutlinedButton,
  useTheme,
} from '@forge/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCurrency } from '../../utils/formatters';
import type { Order } from '../../api/types';

interface ApproveOrderDialogProps {
  visible: boolean;
  order: Order | null;
  paymentConfirmed: boolean;
  notes: string;
  isLoading: boolean;
  onPaymentConfirmedChange: (confirmed: boolean) => void;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ApproveOrderDialog: React.FC<ApproveOrderDialogProps> = ({
  visible,
  order,
  paymentConfirmed,
  notes,
  isLoading,
  onPaymentConfirmedChange,
  onNotesChange,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onDismiss={onCancel}
      dismissable={!isLoading}
      enablePanDownToClose={!isLoading}
      scrollable
      footer={
        <View style={styles.actions}>
          <OutlinedButton
            onPress={onCancel}
            disabled={isLoading}
            style={styles.actionButton}
          >
            Cancel
          </OutlinedButton>
          <FilledButton
            onPress={onConfirm}
            disabled={!paymentConfirmed || isLoading}
            loading={isLoading}
            style={styles.actionButton}
            icon="check"
          >
            Approve Order
          </FilledButton>
        </View>
      }
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="check-circle" size={32} color={theme.colors.primary} />
          </View>
          <TitleLarge>Approve Order</TitleLarge>
          {order && (
            <BodyMedium color={theme.colors.onSurfaceVariant}>
              Order #{order.orderId} • {order.totalKeys} keys • {formatCurrency(order.totalAmount)}
            </BodyMedium>
          )}
        </View>

        <Spacer size="lg" />

        {/* Form */}
        <View style={styles.form}>
          {/* Payment Confirmation Checkbox */}
          <Pressable
            onPress={() => onPaymentConfirmedChange(!paymentConfirmed)}
            style={[
              styles.checkboxCard,
              {
                backgroundColor: paymentConfirmed
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
                borderColor: paymentConfirmed
                  ? theme.colors.primary
                  : 'transparent',
              },
            ]}
          >
            <Row gap={12} style={styles.checkboxContent}>
              <Icon
                name={paymentConfirmed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={28}
                color={
                  paymentConfirmed
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
              <View style={{ flex: 1 }}>
                <BodyMedium
                  style={{ fontWeight: '600' }}
                  color={
                    paymentConfirmed
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant
                  }
                >
                  Payment Confirmed *
                </BodyMedium>
                <BodyMedium
                  color={
                    paymentConfirmed
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant
                  }
                >
                  I confirm that payment has been received
                </BodyMedium>
              </View>
            </Row>
          </Pressable>

          <Spacer size="md" />

          <TextField
            label="Notes (Optional)"
            placeholder="Add any notes about this approval..."
            value={notes}
            onChangeText={onNotesChange}
            variant="outlined"
            multiline
            numberOfLines={4}
          />

          <Spacer size="sm" />

          {/* Info Box */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <Row gap={8}>
              <Icon
                name="information"
                size={20}
                color={theme.colors.onSecondaryContainer}
              />
              <View style={{ flex: 1 }}>
                <BodyMedium color={theme.colors.onSecondaryContainer}>
                  This will credit {order?.totalKeys || 0} keys to the SUPER user's balance.
                </BodyMedium>
              </View>
            </Row>
          </View>
        </View>

        <Spacer size="lg" />

        {/* Actions */}
        
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    marginBottom: 8,
  },
  form: {
    flex: 1,
  },
  checkboxCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  checkboxContent: {
    alignItems: 'center',
  },
  infoBox: {
    padding: 12,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
