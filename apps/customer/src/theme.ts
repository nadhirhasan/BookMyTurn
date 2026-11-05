import { StyleSheet } from 'react-native';
// Cream & Teal: the user's latest visual reference, shared by all three roles.
export const colors = {
 background:'#FCF6ED',card:'#FFFAF3',surface:'#FFFAF3',raised:'#F3E7D7',canvas:'#EEE2D3',
 text:'#17201F',muted:'#64665F',action:'#087F80',onAction:'#FFFFFF',
 border:'#E4DACE',divider:'#EEE4D8',brandSoft:'#E0EEEA',brandOverlay:'#FFFFFF26',onBrandMuted:'#DCEFEB',
 green:'#396C58',mint:'#E5F0E7',positive:'#396C58',positiveSoft:'#E5F0E7',
 amber:'#8C6525',butter:'#F4E6CF',pending:'#8C6525',pendingSoft:'#F4E6CF',
 error:'#A83D39',errorSurface:'#FCECE6',
 ticket:'#FFFFFF',ticketInk:'#191B16',ticketMuted:'#64665F',ticketDivider:'#E4DACE',
 photoScrim:'#152D2C88',onPhoto:'#FFFFFF',scrim:'#17201F88',
};
export const fonts={regular:'DMSans_400Regular',medium:'DMSans_500Medium',semibold:'DMSans_600SemiBold',bold:'DMSans_700Bold'};
export const layout={maxWidth:560,gutter:20};
export const motion={page:280,sheet:360,press:120,release:180};
export const shadows={card:'0 5px 18px rgba(91,67,38,0.07)'};
export const type=StyleSheet.create({
 title:{fontFamily:fonts.semibold,fontSize:30,lineHeight:37,letterSpacing:-0.9,color:colors.text},
 section:{fontFamily:fonts.bold,fontSize:18,lineHeight:25,letterSpacing:-0.4,color:colors.text},
 body:{fontFamily:fonts.regular,fontSize:14,lineHeight:22,color:colors.text},
 label:{fontFamily:fonts.semibold,fontSize:14,lineHeight:20,color:colors.text},
 caption:{fontFamily:fonts.regular,fontSize:12,lineHeight:18,color:colors.muted},
 eyebrow:{fontFamily:fonts.bold,fontSize:10,lineHeight:16,letterSpacing:1.5,color:colors.action},
});
