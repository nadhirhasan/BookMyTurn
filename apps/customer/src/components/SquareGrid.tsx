import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

// Equal columns without percentage rounding or an oversized final odd card.
export function SquareGrid({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return <View style={{ gap: 16 }}>{Array.from({ length: Math.ceil(items.length / 2) }, (_, row) =>
    <View key={row} style={{ flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
      <View style={{ flex: 1, minWidth: 0 }}>{items[row * 2]}</View>
      <View style={{ flex: 1, minWidth: 0 }}>{items[row * 2 + 1]}</View>
    </View>)}</View>;
}
