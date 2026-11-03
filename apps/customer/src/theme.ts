import { StyleSheet } from 'react-native';
// Deliberately light, warm brand. Every customer screen uses this palette.
export const colors = {
  background: '#FFFCF8', card: '#FFFFFF', text: '#28241F', action: '#176B52', onAction: '#FFFFFF',
  muted: '#70665D', surface: '#F5EFE8', border: '#B8ACA0', divider: '#E6DDD4', canvas: '#EEE6DC',
  brandSoft: '#E6F1E8', green: '#23634B', mint: '#E3F2E8',
  amber: '#84510B', butter: '#FFF0C9', error: '#B42318', errorSurface: '#FFF0EE',
};
export const fonts = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold', bold: 'DMSans_700Bold' };
export const layout = { maxWidth: 560, gutter: 20 };
export const type = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 35, letterSpacing: -0.8, color: colors.text },
  section: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 27, letterSpacing: -0.3, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.text },
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.muted },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 18, letterSpacing: 1.2, color: colors.action },
});
