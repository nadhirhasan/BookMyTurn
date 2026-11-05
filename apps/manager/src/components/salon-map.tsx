import { useEffect, useRef } from 'react';
import MapView, { Circle, Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { colors } from '@/theme';
import { initialMapCenter, type SalonMapProps } from './salon-map.types';

export function SalonMap({ value, current, focus, onChange }: SalonMapProps) {
  const map = useRef<MapView>(null), center = value ?? initialMapCenter;
  useEffect(() => { if (focus) map.current?.animateToRegion({ ...focus.point, latitudeDelta: 0.006, longitudeDelta: 0.006 }, 0); }, [focus]);
  return <MapView ref={map} style={StyleSheet.absoluteFill} accessibilityLabel="Salon location map" initialRegion={{ ...center, latitudeDelta: 0.012, longitudeDelta: 0.012 }} onMapReady={() => { if (focus) map.current?.animateToRegion({ ...focus.point, latitudeDelta: 0.006, longitudeDelta: 0.006 }, 0); }} onPress={e => onChange(e.nativeEvent.coordinate)} showsCompass toolbarEnabled={false}>
    {current && <Circle center={current} radius={12} fillColor="#2374CB99" strokeColor="#155AA0" strokeWidth={2} />}
    {value && <Marker coordinate={value} draggable title="Salon location" description="Drag to the salon entrance" pinColor={colors.action} onDragEnd={e => onChange(e.nativeEvent.coordinate)} />}
  </MapView>;
}
