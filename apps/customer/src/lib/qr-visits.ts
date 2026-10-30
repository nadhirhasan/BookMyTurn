import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { getSupabaseClient } from './supabase/client';
import { customerError } from './customer-api';
import type { QueueEntry } from './customer-types';
type Receipt = {
  slug: string;
  token: string;
  key: string;
  id: string | null;
};
export type QrQueue = QueueEntry & {
  linked_to_account: boolean;
};
const storageKey = 'bookmyturn:qr-receipts:v1';
async function receipts(): Promise<Receipt[]> {
  const raw = await AsyncStorage.getItem(storageKey);
  if (!raw)
    return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((r): r is Receipt => !!r && typeof r === 'object' && typeof r.slug === 'string' && typeof r.token === 'string' && /^[0-9a-f-]{36}:[0-9a-f-]{36}$/.test(r.token) && typeof r.key === 'string' && (r.id === null || typeof r.id === 'string')) : [];
  }
  catch {
    return [];
  }
}
async function rpc(action: string, receipt: Receipt, data: Record<string, string | null> = {}) {
  const { client } = getSupabaseClient();
  if (!client)
    throw new Error('Could not connect to the salon.');
  const result = await client.rpc('qr_visit', { p_action: action, p_slug: receipt.slug, p_token: receipt.token, p_data: data });
  if (result.error)
    throw new Error(customerError(result.error));
  return result.data as QrQueue | null;
}
export async function readQrVisits() { const all = await receipts(); const rows = await Promise.all(all.filter(r => r.id).map(r => rpc('read', r))); return rows.filter((r): r is QrQueue => !!r); }
let joining = false;
export async function joinQr(slug: string, data: Record<string, string | null>) {
  if (joining)
    throw new Error('Please wait for this join request.');
  joining = true;
  try {
    const all = await receipts();
    let receipt = all.find(r => r.slug === slug);
    if (receipt?.id) {
      const old = await rpc('read', receipt);
      if (old && !['joined', 'arrived', 'in_service'].includes(old.status)) {
        all.splice(all.indexOf(receipt), 1);
        receipt = undefined;
      }
    }
    if (!receipt) {
      receipt = { slug, token: `${randomUUID()}:${randomUUID()}`, key: randomUUID(), id: null };
      all.push(receipt);
      await AsyncStorage.setItem(storageKey, JSON.stringify(all));
    }
    const result = await rpc('join', receipt, { ...data, request_key: receipt.key });
    if (!result)
      throw new Error('Could not join. Please retry.');
    receipt.id = result.id;
    await AsyncStorage.setItem(storageKey, JSON.stringify(all));
    return result;
  }
  finally {
    joining = false;
  }
}
export async function qrAction(id: string, action: 'cancel' | 'link') {
  const receipt = (await receipts()).find(r => r.id === id);
  if (!receipt)
    throw new Error('Visit receipt not found on this device.');
  return rpc(action, receipt);
}
