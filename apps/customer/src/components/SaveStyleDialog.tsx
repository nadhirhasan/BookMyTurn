import {useState}from 'react';
import {Modal,ScrollView,Text}from 'react-native';
import {SafeAreaView}from 'react-native-safe-area-context';
import {Action}from './UI';
import {Field}from './CustomerUI';
import type {CollectionGallery}from '@/hooks/useHaircutCollections';
import {type}from '@/theme';
export function SaveStyleDialog({style,gallery,onClose}:{style:{id:string;title:string}|null;gallery:CollectionGallery;onClose:()=>void}){
 const [name,setName]=useState(''),[submitted,setSubmitted]=useState(false);
 if(!style)return null;
 const save=async(id:string)=>{if(await gallery.saveStyle(id,style.id,style.title))onClose();};
 return <Modal visible animationType="slide" onRequestClose={onClose}><SafeAreaView style={{flex:1,backgroundColor:'#fff'}}><ScrollView contentContainerStyle={{padding:20,gap:16}}><Text accessibilityRole="header" style={type.title}>Save to a collection</Text>{gallery.collections.map(c=><Action key={c.id} label={`Save to ${c.title}`} secondary disabled={gallery.busy||c.photos.length>=20} onPress={()=>{void save(c.id);}}/>)}<Field label="New collection name" value={name} onChange={setName} error={submitted&&!name.trim()?'Enter a collection name.':undefined}/><Action label="Create collection & save" disabled={gallery.busy} onPress={()=>{setSubmitted(true);if(name.trim())void gallery.create(name).then(id=>{if(id)void save(id);});}}/>{gallery.error&&<Text accessibilityRole="alert" style={{...type.caption,color:'#B42318'}}>{gallery.error}</Text>}<Action label="Cancel" secondary onPress={onClose}/></ScrollView></SafeAreaView></Modal>;
}
