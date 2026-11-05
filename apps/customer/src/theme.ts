import { StyleSheet } from 'react-native';
// Approved Charcoal & Champagne foundation, shared by Customer and staff apps.
export const colors = {
  background: '#141613', card: '#20231E', surface: '#20231E', raised: '#2A2E26',
  text: '#F4F0E7', muted: '#B1B4A8', action: '#CBB58F', onAction: '#191B16',
  border: '#606954', divider: '#3D4336', canvas: '#10120F', brandSoft: '#252C20',
  green: '#B2C7A9', mint: '#29382A', amber: '#D5C598', butter: '#36362A',
  positive: '#B2C7A9', positiveSoft: '#29382A', pending: '#D5C598', pendingSoft: '#36362A',
  error: '#E3B6A0', errorSurface: '#3B2823',
  ticket: '#F4F0E7', ticketInk: '#191B16', ticketMuted: '#626C56', ticketDivider: '#D4D8C9',
  photoScrim: '#14161399', scrim: '#00000099',
};
export const fonts = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold', bold: 'DMSans_700Bold' };
export const layout = { maxWidth: 560, gutter: 20 };
export const motion = { page: 280, sheet: 360, press: 120 };
export const type = StyleSheet.create({
  title: { fontFamily: fonts.medium, fontSize: 32, lineHeight: 37, letterSpacing: -1.1, color: colors.text },
  section: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 25, letterSpacing: -0.4, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.text },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 16, letterSpacing: 1.8, color: colors.action },
});
