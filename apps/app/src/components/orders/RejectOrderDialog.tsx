/**
 * Reject Order Bottom Sheet Component
 * Bottom sheet for rejecting an order with predefined reasons
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BottomSheet,
  TextField,
  Dropdown,
  Spacer,
  TitleLarge,
  BodyMedium,
  FilledButton,
  OutlinedButton,
  Row,
  useTheme,
} from '@forge/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCurrency } from '../../utils/formatters';
import type { Order } from '../../api/types';

// Common rejection reasons
const REJECTION_REASONS = [
  { label: 'Select a reason...', value: '' },
  { label: 'Payment not received', value: 'payment_not_received' },
  { label: 'Insufficient documentation', value: 'insufficient_documentation' },
  { label: 'Invalid order details', value: 'invalid_order_details' },
  { label: 'Company verification failed', value: 'company_verification_failed' },
  { label: 'Exceeds credit limit', value: 'exceeds_credit_limit' },
  { label: 'Duplicate order', value: 'duplicate_order' },
  { label: 'Compliance issue', value: 'compliance_issue' },
  { label: 'Other (specify in notes)', value: 'other' },
];

interface RejectOrderDialogProps {
  visible: boolean;
  order: Order | null;
  reason: string;
  notes: string;
  isLoading: boolean;
  onReasonChange: (reason: string) => void;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RejectOrderDialog: React.FC<RejectOrderDialogProps> = ({
  visible,
  order,
  reason,
  notes,
  isLoading,
  onReasonChange,
  onNotesChange,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();

  // Require notes when "other" is selected
  const isFormValid = reason && (reason !== 'other' || (reason === 'other' && notes.trim().length > 0));

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
            disabled={!isFormValid || isLoading}
            loading={isLoading}
            style={styles.actionButton}
            icon="close"
            buttonColor={theme.colors.error}
          >
            Reject Order
          </FilledButton>
        </View>
      }
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="close-circle" size={32} color={theme.colors.error} />
          </View>
          <TitleLarge>Reject Order</TitleLarge>
          {order && (
            <BodyMedium color={theme.colors.onSurfaceVariant}>
              Order #{order.orderId} • {order.totalKeys} keys • {formatCurrency(order.totalAmount)}
            </BodyMedium>
          )}
        </View>

        <Spacer size="lg" />

        {/* Form */}
        <View style={styles.form}>
          <Dropdown
            label="Rejection Reason *"
            value={reason}
            onValueChange={onReasonChange}
            options={REJECTION_REASONS}
            placeholder="Select a reason"
            searchable={false}
          />

          <Spacer size="md" />

          <TextField
            label={reason === 'other' ? 'Additional Notes *' : 'Additional Notes (Optional)'}
            placeholder={reason === 'other' ? 'Please specify the reason...' : 'Any additional information...'}
            value={notes}
            onChangeText={onNotesChange}
            variant="outlined"
            multiline
            numberOfLines={4}
            required={reason === 'other'}
          />

          <Spacer size="sm" />

          {/* Warning */}
          <View
            style={[
              styles.warningBox,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Row gap={8}>
              <Icon
                name="alert"
                size={20}
                color={theme.colors.onErrorContainer}
              />
              <View style={{ flex: 1 }}>
                <BodyMedium color={theme.colors.onErrorContainer}>
                  This order will be rejected and the SUPER user will be notified.
                </BodyMedium>
              </View>
            </Row>
          </View>
        </View>

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
  warningBox: {
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
