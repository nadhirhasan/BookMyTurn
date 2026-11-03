// Staff foundation aligned with the customer brand.
import { StyleSheet } from 'react-native';
const foundationColors = { background: '#FFFCF8', text: '#28241F', action: '#B83E28', muted: '#70665D', surface: '#F5EFE8', border: '#B8ACA0', divider: '#E6DDD4', canvas: '#EEE6DC' };
export const fonts = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold', bold: 'DMSans_700Bold' };
export const layout = { maxWidth: 560, gutter: 20 };
export const type = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 35, letterSpacing: -0.6, color: foundationColors.text },
  section: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 27, color: foundationColors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: foundationColors.text },
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: foundationColors.text },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: foundationColors.muted },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 18, letterSpacing: 1, color: foundationColors.action },
});

export const colors={...foundationColors,card:'#FFFFFF',onAction:'#FFFFFF',peach:'#FBE1D3',positive:'#23634B',positiveSoft:'#E3F2E8',pending:'#84510B',pendingSoft:'#FFF0C9',error:'#B42318',errorSurface:'#FFF0EE'};
