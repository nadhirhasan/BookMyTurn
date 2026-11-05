import { CalendarCheck2 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, type } from '@/theme';
export function BrandBanner({subtitle='Find your next good haircut, without the wait.'}:{subtitle?:string}) {
 return <View style={{backgroundColor:colors.action,borderRadius:28,overflow:'hidden',paddingTop:25,paddingBottom:42,paddingHorizontal:24,alignItems:'center',gap:12}}><CalendarCheck2 size={46} color={colors.onAction} strokeWidth={1.8}/><Text style={{fontFamily:fonts.bold,fontSize:28,lineHeight:34,color:colors.onAction}}>BookMyTurn</Text><Text style={[type.body,{color:colors.onBrandMuted,textAlign:'center',maxWidth:260}]}>{subtitle}</Text><Svg pointerEvents="none" viewBox="0 0 400 40" preserveAspectRatio="none" width="100%" height={28} style={{position:'absolute',bottom:-1,left:0}}><Path d="M0 29 C80 -8 118 45 215 24 S333 -6 400 5 V40 H0Z" fill={colors.background}/></Svg></View>;
}
