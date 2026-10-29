import { StyleSheet } from 'react-native';
export const colors = { background: '#FFFFFF', text: '#1E1E1E', action: '#2C2C2C', muted: '#716F6B', surface: '#F6F5F2', border: '#D9D9D9', divider: '#E7E5E0', canvas: '#EDECE8' };
export const fonts = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold', bold: 'DMSans_700Bold' };
export const layout = { maxWidth: 480, gutter: 20 };
export const type = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 25, lineHeight: 32, color: colors.text },
  section: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 26, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.text },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted },
});
