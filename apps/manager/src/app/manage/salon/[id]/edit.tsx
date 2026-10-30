import { useLocalSearchParams } from 'expo-router';
import { useManager } from '@/providers/ManagerProvider';
import { ManagementScreen } from '@/components/ManagementUI';
import { SalonEditor } from '@/components/SalonEditor';
import { Note } from '@/components/UI';
export default function EditSalon() { const { id } = useLocalSearchParams<{
  id: string;
}>(); const { data } = useManager(); const salon = data?.salons.find(s => s.id === id); return <ManagementScreen title="Edit salon" back>{salon ? <SalonEditor key={salon.id} salon={salon}/> : <Note>This salon is unavailable in your account.</Note>}</ManagementScreen>; }
