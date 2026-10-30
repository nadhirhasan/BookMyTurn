import { router, useLocalSearchParams } from 'expo-router';
import { Image, Text } from 'react-native';
import { Action, Notice, Screen } from '@/components/UI';
import { DataStatus, styles } from '@/components/CustomerUI';
import { useCustomer } from '@/providers/CustomerProvider';
import { type } from '@/theme';
export default function HairstyleDetails() {
  const { id, salon } = useLocalSearchParams<{
    id: string;
    salon?: string;
  }>();
  const { catalog } = useCustomer();
  const style = catalog?.hairstyles.find(h => h.id === id);
  return <Screen title={style?.title ?? 'Hairstyle'}><DataStatus />{style ? <><Image source={{ uri: style.image_url }} accessibilityLabel={style.title} style={[styles.photo, { height: 340 }]}/><Text accessibilityRole="header" style={type.title}>{style.title}</Text><Text style={type.caption}>{catalog?.categories.find(c => c.id === style.category_id)?.name}</Text><Notice>Use this image as a conversation starter. Your barber will confirm suitability and price.</Notice><Action label="Choose this reference" onPress={() => router.navigate({ pathname: '/hairstyles', params: { add: style.id, ...(salon ? { salon } : {}) } })}/><Text style={type.caption}>{style.attribution}</Text></> : catalog && <Text style={type.body}>This reference is not available.</Text>}</Screen>;
}
