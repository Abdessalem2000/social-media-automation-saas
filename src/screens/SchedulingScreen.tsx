import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Calendar as CalendarIcon,
    Filter,
    Target,
    Users
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import {
    Chip,
    FAB,
    IconButton,
    Surface,
    useTheme
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { schedulingService } from '../services/scheduling.service';
import { AppDispatch, RootState } from '../store';
import {
    loadPostsSuccess,
    setCalendarView,
    setSelectedDate,
    updatePostStatus
} from '../store/slices/schedulingSlice';

const { width, height } = Dimensions.get('window');

const SchedulingScreen: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { posts, calendarView, selectedDate } = useSelector((state: RootState) => state.scheduling);
  const { accounts } = useSelector((state: RootState) => state.socialMedia);

  const [showCalendar, setShowCalendar] = useState(true);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [scrollY] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(false);

  // Fetch posts from API on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const response = await schedulingService.getPosts();
        if (response.success) {
          // Map Post type to ScheduledPost type
          const scheduledPosts = response.data.posts.map((post: any) => ({
            id: post._id,
            content: post.content.text,
            platforms: [post.platform],
            scheduledDate: post.scheduledAt ? new Date(post.scheduledAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: post.status,
            createdAt: post.createdAt,
            postedAt: post.publishedAt,
            engagement: post.engagement
          }));
          
          dispatch(loadPostsSuccess(scheduledPosts));
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [dispatch]);

  useEffect(() => {
    // Mark dates with scheduled posts
    const dates: Record<string, any> = {};
    posts.forEach(post => {
      if (post.status === 'scheduled') {
        const date = post.scheduledDate;
        dates[date] = {
          marked: true,
          dotColor: theme.colors.primary,
        };
      }
    });
    setMarkedDates(dates);
  }, [posts, theme.colors.primary]);

  const handleDateSelect = (day: any) => {
    dispatch(setSelectedDate(day.dateString));
    setShowCalendar(false);
  };

  const handleCreatePost = () => {
    router.push('/(tabs)/scheduling/create-post' as any);
  };

  const handlePostPress = (post: any) => {
    router.push(`/(tabs)/scheduling/post-detail?id=${post.id}` as any);
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      t('common.delete'),
      t('scheduling.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            console.log('Delete post:', postId);
          },
        },
      ]
    );
  };

  const handlePublishNow = (postId: string) => {
    dispatch(updatePostStatus({ 
      id: postId, 
      status: 'posted', 
      postedAt: new Date().toISOString() 
    }));
    Alert.alert(t('scheduling.success'), t('scheduling.postPublished'));
  };

  const getPostsForSelectedDate = () => {
    if (!selectedDate) return [];
    return posts.filter(post => post.scheduledDate === selectedDate);
  };

  const upcomingPosts = posts
    .filter(post => post.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const renderStatCard = (title: string, value: string, icon: any, gradient: readonly [string, string]) => {
    const Icon = icon;
    return (
      <Surface style={styles.modernStatCard}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statGradient}
        >
          <Icon size={24} color="white" />
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </LinearGradient>
      </Surface>
    );
  };

  const renderPostItem = (post: any, index: number) => (
    <Animated.View
      key={post.id}
      style={[
        styles.modernPostItem,
        {
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [0, 200],
                outputRange: [0, 10],
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
      <Surface style={styles.postSurface}>
        <View style={styles.postContent}>
          <View style={styles.postHeader}>
            <Text style={[styles.postTitle, { color: theme.colors.onSurface }]}>
              {post.content.substring(0, 50)}...
            </Text>
            <Text style={[styles.postTime, { color: theme.colors.onSurfaceVariant }]}>
              {format(new Date(post.scheduledDate), 'h:mm a')}
            </Text>
          </View>
          
          <View style={styles.postPlatforms}>
            {post.platforms.map((platform: string) => (
              <Chip key={platform} style={styles.platformChip} compact>
                {platform}
              </Chip>
            ))}
          </View>
        </View>
        
        <View style={styles.postActions}>
          <IconButton
            icon="play"
            onPress={() => handlePublishNow(post.id)}
            size={20}
          />
          <IconButton
            icon="pencil"
            onPress={() => handlePostPress(post)}
            size={20}
          />
          <IconButton
            icon="delete"
            onPress={() => handleDeletePost(post.id)}
            size={20}
          />
        </View>
      </Surface>
    </Animated.View>
  );

  return (
    <Animated.ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      {/* Modern Header */}
      <Animated.View style={[styles.modernHeader, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.title}>
              {t('scheduling.title')}
            </Text>
            <Text style={styles.subtitle}>
              {t('scheduling.subtitle')}
            </Text>
            
            {/* Quick Stats */}
            <View style={styles.headerStats}>
              {renderStatCard('Scheduled', posts.filter(p => p.status === 'scheduled').length.toString(), CalendarIcon, ['#F59E0B', '#FCD34D'] as const)}
              {renderStatCard('Published', posts.filter(p => p.status === 'posted').length.toString(), Target, ['#10B981', '#34D399'] as const)}
              {renderStatCard('Platforms', accounts.length.toString(), Users, ['#6366F1', '#8B5CF6'] as const)}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* View Toggle */}
      <View style={styles.viewToggleContainer}>
        <Surface style={styles.viewToggleSurface}>
          {['day', 'week', 'month'].map((view) => (
            <TouchableOpacity
              key={view}
              style={[
                styles.viewToggleItem,
                calendarView === view && styles.viewToggleItemActive
              ]}
              onPress={() => dispatch(setCalendarView(view as any))}
            >
              <Text style={[
                styles.viewToggleText,
                calendarView === view && styles.viewToggleTextActive
              ]}>
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </Surface>
      </View>

      {/* Calendar */}
      {showCalendar && (
        <Animated.View
          style={[
            styles.calendarContainer,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 200],
                outputRange: [1, 0.95],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Surface style={styles.calendarSurface}>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={markedDates}
              theme={{
                backgroundColor: theme.colors.surface,
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.onSurface,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.onPrimary,
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.onSurface,
                textDisabledColor: theme.colors.onSurfaceVariant,
                arrowColor: theme.colors.primary,
                monthTextColor: theme.colors.onSurface,
              }}
            />
          </Surface>
        </Animated.View>
      )}

      {/* Selected Date Posts */}
      {selectedDate && !showCalendar && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </Text>
            <TouchableOpacity onPress={() => setShowCalendar(true)}>
              <CalendarIcon size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          {getPostsForSelectedDate().length === 0 ? (
            <Surface style={styles.emptySurface}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                {t('scheduling.noPostsScheduled')}
              </Text>
            </Surface>
          ) : (
            getPostsForSelectedDate().map((post, index) => renderPostItem(post, index))
          )}
        </View>
      )}

      {/* Upcoming Posts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Upcoming Posts
          </Text>
          <TouchableOpacity>
            <Filter size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        {upcomingPosts.length === 0 ? (
          <Surface style={styles.emptySurface}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No upcoming posts
            </Text>
          </Surface>
        ) : (
          upcomingPosts.map((post, index) => renderPostItem(post, index))
        )}
      </View>

      {/* Performance Overview */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Performance Overview
        </Text>
        <Surface style={styles.performanceSurface}>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: theme.colors.primary }]}>
                89%
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                On-Time Rate
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: theme.colors.primary }]}>
                4.8%
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Engagement Rate
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: theme.colors.primary }]}>
                2.4x
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Growth Multiplier
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
        label="Create Post"
        onPress={handleCreatePost}
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
  modernStatCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  statGradient: {
    padding: 12,
    alignItems: 'center',
    minHeight: 80,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 4,
  },
  statTitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  viewToggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  viewToggleSurface: {
    borderRadius: 16,
    elevation: 4,
    flexDirection: 'row',
    padding: 4,
  },
  viewToggleItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewToggleItemActive: {
    backgroundColor: '#6366F1',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  viewToggleTextActive: {
    color: 'white',
  },
  calendarContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  calendarSurface: {
    borderRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySurface: {
    borderRadius: 16,
    elevation: 2,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  modernPostItem: {
    marginBottom: 12,
  },
  postSurface: {
    borderRadius: 16,
    elevation: 4,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postContent: {
    flex: 1,
  },
  postHeader: {
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  postTime: {
    fontSize: 12,
  },
  postPlatforms: {
    flexDirection: 'row',
    gap: 4,
  },
  platformChip: {
    height: 24,
  },
  postActions: {
    flexDirection: 'row',
    gap: 4,
  },
  performanceSurface: {
    borderRadius: 16,
    elevation: 4,
    padding: 20,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  performanceLabel: {
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

export default SchedulingScreen;
