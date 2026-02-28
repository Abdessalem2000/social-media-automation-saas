import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Chip,
    IconButton,
    TextInput,
    useTheme
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
    createPostFailure,
    createPostStart,
    createPostSuccess
} from '../../store/slices/schedulingSlice';

const CreatePostScreen: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { accounts } = useSelector((state: RootState) => state.socialMedia);
  const { isLoading } = useSelector((state: RootState) => state.scheduling);

  const [formData, setFormData] = useState({
    content: '',
    platforms: [] as string[],
    scheduledDate: new Date(),
    scheduledTime: new Date(),
    mediaUrls: [] as string[],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Pre-select platforms if any are passed as params
    if (params.platforms) {
      const platforms = Array.isArray(params.platforms) 
        ? params.platforms 
        : [params.platforms as string];
      setFormData(prev => ({ ...prev, platforms }));
    }
  }, [params.platforms]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.content.trim()) {
      newErrors.content = t('scheduling.errors.contentRequired');
    } else if (formData.content.length > 2000) {
      newErrors.content = t('scheduling.errors.contentTooLong');
    }

    if (formData.platforms.length === 0) {
      newErrors.platforms = t('scheduling.errors.platformRequired');
    }

    if (new Date(formData.scheduledDate).getTime() < new Date().setHours(0, 0, 0, 0)) {
      newErrors.date = t('scheduling.errors.invalidDate');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreatePost = async () => {
    if (!validateForm()) return;

    dispatch(createPostStart());

    try {
      // Combine date and time
      const scheduledDateTime = new Date(
        formData.scheduledDate.getFullYear(),
        formData.scheduledDate.getMonth(),
        formData.scheduledDate.getDate(),
        formData.scheduledTime.getHours(),
        formData.scheduledTime.getMinutes()
      );

      // Create post object
      const newPost = {
        id: Date.now().toString(),
        content: formData.content,
        mediaUrls: selectedMedia.map(media => media.uri),
        platforms: formData.platforms,
        scheduledDate: scheduledDateTime.toISOString().split('T')[0],
        status: 'scheduled' as const,
        createdAt: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      dispatch(createPostSuccess(newPost));
      
      Alert.alert(
        t('scheduling.success'),
        t('scheduling.postScheduled'),
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } catch (error) {
      dispatch(createPostFailure(t('scheduling.errors.createFailed')));
      Alert.alert(t('common.error'), t('scheduling.errors.createFailed'));
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
    
    // Clear error for platforms
    if (errors.platforms) {
      setErrors(prev => ({ ...prev, platforms: '' }));
    }
  };

  const handleMediaPicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'mixed',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        setSelectedMedia(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('scheduling.errors.mediaPickFailed'));
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, scheduledDate: selectedDate }));
      if (errors.date) {
        setErrors(prev => ({ ...prev, date: '' }));
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({ ...prev, scheduledTime: selectedTime }));
    }
  };

  const updateContent = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => router.back()}
        />
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('scheduling.createPost')}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label={t('scheduling.content')}
            value={formData.content}
            onChangeText={updateContent}
            multiline
            numberOfLines={4}
            error={!!errors.content}
            style={styles.input}
            mode="outlined"
            placeholder={t('scheduling.contentPlaceholder')}
          />
          {errors.content && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.content}
            </Text>
          )}
          <Text style={[styles.charCount, { color: theme.colors.onSurfaceVariant }]}>
            {formData.content.length}/2000
          </Text>
        </Card.Content>
      </Card>

      {/* Media Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('scheduling.media')}
          </Text>
          
          {selectedMedia.length > 0 && (
            <View style={styles.mediaContainer}>
              {selectedMedia.map((media, index) => (
                <View key={index} style={styles.mediaItem}>
                  {media.type === 'image' ? (
                    <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                  ) : (
                    <View style={styles.videoPlaceholder}>
                      <IconButton icon="play-circle" size={40} />
                    </View>
                  )}
                  <IconButton
                    icon="close-circle"
                    style={styles.removeMediaBtn}
                    onPress={() => removeMedia(index)}
                  />
                </View>
              ))}
            </View>
          )}
          
          <Button
            mode="outlined"
            onPress={handleMediaPicker}
            style={styles.mediaBtn}
            icon="image"
          >
            {t('scheduling.addMedia')}
          </Button>
        </Card.Content>
      </Card>

      {/* Platform Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('scheduling.platforms')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t('scheduling.platformsSubtitle')}
          </Text>
          
          <View style={styles.platformsContainer}>
            {accounts.map(account => (
              <Chip
                key={account.id}
                selected={formData.platforms.includes(account.platform)}
                onPress={() => handlePlatformToggle(account.platform)}
                style={[
                  styles.platformChip,
                  formData.platforms.includes(account.platform) && {
                    backgroundColor: theme.colors.primary,
                  }
                ]}
                textStyle={{
                  color: formData.platforms.includes(account.platform)
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface,
                }}
                icon={account.platform.toLowerCase()}
              >
                {account.name}
              </Chip>
            ))}
          </View>
          {errors.platforms && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.platforms}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Scheduling */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('scheduling.schedule')}
          </Text>
          
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                {t('scheduling.date')}
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateBtn}
              >
                {formData.scheduledDate.toLocaleDateString()}
              </Button>
            </View>
            
            <View style={styles.scheduleItem}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                {t('scheduling.time')}
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                style={styles.dateBtn}
              >
                {formData.scheduledTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Button>
            </View>
          </View>
          
          {errors.date && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.date}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.cancelBtn}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        
        <Button
          mode="contained"
          onPress={handleCreatePost}
          loading={isLoading}
          disabled={isLoading}
          style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
        >
          {t('scheduling.schedulePost')}
        </Button>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.scheduledDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          value={formData.scheduledTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  card: {
    margin: 20,
    marginTop: 0,
    elevation: 2,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  mediaItem: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  videoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
  },
  mediaBtn: {
    marginBottom: 8,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformChip: {
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  scheduleItem: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  dateBtn: {
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
  },
  createBtn: {
    flex: 1,
  },
});

export default CreatePostScreen;
