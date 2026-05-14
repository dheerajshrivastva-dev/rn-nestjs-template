/**
 * CompanyListItem Component
 * Displays a company in a list with menu actions
 * Based on SUPER_ADMIN_FLOWS.md specifications
 */

import React from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Menu, IconButton, Divider as PaperDivider} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  TitleMedium,
  BodySmall,
  LabelSmall,
  StatusChip,
  Divider,
  useTheme,
  ConfirmDialog,
} from '@forge/ui';
import {CompanyScreens, UserScreens} from '../navigation/screens';
import type {MainDrawerNavigationProp} from '../navigation/MainNavigator';

interface CompanyListItemProps {
  companyId: string;
  name: string;
  logo?: string;
  agentCount: number;
  clientCount: number;
  status: 'active' | 'inactive';
  lastActivity: string;
  onPress: () => void;
}

export const CompanyListItem: React.FC<CompanyListItemProps> = ({
  companyId,
  name,
  agentCount,
  clientCount,
  status,
  lastActivity,
  onPress,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<MainDrawerNavigationProp>();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState({x: 0, y: 0});
  const [toggleDialog, setToggleDialog] = React.useState(false);

  const closeMenu = React.useCallback(() => {
    setMenuVisible(false);
  }, []);

  const handleViewDetails = React.useCallback(() => {
    closeMenu();
    navigation.navigate(CompanyScreens.Detail, {companyId});
  }, [closeMenu, navigation, companyId]);

  const handleEditCompany = React.useCallback(() => {
    closeMenu();
    navigation.navigate(CompanyScreens.Edit, {companyId});
  }, [closeMenu, navigation, companyId]);

  const handleViewAdmins = React.useCallback(() => {
    closeMenu();
    // Navigate to nested UserStackNavigator
    navigation.navigate('UsersStack', {
      screen: UserScreens.List,
      params: {companyId},
    });
  }, [closeMenu, navigation, companyId]);

  const handleAddAdmin = React.useCallback(() => {
    closeMenu();
    navigation.navigate(UserScreens.AddToCompany, {companyId, companyName: name});
  }, [closeMenu, navigation, companyId, name]);

  const handleToggleStatus = React.useCallback(() => {
    closeMenu();
    setToggleDialog(true);
  }, [closeMenu]);

  const handleViewReports = React.useCallback(() => {
    closeMenu();
    // TODO: Navigate to company-specific reports when implemented
    console.log(`View reports for company: ${companyId}`);
  }, [closeMenu, companyId]);

  const handleMenuPress = React.useCallback((event: any) => {
    event.stopPropagation();
    const {pageX, pageY} = event.nativeEvent;
    setMenuAnchor({x: pageX, y: pageY});
    setMenuVisible(true);
  }, []);

  return (
    <>
      <Pressable onPress={onPress}>
        <View style={styles.companyItem}>
          <View style={styles.companyLeading}>
            <View
              style={[
                styles.companyIcon,
                {backgroundColor: theme.colors.primaryContainer},
              ]}>
              <Icon name="office-building" size={24} color={theme.colors.primary} />
            </View>
          </View>
          <View style={styles.companyContent}>
            <TitleMedium>{name}</TitleMedium>
            <BodySmall color={theme.colors.onSurfaceVariant}>
              {agentCount} agents · {clientCount} clients
            </BodySmall>
            <View style={styles.companyStatusRow}>
              <StatusChip
                status={status === 'active' ? 'success' : 'default'}
                label={status === 'active' ? 'Active' : 'Inactive'}
              />
              <LabelSmall
                color={theme.colors.onSurfaceVariant}
                style={styles.lastActivity}>
                · Last update {lastActivity}
              </LabelSmall>
            </View>
          </View>
          {/* <IconButton
            icon="dots-vertical"
            size={24}
            onPress={handleMenuPress}
            iconColor={theme.colors.onSurfaceVariant}
          /> */}
        </View>
        <Divider />
      </Pressable>

      <Menu
        visible={menuVisible}
        onDismiss={closeMenu}
        anchor={menuAnchor}
        contentStyle={{
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          elevation: 3,
        }}>
        <Menu.Item
          onPress={handleViewDetails}
          title="View Details"
          leadingIcon="eye"
          titleStyle={{color: theme.colors.onSurface}}
        />
        <Menu.Item
          onPress={handleEditCompany}
          title="Edit Company"
          leadingIcon="pencil"
          titleStyle={{color: theme.colors.onSurface}}
        />
        <Menu.Item
          onPress={handleViewAdmins}
          title="View Admins"
          leadingIcon="account-group"
          titleStyle={{color: theme.colors.onSurface}}
        />
        <Menu.Item
          onPress={handleAddAdmin}
          title="Add Admin"
          leadingIcon="account-plus"
          titleStyle={{color: theme.colors.onSurface}}
        />
        <PaperDivider />
        <Menu.Item
          onPress={handleToggleStatus}
          title={status === 'active' ? 'Deactivate' : 'Activate'}
          leadingIcon={status === 'active' ? 'close-circle' : 'check-circle'}
          titleStyle={{
            color: status === 'active' ? theme.colors.error : theme.semanticColors.success.main,
          }}
        />
        <Menu.Item
          onPress={handleViewReports}
          title="View Reports"
          leadingIcon="chart-box"
          titleStyle={{color: theme.colors.onSurface}}
        />
      </Menu>

      <ConfirmDialog
        visible={toggleDialog}
        title={status === 'active' ? 'Deactivate Company' : 'Activate Company'}
        message={`Are you sure you want to ${status === 'active' ? 'deactivate' : 'activate'} ${name}?`}
        confirmText={status === 'active' ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        onConfirm={() => {
          setToggleDialog(false);
          console.log(`Toggle status for company: ${companyId}`);
        }}
        onCancel={() => setToggleDialog(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  companyLeading: {
    marginRight: 12,
  },
  companyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyContent: {
    flex: 1,
    gap: 4,
  },
  companyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lastActivity: {
    marginLeft: 4,
  },
});
