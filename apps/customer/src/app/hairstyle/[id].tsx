import { router, useLocalSearchParams } from 'expo-router';
import { Image, Text } from 'react-native';
import { Action, Screen } from '@/components/UI';
import { DataStatus, styles } from '@/components/CustomerUI';
import { useCustomer } from '@/providers/CustomerProvider';
import {useHaircutGallery}from '@/components/HaircutPicker';
import { type } from '@/theme';
export default function HairstyleDetails() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const { catalog } = useCustomer();const gallery=useHaircutGallery();
  const style = catalog?.hairstyles.find(h => h.id === id);
  return <Screen title={style?.title ?? 'Hairstyle'}><DataStatus />{style ? <><Image source={{ uri: style.image_url }} accessibilityLabel={style.title} style={[styles.photo, { height: 340 }]}/><Text accessibilityRole="header" style={type.title}>{style.title}</Text><Text style={type.caption}>{catalog?.categories.find(c => c.id === style.category_id)?.name}</Text><Action label={gallery.photos.some(p=>p.hairstyle_id===style.id)?'Saved to my photos':'Save to my photos'} disabled={gallery.busy||gallery.photos.some(p=>p.hairstyle_id===style.id)} onPress={()=>{if(gallery.signedIn)void gallery.save(style.id,style.title);else router.push({pathname:'/sign-in',params:{returnTo:'/hairstyles'}});}}/><Text style={type.caption}>{style.attribution}</Text>{gallery.error&&<Text accessibilityRole="alert" style={type.caption}>{gallery.error}</Text>}</> : catalog && <Text style={type.body}>This reference is not available.</Text>}</Screen>;
}
