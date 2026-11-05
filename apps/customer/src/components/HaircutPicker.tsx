import {router}from 'expo-router';
import {useState}from 'react';
import {Image,Pressable,ScrollView,Text,View}from 'react-native';
import {Check,FolderHeart}from 'lucide-react-native';
import {useHaircutCollections}from '@/hooks/useHaircutCollections';
import {resolveHaircutPhoto}from '@/lib/haircut-gallery';
import {PhotoViewer}from '../../../../shared/ui/PhotoViewer';
import {colors,type}from '@/theme';
export function HaircutPicker({value,onChange}:{value:string|null;onChange:(id:string|null)=>void}){
 const gallery=useHaircutCollections(),[preview,setPreview]=useState<string|null>(null);if(!gallery.signedIn)return null;
 const selected=gallery.collections.find(c=>c.id===value),show=gallery.collections.find(c=>c.id===preview);
 return <View style={{gap:10}}><Text style={type.label}>Haircut collection <Text style={type.caption}>(optional)</Text></Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10,paddingBottom:5}}><Pressable accessibilityRole="button" accessibilityLabel="No haircut collection" accessibilityState={{selected:!value}} onPress={()=>onChange(null)} style={{width:100,height:148,borderRadius:12,borderWidth:!value?2:1,borderColor:!value?colors.action:colors.divider,justifyContent:'center',alignItems:'center'}}><FolderHeart size={23} color={colors.muted}/><Text style={type.caption}>No collection</Text></Pressable>
 {gallery.collections.map(c=><View key={c.id} style={{width:118,borderRadius:12,overflow:'hidden',borderWidth:value===c.id?2:1,borderColor:value===c.id?colors.action:colors.divider}}><Pressable accessibilityRole="button" accessibilityLabel={`Preview ${c.title}`} disabled={!c.photos.length} onPress={()=>setPreview(c.id)} style={{height:94,backgroundColor:colors.surface}}>{c.photos[0]?.url?<Image source={{uri:c.photos[0].url}} style={{width:'100%',height:'100%'}}/>:<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><FolderHeart color={colors.muted}/></View>}<View style={{position:'absolute',bottom:4,right:4,backgroundColor:colors.card,paddingHorizontal:5,borderRadius:4}}><Text style={type.caption}>{c.photos.length} photos</Text></View></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Select ${c.title}`} accessibilityState={{selected:value===c.id}} disabled={!c.photos.length} onPress={()=>onChange(value===c.id?null:c.id)} style={{minHeight:50,flexDirection:'row',alignItems:'center',padding:7,gap:4,opacity:c.photos.length?1:.45}}><Text numberOfLines={2} style={[type.caption,{flex:1}]}>{c.title}</Text>{value===c.id&&<Check size={16} color={colors.text}/>}</Pressable></View>)}
 </ScrollView>{selected&&<Text style={type.caption}>{selected.photos.length} photos will be shared with your barber.</Text>}<Pressable accessibilityRole="button" accessibilityLabel="Manage haircut collections" onPress={()=>router.push('/hairstyles')} style={{alignSelf:'flex-start',minHeight:48,justifyContent:'center',paddingVertical:6}}><Text style={type.label}>My collections</Text></Pressable>
 {gallery.error&&<Text accessibilityRole="alert" style={{...type.caption,color:colors.error}}>{gallery.error}</Text>}<PhotoViewer key={gallery.uid} photos={show?.photos??[]} index={show?0:null} onClose={()=>setPreview(null)} resolve={resolveHaircutPhoto}/></View>;
}
