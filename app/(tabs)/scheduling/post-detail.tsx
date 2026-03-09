import { useLocalSearchParams } from 'expo-router';
import SchedulingPostDetailScreen from '@/src/screens/scheduling/PostDetailScreen';

export default function PostDetailPage() {
  const { id } = useLocalSearchParams();
  return <SchedulingPostDetailScreen postId={id as string} />;
}
