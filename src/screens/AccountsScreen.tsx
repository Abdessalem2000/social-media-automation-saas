import { LinearGradient } from 'expo-linear-gradient';
import {
    AlertCircle,
    CheckCircle,
    Plus,
    RefreshCw,
    Users
} from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    ActivityIndicator,
    Chip,
    IconButton,
    Surface,
    useTheme
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { SocialMediaManager } from '../services/socialMediaManager';
import { AppDispatch, RootState } from '../store';
import {
    connectAccountFailure,
    connectAccountStart,
    connectAccountSuccess,
    disconnectAccount,
    syncAccountData,
} from '../store/slices/socialMediaSlice';


const AccountsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { accounts, isLoading } = useSelector((state: RootState) => state.socialMedia);
  
  const [socialManager] = useState(new SocialMediaManager());
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const supportedPlatforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'facebook',
      color: '#1877F2',
      gradient: ['#1877F2', '#2D4A8E'] as const,
      description: t('accounts.facebookDesc'),
      features: ['Pages Management', 'Post Scheduling', 'Analytics'],
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'instagram',
      color: '#E4405F',
      gradient: ['#E4405F', '#F5607A'] as const,
      description: t('accounts.instagramDesc'),
      features: ['Business Account', 'Content Publishing', 'Stories'],
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: 'twitter',
      color: '#1DA1F2',
      gradient: ['#1DA1F2', '#4A9FEF'] as const,
      description: t('accounts.twitterDesc'),
      features: ['Tweet Publishing', 'Analytics', 'Engagement'],
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: 'music-note',
      color: '#000000',
      gradient: ['#000000', '#333333'] as const,
      description: t('accounts.tiktokDesc'),
      features: ['Video Publishing', 'Trending', 'Analytics'],
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'linkedin',
      color: '#0077B5',
      gradient: ['#0077B5', '#005885'] as const,
      description: t('accounts.linkedinDesc'),
      features: ['Company Pages', 'Professional Content', 'Network'],
    },
  ];

  const handleConnectPlatform = async (platform: string) => {
    try {
      setConnectingPlatform(platform);
      dispatch(connectAccountStart(platform));

      const authUrl = socialManager.getAuthUrl(platform);
      const supported = await Linking.canOpenURL(authUrl);
      if (supported) {
        await Linking.openURL(authUrl);
        setTimeout(() => {
          handleAuthSuccess(platform);
        }, 3000);
      } else {
        throw new Error(`Cannot open URL: ${authUrl}`);
      }
    } catch {
      dispatch(connectAccountFailure('Failed to connect platform'));
      Alert.alert(t('common.error'), t('accounts.connectFailed'));
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleAuthSuccess = (platform: string) => {
    const mockAccount = {
      id: `${platform}_${Date.now()}`,
      platform: platform as any,
      name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
      username: `user_${platform}`,
      accessToken: 'mock_access_token',
      isConnected: true,
      followerCount: Math.floor(Math.random() * 10000) + 100,
      lastSync: new Date().toISOString(),
    };

    dispatch(connectAccountSuccess(mockAccount));
    Alert.alert(t('accounts.success'), t('accounts.connectedSuccessfully'));
  };

  const handleDisconnectAccount = (accountId: string) => {
    Alert.alert(
      t('accounts.disconnect'),
      t('accounts.disconnectConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('accounts.disconnect'),
          style: 'destructive',
          onPress: () => {
            dispatch(disconnectAccount(accountId));
            Alert.alert(t('accounts.success'), t('accounts.disconnectedSuccessfully'));
          },
        },
      ]
    );
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      const updatedData = {
        id: accountId,
        followerCount: Math.floor(Math.random() * 10000) + 100,
        lastSync: new Date().toISOString(),
      };
      
      dispatch(syncAccountData(updatedData));
      Alert.alert(t('accounts.success'), t('accounts.syncedSuccessfully'));
    } catch {
      Alert.alert(t('common.error'), t('accounts.syncFailed'));
    }
  };

  const getConnectedAccount = (platform: string) => {
    return accounts.find(account => account.platform === platform);
  };

  const renderPlatformCard = (platform: typeof supportedPlatforms[0]) => {
    const connectedAccount = getConnectedAccount(platform.id);
    const isConnecting = connectingPlatform === platform.id;

    return (
      <Surface key={platform.id} style={styles.modernPlatformCard}>
        <View style={styles.platformHeader}>
          <LinearGradient
            colors={platform.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.platformIconGradient}
          >
            <IconButton
              icon={platform.icon}
              size={28}
              iconColor="white"
            />
          </LinearGradient>
          
          <View style={styles.platformInfo}>
            <Text style={[styles.platformName, { color: theme.colors.onSurface }]}>
              {platform.name}
            </Text>
            <Text style={[styles.platformDesc, { color: theme.colors.onSurfaceVariant }]}>
              {platform.description}
            </Text>
            
            <View style={styles.platformFeatures}>
              {platform.features.map((feature, idx) => (
                <Chip key={idx} style={styles.featureChip} compact>
                  {feature}
                </Chip>
              ))}
            </View>
          </View>
          
          {connectedAccount ? (
            <View style={styles.connectedStatus}>
              <CheckCircle size={24} color="#4CAF50" />
              <Text style={[styles.connectedText, { color: '#4CAF50' }]}>
                {t('accounts.connected')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: platform.color }]}
              onPress={() => handleConnectPlatform(platform.id)}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Plus size={20} color="white" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {connectedAccount && (
          <View style={styles.accountDetails}>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: theme.colors.onSurface }]}>
                {connectedAccount.name}
              </Text>
              <Text style={[styles.accountUsername, { color: theme.colors.onSurfaceVariant }]}>
                @{connectedAccount.username}
              </Text>
              
              {connectedAccount.followerCount && (
                <View style={styles.followerInfo}>
                  <Users size={16} color={theme.colors.primary} />
                  <Text style={[styles.followerCount, { color: theme.colors.primary }]}>
                    {connectedAccount.followerCount.toLocaleString()} {t('accounts.followers')}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.accountActions}>
              <TouchableOpacity onPress={() => handleSyncAccount(connectedAccount.id)}>
                <RefreshCw size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDisconnectAccount(connectedAccount.id)}>
                <AlertCircle size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Surface>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Modern Header */}
      <LinearGradient
        colors={['#10B981', '#34D399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {t('accounts.title')}
          </Text>
          <Text style={styles.subtitle}>
            {t('accounts.subtitle')}
          </Text>
          
          <View style={styles.headerStats}>
            <Surface style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {accounts.length}
              </Text>
              <Text style={[styles.statTitle, { color: theme.colors.onSurfaceVariant }]}>
                {t('accounts.connectedAccounts')}
              </Text>
            </Surface>
            
            <Surface style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {accounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0).toLocaleString()}
              </Text>
              <Text style={[styles.statTitle, { color: theme.colors.onSurfaceVariant }]}>
                {t('accounts.totalFollowers')}
              </Text>
            </Surface>
          </View>
        </View>
      </LinearGradient>

      {/* Platform Cards */}
      <View style={styles.platformsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('accounts.platforms')}
        </Text>
        
        {supportedPlatforms.map(renderPlatformCard)}
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            {t('accounts.connecting')}
          </Text>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 4,
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  platformsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modernPlatformCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  platformHeader: {
    padding: 20,
  },
  platformIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  platformDesc: {
    fontSize: 14,
    marginBottom: 12,
  },
  platformFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  featureChip: {
    height: 24,
    fontSize: 10,
  },
  connectedStatus: {
    alignItems: 'center',
    position: 'absolute',
    right: 20,
    top: 20,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  connectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
    top: 20,
  },
  accountDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountUsername: {
    fontSize: 12,
  },
  followerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  followerCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 16,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default AccountsScreen;
