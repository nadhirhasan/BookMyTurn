import { Redirect, useLocalSearchParams } from 'expo-router';
// This route also works in the exported web app: put its hosted URL on a salon QR.
export default function QrLanding() { const { slug } = useLocalSearchParams<{
  slug: string;
}>(); return <Redirect href={{ pathname: '/salon/[id]/join', params: { id: slug, source: 'qr' } }}/>; }
