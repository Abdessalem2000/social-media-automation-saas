import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Checkbox,
  useTheme,
  Divider,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { useTranslation } from 'react-i18next';

const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.errors.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.errors.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const result = await dispatch(loginUser({ email, password }));
      
      if (result.meta.requestStatus === 'fulfilled') {
        // Login successful
        router.replace('/(tabs)');
      } else {
        // Login failed
        Alert.alert(t('auth.error'), result.payload as string);
      }
    } catch (error) {
      Alert.alert(t('auth.error'), t('auth.errors.loginFailed'));
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      t('auth.socialLogin'),
      `${t('auth.socialLoginMessage')} ${provider}`,
      [{ text: t('common.ok'), style: 'default' }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('auth.login')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {t('auth.loginSubtitle')}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
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
            value={password}
            onChangeText={setPassword}
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

          <View style={styles.optionsRow}>
            <Checkbox
              status={rememberMe ? 'checked' : 'unchecked'}
              onPress={() => setRememberMe(!rememberMe)}
            />
            <Text style={[styles.checkboxLabel, { color: theme.colors.onSurface }]}>
              {t('auth.rememberMe')}
            </Text>
            <Button
              mode="text"
              onPress={() => router.push('/auth/forgot-password')}
              compact
            >
              {t('auth.forgotPassword')}
            </Button>
          </View>

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.buttonContent}
          >
            {t('auth.login')}
          </Button>

          <Divider style={styles.divider} />

          <Text style={[styles.orText, { color: theme.colors.onSurfaceVariant }]}>
            {t('auth.or')}
          </Text>

          <Button
            mode="outlined"
            onPress={() => handleSocialLogin('Google')}
            style={styles.socialButton}
            icon="google"
          >
            {t('auth.loginWithGoogle')}
          </Button>

          <Button
            mode="outlined"
            onPress={() => handleSocialLogin('Facebook')}
            style={styles.socialButton}
            icon="facebook"
          >
            {t('auth.loginWithFacebook')}
          </Button>

          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: theme.colors.onSurfaceVariant }]}>
              {t('auth.noAccount')}
            </Text>
            <Button
              mode="text"
              onPress={() => router.push('/auth/register')}
              compact
            >
              {t('auth.register')}
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 8,
  },
  loginButton: {
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
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    marginRight: 8,
  },
});

export default LoginScreen;
