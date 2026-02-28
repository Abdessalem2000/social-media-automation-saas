import { LinearGradient } from 'expo-linear-gradient';
import {
    BarChart3,
    Calendar,
    Plus,
    Target,
    Users
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Dimensions, RefreshControl, StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    Chip,
    FAB,
    IconButton,
    Surface,
    useTheme
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AnalyticsOverview, analyticsService } from '../services/analytics.service';
import { AppDispatch, RootState } from '../store';
import { fetchAnalyticsFailure, fetchAnalyticsStart, fetchAnalyticsSuccess } from '../store/slices/analyticsSlice';

const { width, height } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { accounts } = useSelector((state: RootState) => state.socialMedia);
  const { data: analyticsData } = useSelector((state: RootState) => state.analytics);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverview | null>(null);

  const loadAnalyticsData = async () => {
    try {
      dispatch(fetchAnalyticsStart());
      const response = await analyticsService.getOverview();
      
      if (response.success) {
        setAnalyticsOverview(response.data);
        
        // Transform data for the existing analytics slice structure
        const transformedData = response.data.accounts.map(account => ({
          platform: account.platform,
          followers: account.followers,
          following: 0, // Not provided by API
          posts: account.posts,
          engagement: {
            likes: response.data.engagement.totalLikes,
            comments: response.data.engagement.totalComments,
            shares: response.data.engagement.totalShares,
          },
          reach: response.data.engagement.totalReach,
          impressions: response.data.engagement.totalViews,
          growth: { followers: 0, engagement: 0 }, // Calculate from historical data
        }));
        
        dispatch(fetchAnalyticsSuccess(transformedData));
      }
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      dispatch(fetchAnalyticsFailure(error.message || 'Failed to load analytics'));
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  }, [dispatch]);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  const totalFollowers = analyticsData.reduce((sum, platform) => sum + platform.followers, 0);
  const totalEngagement = analyticsData.reduce((sum, platform) => 
    sum + platform.engagement.likes + platform.engagement.comments + platform.engagement.shares, 0
  );

  const quickStats = [
    { 
      title: 'Total Followers', 
      value: totalFollowers.toLocaleString(),
      change: '+12%',
      icon: Users,
      color: '#6366F1',
      gradient: ['#6366F1', '#8B5CF6'] as const
    },
    { 
      title: 'Total Posts', 
      value: analyticsOverview?.overview.totalPosts?.toLocaleString() || '0',
      change: `+${analyticsOverview?.overview.publishedPosts || 0}`,
      icon: BarChart3,
      color: '#10B981',
      gradient: ['#10B981', '#34D399'] as const
    },
    { 
      title: 'Scheduled Posts', 
      value: analyticsOverview?.overview.scheduledPosts?.toLocaleString() || '0',
      change: 'New',
      icon: Calendar,
      color: '#F59E0B',
      gradient: ['#F59E0B', '#FCD34D'] as const
    },
    { 
      title: 'Active Platforms', 
      value: accounts.length.toString(),
      change: '+1',
      icon: Target,
      color: '#EF4444',
      gradient: ['#EF4444', '#F87171'] as const
    },
  ];

  const recentActivity = [
    { id: 1, type: 'post', message: 'Post published successfully', time: '2 hours ago', icon: 'check-circle', color: '#4CAF50' },
    { id: 2, type: 'follower', message: 'New follower gained', time: '5 hours ago', icon: 'user-plus', color: '#2196F3' },
    { id: 3, type: 'engagement', message: 'High engagement on recent post', time: '1 day ago', icon: 'trending-up', color: '#FF9800' },
  ];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const renderStatCard = (stat: typeof quickStats[0], index: number) => {
    const Icon = stat.icon;
    return (
      <Animated.View
        key={index}
        style={[
          styles.modernStatCard,
          {
            transform: [
              {
                scale: scrollY.interpolate({
                  inputRange: [0, 200],
                  outputRange: [1, 0.95],
                  extrapolate: 'clamp',
                }),
              },
            ],
            opacity: scrollY.interpolate({
              inputRange: [0, 200],
              outputRange: [1, 0.9],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <LinearGradient
          colors={stat.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statGradient}
        >
          <View style={styles.statContent}>
            <View style={styles.statHeader}>
              <Icon size={24} color="white" />
              <Text style={styles.statChange}>{stat.change}</Text>
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderActivityItem = (activity: typeof recentActivity[0]) => (
    <View key={activity.id} style={styles.modernActivityItem}>
      <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
        <IconButton icon={activity.icon} size={20} iconColor={activity.color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityMessage, { color: theme.colors.onSurface }]}>
          {activity.message}
        </Text>
        <Text style={[styles.activityTime, { color: theme.colors.onSurfaceVariant }]}>
          {activity.time}
        </Text>
      </View>
      <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
    </View>
  );

  return (
    <Animated.ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      {/* Modern Header */}
      <Animated.View style={[styles.modernHeader, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>
                  {t('dashboard.welcome')}, {user?.firstName || t('dashboard.user')}!
                </Text>
                <Text style={styles.subtitle}>
                  {t('dashboard.subtitle')}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <IconButton
                  icon="bell"
                  size={24}
                  iconColor="white"
                  style={styles.headerButton}
                />
                <IconButton
                  icon="cog"
                  size={24}
                  iconColor="white"
                  style={styles.headerButton}
                />
              </View>
            </View>
            
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction}>
                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  style={styles.quickActionGradient}
                >
                  <Plus size={20} color="white" />
                  <Text style={styles.quickActionText}>Create Post</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickAction}>
                <LinearGradient
                  colors={['#F59E0B', '#FCD34D']}
                  style={styles.quickActionGradient}
                >
                  <Users size={20} color="white" />
                  <Text style={styles.quickActionText}>Connect</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Modern Stats Grid */}
      <View style={styles.statsContainer}>
        {quickStats.map((stat, index) => renderStatCard(stat, index))}
      </View>

      {/* Connected Platforms */}
      <View style={styles.modernSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('dashboard.connectedPlatforms')}
        </Text>
        <Surface style={styles.platformsSurface}>
          <View style={styles.platformsContainer}>
            {accounts.map((account) => (
              <Chip
                key={account.id}
                icon="account-circle"
                style={styles.modernPlatformChip}
                textStyle={{ color: theme.colors.onSurface }}
              >
                {account.platform} - {account.name}
              </Chip>
            ))}
            {accounts.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                {t('dashboard.noAccounts')}
              </Text>
            )}
          </View>
        </Surface>
      </View>

      {/* Recent Activity */}
      <View style={styles.modernSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('dashboard.recentActivity')}
        </Text>
        <Surface style={styles.activitySurface}>
          {recentActivity.map(renderActivityItem)}
        </Surface>
      </View>

      {/* Performance Summary */}
      <View style={styles.modernSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Performance Summary
        </Text>
        <Surface style={styles.summarySurface}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                89%
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Post Success Rate
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                2.4x
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Engagement Growth
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                156
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Posts
              </Text>
            </View>
          </View>
        </Surface>
      </View>

      <View style={styles.bottomSpacer} />

      {/* Modern FAB */}
      <FAB
        icon="plus"
        style={[styles.modernFab, { backgroundColor: theme.colors.primary }]}
        label={t('dashboard.createPost')}
        onPress={() => console.log('Navigate to create post')}
      />
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modernHeader: {
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  quickActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  modernStatCard: {
    width: (width - 56) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statGradient: {
    padding: 16,
    minHeight: 120,
  },
  statContent: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statChange: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modernSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  platformsSurface: {
    borderRadius: 16,
    elevation: 4,
    padding: 16,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modernPlatformChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  activitySurface: {
    borderRadius: 16,
    elevation: 4,
    padding: 8,
  },
  modernActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
  summarySurface: {
    borderRadius: 16,
    elevation: 4,
    padding: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  modernFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default DashboardScreen;
