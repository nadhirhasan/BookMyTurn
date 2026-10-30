import * as ImagePicker from 'expo-image-picker';
import { randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';
import { db } from './api';
export async function pickPhoto() { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .7, base64: true }); if (result.canceled)
  return null; const asset = result.assets[0]; if (!asset?.base64)
  throw new Error('Could not read this photo. Choose another image.'); if ((asset.fileSize ?? 0) > 2097152 || asset.base64.length > 2796204)
  throw new Error('Choose a photo smaller than 2 MB.'); return asset; }
export async function uploadPhoto(barber: string, asset: ImagePicker.ImagePickerAsset) { const client = db(); const { data, error } = await client.auth.getUser(); if (error || !data.user)
  throw new Error('Sign in before changing your photo.'); const bytes = Uint8Array.from(atob(asset.base64!), c => c.charCodeAt(0)); const mime = Platform.OS === 'web' ? asset.mimeType ?? 'image/jpeg' : 'image/jpeg'; const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[mime]; if (!extension)
  throw new Error('Choose a JPEG, PNG or WebP image.'); const path = `${data.user.id}/${barber}/${randomUUID()}.${extension}`; const result = await client.storage.from('barber-avatars').upload(path, bytes.buffer, { contentType: mime, upsert: false }); if (result.error)
  throw new Error('Could not upload your photo. Please retry.'); return { path, url: client.storage.from('barber-avatars').getPublicUrl(path).data.publicUrl }; }
export async function removePhoto(path: string) { await db().storage.from('barber-avatars').remove([path]); }
