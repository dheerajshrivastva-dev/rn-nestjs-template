import React, {useRef, useState} from 'react';
import {View, StyleSheet, type TextInput} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
  Text,
  TextField,
  PhoneInput,
  PasswordInput,
  FilledButton,
  TextButton,
  useTheme,
  useToast,
} from '@bevarc/ui';
import {useRegister} from '../../hooks/mutations/useRegister';
import {AuthScreenLayout} from './AuthScreenLayout';
import {indianMobileSchema} from '../../utils/validation';

// ─── Step 1 schema ───────────────────────────────────────────────────────────

const step1Schema = z.object({
  phone: indianMobileSchema,
  countryCode: z.string().default('+91'),
  email: z
    .string({required_error: 'Email is required'})
    .email('Enter a valid email address'),
});

// ─── Step 2 schema ───────────────────────────────────────────────────────────

const step2Schema = z
  .object({
    firstName: z
      .string({required_error: 'First name is required'})
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name is too long'),
    lastName: z
      .string({required_error: 'Last name is required'})
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name is too long'),
    password: z
      .string({required_error: 'Password is required'})
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/,
        'Include at least one uppercase letter, one number, and one special character',
      ),
    confirmPassword: z.string({required_error: 'Please confirm your password'}),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LoginPrefill {
  phone?: string;
  countryCode?: string;
}

interface RegisterScreenProps {
  onRegistered: () => void;
  onLoginPress: (prefill?: LoginPrefill) => void;
}

// ─── Step 1 — Contact details ─────────────────────────────────────────────────

function Step1({onNext}: {onNext: (data: Step1Data) => void}) {
  const theme = useTheme();
  const [countryCode, setCountryCode] = useState('+91');
  const emailRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {phone: '', countryCode: '+91', email: ''},
    mode: 'onBlur',
  });

  return (
    <AuthScreenLayout title="Create your account">
      <Text
        variant="bodyMedium"
        style={[styles.stepHint, {color: theme.colors.onSurfaceVariant}]}>
        Step 1 of 2 — Let's start with your contact details
      </Text>

      <Controller
        control={control}
        name="phone"
        render={({field: {onChange, onBlur, value}}) => (
          <PhoneInput
            label="Mobile Number"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            error={!!errors.phone?.message}
            helperText={errors.phone?.message}
            placeholder="9876543210"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            blurOnSubmit={false}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({field: {onChange, onBlur, value}}) => (
          <TextField
            ref={emailRef}
            label="Email Address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.email?.message}
            helperText={errors.email?.message}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSubmit(d => onNext({...d, countryCode}))}
            blurOnSubmit={false}
          />
        )}
      />

      <Text
        variant="bodyMedium"
        style={[styles.note, {color: theme.colors.onSurfaceVariant}]}>
        Your account will be reviewed by an admin before you can sign in.
      </Text>

      <FilledButton
        onPress={handleSubmit(d => onNext({...d, countryCode}))}
        style={styles.button}>
        Continue
      </FilledButton>
    </AuthScreenLayout>
  );
}

// ─── Step 2 — Name & password ─────────────────────────────────────────────────

function Step2({
  onBack,
  onSubmit,
  isLoading,
}: {
  onBack: () => void;
  onSubmit: (data: Step2Data) => void;
  isLoading: boolean;
}) {
  const theme = useTheme();
  const lastNameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {firstName: '', lastName: '', password: '', confirmPassword: ''},
    mode: 'onBlur',
  });

  return (
    <AuthScreenLayout title="Almost there" showBack onBack={onBack}>
      <Text
        variant="bodyMedium"
        style={[styles.stepHint, {color: theme.colors.onSurfaceVariant}]}>
        Step 2 of 2 — Tell us your name and set a password
      </Text>

      <View style={styles.nameRow}>
        <View style={styles.nameField}>
          <Controller
            control={control}
            name="firstName"
            render={({field: {onChange, onBlur, value}}) => (
              <TextField
                label="First Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.firstName?.message}
                helperText={errors.firstName?.message}
                placeholder="John"
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                blurOnSubmit={false}
                editable={!isLoading}
              />
            )}
          />
        </View>

        <View style={styles.nameField}>
          <Controller
            control={control}
            name="lastName"
            render={({field: {onChange, onBlur, value}}) => (
              <TextField
                ref={lastNameRef}
                label="Last Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.lastName?.message}
                helperText={errors.lastName?.message}
                placeholder="Doe"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                editable={!isLoading}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="password"
        render={({field: {onChange, onBlur, value}}) => (
          <PasswordInput
            ref={passwordRef}
            label="Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.password?.message}
            helperText={
              errors.password?.message ??
              'Min 8 chars, 1 uppercase, 1 number, 1 special character'
            }
            placeholder="Create a strong password"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            blurOnSubmit={false}
            editable={!isLoading}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({field: {onChange, onBlur, value}}) => (
          <PasswordInput
            ref={confirmRef}
            label="Confirm Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.confirmPassword?.message}
            helperText={errors.confirmPassword?.message}
            placeholder="Re-enter your password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit(onSubmit)}
            blurOnSubmit={false}
            editable={!isLoading}
          />
        )}
      />

      <FilledButton
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}>
        Create Account
      </FilledButton>
    </AuthScreenLayout>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegistered,
  onLoginPress,
}) => {
  const theme = useTheme();
  const toast = useToast();
  const registerMutation = useRegister();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleStep2 = async (data: Step2Data) => {
    if (!step1Data) {return;}
    try {
      await registerMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: step1Data.email,
        phone: `${step1Data.countryCode}${step1Data.phone.trim()}`,
        password: data.password,
      });
      onRegistered();
    } catch (error: any) {
      const body = error?.response?.data;

      if (error?.response?.status === 409 && body?.code === 'ACCOUNT_EXISTS') {
        toast.info(
          'Account Already Exists',
          body.message,
        );
        // Send user to login pre-filled with their phone number
        onLoginPress({
          phone: step1Data.phone,
          countryCode: step1Data.countryCode,
        });
        return;
      }

      const msg = body?.message ?? 'Registration failed. Please try again.';
      toast.error('Registration Failed', msg);
    }
  };

  return (
    <>
      {step === 1 ? (
        <Step1 onNext={handleStep1} />
      ) : (
        <Step2
          onBack={() => setStep(1)}
          onSubmit={handleStep2}
          isLoading={registerMutation.isPending}
        />
      )}

      <View
        style={[
          styles.loginRow,
          {borderTopColor: theme.colors.outlineVariant},
        ]}>
        <Text
          variant="bodyMedium"
          style={{color: theme.colors.onSurfaceVariant}}>
          Already have an account?
        </Text>
        <TextButton onPress={onLoginPress}>Sign In</TextButton>
      </View>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stepHint: {
    marginBottom: 8,
  },
  note: {
    marginTop: 4,
    lineHeight: 20,
  },
  button: {
    borderRadius: 12,
    marginTop: 8,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
});
