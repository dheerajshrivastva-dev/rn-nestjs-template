/**
 * Assign Company Dialog Component
 * Modal dialog for assigning a company to an user
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {
  TitleMedium,
  BodyMedium,
  FilledButton,
  OutlinedButton,
  Row,
  Spacer,
  Dropdown,
  type DropdownOption,
  useTheme,
} from '@bevarc/ui';

interface AssignCompanyDialogProps {
  visible: boolean;
  companyOptions: DropdownOption[];
  selectedCompanyId: string | undefined;
  isAssigning: boolean;
  onSelectCompany: (companyId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AssignCompanyDialog = React.memo(
  ({
    visible,
    companyOptions,
    selectedCompanyId,
    isAssigning,
    onSelectCompany,
    onConfirm,
    onCancel,
  }: AssignCompanyDialogProps) => {
    const theme = useTheme();

    if (!visible) return null;

    return (
      <View style={styles.assignDialog}>
        <View
          style={[styles.assignDialogContainer, {backgroundColor: theme.colors.surface}]}>
          <TitleMedium style={{marginBottom: 16}}>
            Assign Company
          </TitleMedium>
          <BodyMedium
            color={theme.colors.onSurfaceVariant}
            style={{marginBottom: 24}}>
            Select a company to assign to this user. Once assigned, the
            user cannot be transferred to another company.
          </BodyMedium>

          <Dropdown
            label="Select Company"
            options={companyOptions}
            value={selectedCompanyId}
            onValueChange={onSelectCompany}
            placeholder="Choose a company..."
          />

          <Spacer size="lg" />

          <Row style={{gap: 12, justifyContent: 'flex-end'}}>
            <OutlinedButton
              onPress={onCancel}
              disabled={isAssigning}>
              Cancel
            </OutlinedButton>
            <FilledButton
              onPress={onConfirm}
              loading={isAssigning}
              disabled={!selectedCompanyId || isAssigning}>
              Assign
            </FilledButton>
          </Row>
        </View>
      </View>
    );
  },
);

AssignCompanyDialog.displayName = 'AssignCompanyDialog';

const styles = StyleSheet.create({
  assignDialog: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  assignDialogContainer: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
});
