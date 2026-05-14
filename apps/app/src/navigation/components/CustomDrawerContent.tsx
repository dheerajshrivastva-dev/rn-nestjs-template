/**
 * Custom Drawer Content (2026)
 * Dynamic drawer menu based on user role
 * Uses drawerConfig.ts for role-based sections
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Divider, List, useTheme } from 'react-native-paper';
import { useAuthStore, selectUserRole } from '../../store/authStore';
import { getDrawerSections, getRoleDisplayName } from '../drawerConfig';
import { UserRole } from '../../api/types';
import { useLogout } from '../../hooks';
import { ConfirmDialog } from '@forge/ui';

export const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const theme = useTheme();
  const role = useAuthStore(selectUserRole) || UserRole.USER;
  const sections = getDrawerSections(role);
  const logoutMutation = useLogout();

  const [logoutDialogVisible, setLogoutDialogVisible] = React.useState(false);

  const handleItemPress = React.useCallback((item: any) => {
    if (item.action === 'logout') {
      setLogoutDialogVisible(true);
    } else if (item.route) {
      props.navigation.navigate(item.route as any);
    }
  }, [props.navigation]);

  return (
    <>
      <DrawerContentScrollView {...props} style={styles.container}>
        {/* Role Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primaryContainer }]}>
          <List.Subheader style={{ color: theme.colors.onPrimaryContainer }}>
            {getRoleDisplayName(role)}
          </List.Subheader>
        </View>

        {/* Drawer Sections */}
        {sections.map((section, index) => {
          if (section.type === 'header') {
            return (
              <List.Subheader key={`header-${index}`} style={styles.sectionHeader}>
                {section.title}
              </List.Subheader>
            );
          }

          if (section.type === 'divider') {
            return <Divider key={`divider-${index}`} style={styles.divider} />;
          }

          if (section.type === 'item') {
            return (
              <List.Item
                key={`item-${index}`}
                title={section.label}
                left={(iconProps) => <List.Icon {...iconProps} icon={section.icon} />}
                onPress={() => handleItemPress(section)}
                style={styles.item}
              />
            );
          }

          return null;
        })}
      </DrawerContentScrollView>

      <ConfirmDialog
        visible={logoutDialogVisible}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={async () => {
          setLogoutDialogVisible(false);
          try {
            await logoutMutation.mutateAsync();
          } catch (error) {
            console.error('Logout failed:', error);
          }
        }}
        onCancel={() => setLogoutDialogVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  item: {
    paddingVertical: 4,
  },
});
