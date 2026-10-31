import {useEffect,useState}from 'react';

import {ActivityIndicator,Image,Modal,Platform,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions}from 'react-native';

import {SafeAreaView}from 'react-native-safe-area-context';

import {ChevronLeft,ChevronRight,X}from 'lucide-react-native';

export type PreviewPhoto={id:string;title:string;storage_path?:string|null;image_url?:string|null;url?:string|null};

type Props={photos:PreviewPhoto[];index:number|null;onClose:()=>void;resolve:(photo:PreviewPhoto)=>Promise<string|null>};

export function PhotoViewer(props:Props){return props.index!==null&&props.photos.length?<ViewerSession {...props} initial={props.index}/>:null;}

function ViewerSession({photos,initial,onClose,resolve}:Props&{initial:number}){

 const [position,setPosition]=useState(Math.min(initial,photos.length-1));

 const [uri,setUri]=useState<string|null>(null),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);

 const window=useWindowDimensions(),[size,setSize]=useState({width:window.width,height:Math.max(200,window.height-160)});

 const photo=photos[Math.min(position,photos.length-1)]!;

 const {id,title,storage_path,image_url,url}=photo;

 useEffect(()=>{let active=true;setUri(null);setLoading(true);setFailed(false);void resolve({id,title,storage_path,image_url,url}).then(value=>{if(active){setUri(value);if(!value){setFailed(true);setLoading(false);}}},()=>{if(active){setFailed(true);setLoading(false);}});return()=>{active=false;};},[id,title,storage_path,image_url,url,resolve,retry]);

 useEffect(()=>{if(Platform.OS!=='web')return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='ArrowRight')setPosition(p=>Math.min(p+1,photos.length-1));if(e.key==='ArrowLeft')setPosition(p=>Math.max(0,p-1));};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[onClose,photos.length]);

 return <Modal visible animationType="none" presentationStyle="fullScreen" onRequestClose={onClose} supportedOrientations={['portrait','landscape']}><SafeAreaView style={s.screen}><View role="dialog" accessibilityLabel="Photo preview" accessibilityViewIsModal style={s.screen}>

 <View style={s.header}><View style={{flex:1,gap:4}}><Text numberOfLines={1} style={s.title}>{photo.title}</Text><Text style={s.caption}>{position+1} of {photos.length}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close photo preview" onPress={onClose} style={s.control}><X size={25} color="#292D29"/></Pressable></View>

 <View style={{flex:1}} onLayout={e=>setSize(e.nativeEvent.layout)}><ScrollView key={photo.id+':'+retry} maximumZoomScale={4} minimumZoomScale={1} centerContent showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{width:size.width,height:size.height}}>{uri&&!failed&&<Image testID="full-size-photo" accessibilityLabel={`Full image: ${photo.title}`} source={{uri}} resizeMode="contain" style={{width:size.width,height:size.height}} onLoad={()=>setLoading(false)} onError={()=>{setLoading(false);setFailed(true);}}/>}</ScrollView>{loading&&<View style={s.overlay}><ActivityIndicator accessibilityLabel="Loading full image" color="#292D29"/></View>}{failed&&<View style={s.overlay}><Text style={s.caption}>Could not load this photo.</Text><Pressable accessibilityRole="button" accessibilityLabel="Retry photo" onPress={()=>setRetry(v=>v+1)} style={s.retry}><Text style={s.title}>Retry</Text></Pressable></View>}</View>

 <View style={s.footer}><Pressable accessibilityRole="button" accessibilityLabel="Previous photo" disabled={position===0} onPress={()=>setPosition(p=>p-1)} style={[s.control,position===0&&s.disabled]}><ChevronLeft color="#292D29" size={25}/></Pressable><Text style={s.caption}>{position+1} / {photos.length}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next photo" disabled={position>=photos.length-1} onPress={()=>setPosition(p=>p+1)} style={[s.control,position>=photos.length-1&&s.disabled]}><ChevronRight color="#292D29" size={25}/></Pressable></View>

 </View></SafeAreaView></Modal>;

}

const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#FAFAF7'},header:{flexDirection:'row',alignItems:'center',padding:16,gap:12},title:{fontFamily:'DMSans_600SemiBold',fontSize:17,fontWeight:'600',color:'#292D29'},caption:{fontFamily:'DMSans_400Regular',fontSize:14,color:'#6C7069'},control:{width:48,height:48,alignItems:'center',justifyContent:'center',borderRadius:24},footer:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:10},disabled:{opacity:.25},overlay:{position:'absolute',top:0,right:0,bottom:0,left:0,alignItems:'center',justifyContent:'center',gap:12,backgroundColor:'#FAFAF7'},retry:{paddingHorizontal:24,paddingVertical:12,borderWidth:1,borderColor:'#D9DDD5',borderRadius:24}});

