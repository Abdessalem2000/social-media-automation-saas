import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Checkbox,
    Divider,
    TextInput,
    useTheme,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { loginFailure, loginStart, loginSuccess } from '../../store/slices/authSlice';

const RegisterScreen: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('auth.errors.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('auth.errors.nameMinLength');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.errors.passwordMinLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordMismatch');
    }

    if (!agreeToTerms) {
      newErrors.terms = t('auth.errors.termsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    dispatch(loginStart());

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful registration
      const mockUser = {
        id: Date.now().toString(),
        email: formData.email.toLowerCase(),
        name: formData.name,
        subscription: 'free' as const,
      };

      dispatch(loginSuccess(mockUser));
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch {
      dispatch(loginFailure(t('auth.errors.registerFailed')));
      Alert.alert(t('auth.error'), t('auth.errors.registerFailed'));
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('auth.register')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {t('auth.registerSubtitle')}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label={t('auth.name')}
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            autoCapitalize="words"
            error={!!errors.name}
            style={styles.input}
            mode="outlined"
          />
          {errors.name && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.name}
            </Text>
          )}

          <TextInput
            label={t('auth.email')}
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            style={styles.input}
            mode="outlined"
          />
          {errors.email && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.email}
            </Text>
          )}

          <TextInput
            label={t('auth.password')}
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            secureTextEntry={!showPassword}
            error={!!errors.password}
            style={styles.input}
            mode="outlined"
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          {errors.password && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.password}
            </Text>
          )}

          <TextInput
            label={t('auth.confirmPassword')}
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            secureTextEntry={!showConfirmPassword}
            error={!!errors.confirmPassword}
            style={styles.input}
            mode="outlined"
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />
          {errors.confirmPassword && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.confirmPassword}
            </Text>
          )}

          <View style={styles.termsRow}>
            <Checkbox
              status={agreeToTerms ? 'checked' : 'unchecked'}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            />
            <View style={styles.termsTextContainer}>
              <Text style={[styles.termsText, { color: theme.colors.onSurface }]}>
                {t('auth.agreeToTerms')}{' '}
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                  {t('auth.termsOfService')}
                </Text>{' '}
                {t('auth.and')}{' '}
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                  {t('auth.privacyPolicy')}
                </Text>
              </Text>
            </View>
          </View>
          {errors.terms && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.terms}
            </Text>
          )}

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={[styles.registerButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.buttonContent}
          >
            {t('auth.register')}
          </Button>

          <Divider style={styles.divider} />

          <Text style={[styles.orText, { color: theme.colors.onSurfaceVariant }]}>
            {t('auth.or')}
          </Text>

          <Button
            mode="outlined"
            onPress={() => Alert.alert(t('auth.socialRegister'), t('auth.socialRegisterMessage'))}
            style={styles.socialButton}
            icon="google"
          >
            {t('auth.registerWithGoogle')}
          </Button>

          <Button
            mode="outlined"
            onPress={() => Alert.alert(t('auth.socialRegister'), t('auth.socialRegisterMessage'))}
            style={styles.socialButton}
            icon="facebook"
          >
            {t('auth.registerWithFacebook')}
          </Button>

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: theme.colors.onSurfaceVariant }]}>
              {t('auth.haveAccount')}
            </Text>
            <Button
              mode="text"
              onPress={() => router.back()}
              compact
            >
              {t('auth.login')}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    margin: 20,
    elevation: 4,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 16,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 20,
  },
  orText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  socialButton: {
    marginBottom: 8,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    marginRight: 8,
  },
});

export default RegisterScreen;
