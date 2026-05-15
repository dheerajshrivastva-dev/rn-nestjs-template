/**
 * Edit User Screen
 * Allows editing user profile and admin-only fields
 *
 * Access Control & Fields:
 * - USER (self-edit): Can edit name, address, profile picture
 * - ADMIN: Can edit user status (for users in their company)
 * - SUPER_ADMIN: Can edit user status + assign company (one-time only)
 *
 * NOTE: Email and phone CANNOT be edited
 */

import React from 'react';

import {View, StyleSheet} from 'react-native';

import {
  SafeScreen,
  TextField,
  Dropdown,
  AvatarPicker,
  type DropdownOption,
  FilledButton,
  OutlinedButton,
  Row,
  Spacer,
  TitleMedium,
  BodySmall,
  Divider,
  useTheme,
  KeyboardAwareScrollContainer,
  LoadingDialog,
  useToast,
} from '@bevarc/ui';
import {zodResolver} from '@hookform/resolvers/zod';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';

import {UserRole, UserStatus} from '../../api/types';
import {useUserById, useUpdateUser, useUpload} from '../../hooks';
import {type UserScreens} from '../../navigation/screens';
import type {UserStackParamList, UsersStackNavigationProp} from '../../navigation/types';
import { selectUser, useAuthStore } from '../../store/authStore';

type EditAgentRouteProp = RouteProp<
  UserStackParamList,
  typeof UserScreens.Edit
>;

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  // Tracks the hosted URL shown in AvatarPicker; publicId is kept in a ref
  profilePictureUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const statusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type StatusFormData = z.infer<typeof statusSchema>;

const STATUS_OPTIONS: DropdownOption[] = [
  {label: 'Active', value: UserStatus.ACTIVE},
  {label: 'Inactive', value: UserStatus.INACTIVE},
  {label: 'Suspended', value: UserStatus.SUSPENDED},
];

export const EditUserScreen = () => {
  const theme = useTheme();
  const toast = useToast();
  const navigation = useNavigation<UsersStackNavigationProp>();
  const route = useRoute<EditAgentRouteProp>();
  const {userId} = route.params;

  // Fetch current user (viewer)
  const currentUser = useAuthStore(selectUser);

  // Fetch user to edit
  const {data: user, isLoading: agentLoading} = useUserById(userId);

  // Update mutation
  const {mutate: updateUser, isPending: isUpdating} = useUpdateUser();

  const {uploadProfile} = useUpload();

  // Tracks the publicId of the currently saved profile picture for old-image cleanup on re-upload
  const profilePublicIdRef = React.useRef<string | undefined>(
    user?.profilePicture?.publicId ?? undefined,
  );

  // Determine permissions
  const isSelfEdit = currentUser?.id === userId;
  const viewerRole = currentUser?.role || UserRole.RETAILER;

  const canEditStatus = !isSelfEdit;

  // Profile form (for self-edit or SUPER_ADMIN editing profile)
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      profilePictureUrl: user?.profilePicture?.url || '',
    },
    mode: 'onChange',
  });

  // Status form (for ADMIN/SUPER_ADMIN)
  const statusForm = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: user?.status || UserStatus.ACTIVE,
    },
    mode: 'onChange',
  });

  // Update form values when user data loads
  React.useEffect(() => {
    if (user) {
      profilePublicIdRef.current = user.profilePicture?.publicId ?? undefined;
      profileForm.reset({
        name: user.name,
        profilePictureUrl: user.profilePicture?.url || '',
      });
      statusForm.reset({
        status: user.status,
      });
    }
  }, [user, profileForm, statusForm]);

  // Handlers
  const handleSaveProfile = React.useCallback(
    (data: ProfileFormData) => {
      updateUser(
        {
          userId,
          data: {
            name: data.name,
            ...(data.profilePictureUrl
              ? {
                  profilePicture: {
                    url: data.profilePictureUrl,
                    publicId: profilePublicIdRef.current ?? '',
                  },
                }
              : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success('Profile updated successfully.');
            navigation.goBack();
          },
          onError: error => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to update profile. Please try again.';
            toast.error('Error', errorMessage);
          },
        },
      );
    },
    [userId, updateUser, navigation],
  );

  const handleSaveStatus = React.useCallback(
    (data: StatusFormData) => {
      updateUser(
        {
          userId,
          data: {status: data.status},
        },
        {
          onSuccess: () => {
            toast.success('User status updated successfully.');
            navigation.goBack();
          },
          onError: error => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to update status. Please try again.';
            toast.error('Error', errorMessage);
          },
        },
      );
    },
    [userId, updateUser, navigation],
  );

  const handleCancel = React.useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (agentLoading || !user) {
    return (
      <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
        <LoadingDialog visible message="Loading user details..." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
      <KeyboardAwareScrollContainer>
        <View style={styles.container}>
          {/* Profile Section (Self-edit or SUPER_ADMIN) */}
          <TitleMedium style={styles.sectionTitle}>
            Profile Information
          </TitleMedium>
          <BodySmall
            color={theme.colors.onSurfaceVariant}
            style={styles.sectionDescription}>
            Update your profile details. Email and phone cannot be changed.
          </BodySmall>

          <Spacer size="md" />

          {/* Profile Picture */}
          <Controller
            control={profileForm.control}
            name="profilePictureUrl"
            render={({field: {onChange, value}}) => (
              <AvatarPicker
                imageUri={value || undefined}
                onImageChange={onChange}
                onRemove={() => onChange('')}
                onUpload={async (uri) => {
                  const result = await uploadProfile({
                    uri,
                    entityId: userId,
                    oldPublicId: profilePublicIdRef.current,
                  });
                  profilePublicIdRef.current = result.publicId;
                  return result.url;
                }}
                size={120}
                style={styles.avatar}
              />
            )}
          />

          <Spacer size="lg" />

          {/* Name */}
          <Controller
            control={profileForm.control}
            name="name"
            render={({field: {onChange, value}, fieldState: {error}}) => (
              <TextField
                label="Full Name"
                value={value}
                onChangeText={onChange}
                error={!!error?.message}
                required
              />
            )}
          />

          <Spacer size="md" />

          {/* Email (Read-only) */}
          <TextField
            label="Email"
            value={user.email}
            editable={false}
            disabled
          />

          <Spacer size="md" />

          {/* Phone (Read-only) */}
          <TextField
            label="Phone"
            value={user.phone}
            editable={false}
            disabled
          />

          <Spacer size="md" />

          {/* Profile Actions */}
          <Row style={styles.actions}>
            <OutlinedButton
              onPress={handleCancel}
              disabled={isUpdating}
              style={styles.actionButton}>
              Cancel
            </OutlinedButton>
            <FilledButton
              onPress={profileForm.handleSubmit(handleSaveProfile)}
              loading={isUpdating}
              disabled={
                !profileForm.formState.isValid ||
                !profileForm.formState.isDirty ||
                isUpdating
              }
              style={styles.actionButton}>
              Save Profile
            </FilledButton>
          </Row>

          {canEditStatus && <Spacer size="xl" />}

          {/* Status Section (ADMIN/SUPER_ADMIN only, not for self) */}
          {canEditStatus && (
            <>
              {(isSelfEdit || viewerRole === UserRole.SUPER_ADMIN) && (
                <Divider style={{marginVertical: 24}} />
              )}

              <TitleMedium style={styles.sectionTitle}>
                User Status
              </TitleMedium>
              <BodySmall
                color={theme.colors.onSurfaceVariant}
                style={styles.sectionDescription}>
                Change the user's status. This affects their access to the
                system.
              </BodySmall>

              <Spacer size="md" />

              {/* Status Dropdown */}
              <Controller
                control={statusForm.control}
                name="status"
                render={({field: {onChange, value}}) => (
                  <Dropdown
                    label="Status"
                    options={STATUS_OPTIONS}
                    value={value}
                    onValueChange={onChange}
                  />
                )}
              />

              <Spacer size="lg" />

              {/* Status Actions */}
              <Row style={styles.actions}>
                <OutlinedButton
                  onPress={handleCancel}
                  disabled={isUpdating}
                  style={styles.actionButton}>
                  Cancel
                </OutlinedButton>
                <FilledButton
                  onPress={statusForm.handleSubmit(handleSaveStatus)}
                  loading={isUpdating}
                  disabled={
                    !statusForm.formState.isDirty || isUpdating
                  }
                  style={styles.actionButton}>
                  Update Status
                </FilledButton>
              </Row>
            </>
          )}
        </View>
      </KeyboardAwareScrollContainer>
    </SafeScreen>
  );
};

EditUserScreen.displayName = 'EditUserScreen';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
  },
  actions: {
    gap: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flex: 1,
  },
  avatar: {
    alignSelf: 'flex-start',
  }
});
