/**
 * CreateUserScreen
 * Form to create a new user (name, email, phone, password, role).
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  TextField,
  PasswordInput,
  PhoneInput,
  Dropdown,
  type DropdownOption,
  FilledButton,
  OutlinedButton,
  Row,
  Spacer,
  TitleMedium,
  KeyboardAwareScrollContainer,
  SafeScreen,
  useToast,
} from '@bevarc/ui';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserStackNavigationProp } from '../../navigation/types';
import { UserRole } from '../../api/types';
import { indianMobileSchema } from '../../utils/validation';
import apiClient from '../../api/client';
import { USER_ENDPOINTS } from '../../api/endpoints';
import { selectUser, useAuthStore } from '../../store/authStore';

// ── Validation ────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address').max(255),
  phone: indianMobileSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole),
});

type CreateUserFormData = z.infer<typeof schema>;

const phoneCountryCode = '+91';

const ROLE_OPTIONS: DropdownOption[] = [
  { label: 'Admin', value: UserRole.ADMIN },
  { label: 'Manager', value: UserRole.MANAGER },
  { label: 'User', value: UserRole.USER },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const CreateUserScreen = () => {
  const navigation = useNavigation<UserStackNavigationProp>();
  const toast = useToast();
  const currentUser = useAuthStore(selectUser);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const defaultRole =
    currentUser?.role === UserRole.SUPER_ADMIN ? UserRole.ADMIN : UserRole.USER;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: defaultRole,
    },
    mode: 'onChange',
  });

  const onSubmit = React.useCallback(async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(USER_ENDPOINTS.CREATE, {
        name: data.name,
        email: data.email,
        phone: `${phoneCountryCode}${data.phone}`,
        password: data.password,
        role: data.role,
      });
      toast.success('User created successfully.');
      navigation.goBack();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Failed to create user.';
      toast.error('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [navigation, toast]);

  const handleCancel = React.useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
      <KeyboardAwareScrollContainer>
        <View style={styles.container}>
          <TitleMedium style={styles.sectionTitle}>New User Details</TitleMedium>

          <Spacer size="md" />

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextField
                label="Full Name"
                value={value}
                onChangeText={onChange}
                error={!!error?.message}
                helperText={error?.message}
                required
              />
            )}
          />

          <Spacer size="md" />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextField
                label="Email"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!error?.message}
                helperText={error?.message}
                required
              />
            )}
          />

          <Spacer size="md" />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <PhoneInput
                label="Phone Number"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                countryCode={phoneCountryCode}
                error={!!errors.phone?.message}
                helperText={errors.phone?.message}
                placeholder="9876543210"
              />
            )}
          />

          <Spacer size="md" />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <PasswordInput
                label="Password"
                value={value}
                onChangeText={onChange}
                error={!!error?.message}
                helperText={error?.message}
                required
              />
            )}
          />

          <Spacer size="md" />

          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <Dropdown
                label="Role"
                options={ROLE_OPTIONS}
                value={value}
                onValueChange={onChange}
              />
            )}
          />

          <Spacer size="xl" />

          <Row style={styles.actions}>
            <OutlinedButton
              onPress={handleCancel}
              disabled={isSubmitting}
              style={styles.actionButton}>
              Cancel
            </OutlinedButton>
            <FilledButton
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={!isValid || isSubmitting}
              style={styles.actionButton}>
              Create User
            </FilledButton>
          </Row>
        </View>
      </KeyboardAwareScrollContainer>
    </SafeScreen>
  );
};

CreateUserScreen.displayName = 'CreateUserScreen';

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: { marginBottom: 8 },
  actions: { gap: 12, justifyContent: 'flex-end' },
  actionButton: { flex: 1 },
});
