import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type * as Leaflet from 'leaflet';
import './leaflet-map.css';
import { colors, type } from '@/theme';
import { initialMapCenter, type SalonMapProps } from './salon-map.types';

export function SalonMap({ value, current, focus, onChange }: SalonMapProps) {
  const container = useRef<HTMLDivElement>(null), map = useRef<Leaflet.Map | null>(null);
  const library = useRef<typeof Leaflet | null>(null), pin = useRef<Leaflet.Marker | null>(null), position = useRef<Leaflet.CircleMarker | null>(null);
  const callback = useRef(onChange);
  useEffect(() => { callback.current = onChange; }, [onChange]);
  const [ready, setReady] = useState(false), [error, setError] = useState(false);
  const initial = useRef(value ?? initialMapCenter);
  useEffect(() => {
    let active = true; let observer: ResizeObserver | null = null;
    void import('leaflet').then(L => {
      if (!active || !container.current) return;
      library.current = L;
      const m = L.map(container.current, { zoomControl: true }).setView([initial.current.latitude, initial.current.longitude], 16); map.current = m;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).on('tileerror', () => { if (active) setError(true); }).addTo(m);
      m.on('click', e => callback.current({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
      if (typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(() => m.invalidateSize()); observer.observe(container.current); }
      setReady(true); m.invalidateSize();
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; observer?.disconnect(); map.current?.remove(); map.current = null; pin.current = null; position.current = null; };
  }, []);
  useEffect(() => {
    const L = library.current, m = map.current; if (!ready || !L || !m) return;
    if (value) {
      if (pin.current) pin.current.setLatLng([value.latitude, value.longitude]);
      else {
        const icon = L.divIcon({ className: '', html: `<span style="display:block;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${colors.action};border:3px solid white;box-shadow:0 1px 5px #555"></span>`, iconSize: [28, 28], iconAnchor: [14, 28] });
        pin.current = L.marker([value.latitude, value.longitude], { draggable: true, icon, title: 'Salon location', alt: 'Salon pin: drag to adjust' }).addTo(m);
        pin.current.on('dragend', () => { const point = pin.current?.getLatLng(); if (point) callback.current({ latitude: point.lat, longitude: point.lng }); });
      }
    } else { pin.current?.remove(); pin.current = null; }
  }, [value, ready]);
  useEffect(() => {
    const L = library.current, m = map.current; if (!ready || !L || !m || !current) return;
    if (position.current) position.current.setLatLng([current.latitude, current.longitude]);
    else position.current = L.circleMarker([current.latitude, current.longitude], { radius: 7, color: '#155AA0', fillColor: '#2374CB', fillOpacity: 0.8 }).bindTooltip('Your current location').addTo(m);
  }, [current, ready]);
  useEffect(() => { if (ready && focus) map.current?.setView([focus.point.latitude, focus.point.longitude], 18, { animate: false }); }, [focus, ready]);
  return <View style={{ flex: 1 }}><div ref={container} role="region" aria-label="Salon location map" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />{error && <View style={{ position: 'absolute', top: 12, left: 54, right: 12, padding: 10, borderRadius: 10, backgroundColor: colors.background }}><Text accessibilityRole="alert" style={type.caption}>Map tiles could not load. Check your connection or try again. You can still use your current location.</Text></View>}</View>;
}
