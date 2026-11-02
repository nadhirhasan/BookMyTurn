import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { Action, Notice, Screen } from '@/components/UI';
import { Field, PrivateGate, styles, useRefreshOnFocus, useVisitAction } from '@/components/CustomerUI';
import { useCustomer } from '@/providers/CustomerProvider';
import { colors, type } from '@/theme';
export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const { catalog, visits } = useCustomer();
  useRefreshOnFocus();
  const session = visits.sessions.find(s => s.id === id);
  const already = visits.reviews.some(r => r.service_session_id === id);
  const [rating, setRating] = useState(0);
  const [submitted,setSubmitted]=useState(false);
  const [body, setBody] = useState('');
  const { run, error, busy } = useVisitAction();
  return <Screen title="Your review"><PrivateGate>{already ? <><Text accessibilityRole="header" style={type.title}>Thanks for your review.</Text><Action label="Back to Home" onPress={() => router.replace('/')}/></> : session?.status === 'completed' ? <>
<Text accessibilityRole="header" style={type.title}>How was your experience with {catalog?.barbers.find(b => b.id === session.barber_id)?.display_name ?? 'your barber'}?</Text><View style={[styles.row,submitted&&!rating&&{borderWidth:1,borderColor:'#B42318',borderRadius:12,padding:4}]}>{[1, 2, 3, 4, 5].map(n => <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} ★`} accessibilityState={{selected:rating===n}} onPress={()=>setRating(n)} style={{minWidth:48,minHeight:56,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:n<=rating?colors.butter:colors.surface}}><Star size={28} color={colors.amber} fill={n<=rating?colors.amber:'none'}/></Pressable>)}</View>{submitted&&!rating&&<Text accessibilityRole="alert" style={{...type.caption,color:'#B42318'}}>Choose a rating.</Text>}<Field label="Your review (optional)" value={body} onChange={setBody} maxLength={2000} multiline/>
<Notice>Your rating and review will be public on this salon and barber’s profile. Your account details are kept private.</Notice>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Action label={busy ? 'Submitting…' : 'Submit Review'} disabled={busy} onPress={() => {setSubmitted(true);if(!rating)return; void run('review', { id, rating, body }); }}/>
</> : <Text style={type.body}>You can review your own completed haircut once.</Text>}</PrivateGate></Screen>;
}
