import { Text, View } from 'react-native';
import { Chip } from './UI';
import { styles } from './CustomerUI';
import type { Catalog } from '@/lib/customer-types';
import { money } from '@/lib/customer-types';
import { type } from '@/theme';
export function VisitSelection({ catalog, salon, service, barber, onService, onBarber, optional = false }: {
  catalog: Catalog;
  salon: string;
  service: string | null;
  barber: string | null;
  onService: (value: string | null) => void;
  onBarber: (value: string | null) => void;
  optional?: boolean;
}) {
  const services = catalog.services.filter(s => s.salon_id === salon);
  const staff = catalog.barbers.filter(b => b.salon_id === salon && (!service || catalog.barber_services.some(bs => bs.barber_id === b.id && bs.service_id === service)));
  return <><Text style={type.section}>Choose a service{optional ? ' (optional)' : ''}</Text><View style={styles.row}>
 {optional && <Chip label="Decide at the salon" selected={!service} onPress={() => { onService(null); onBarber(null); }}/>}
 {services.map(s => <Chip key={s.id} label={`${s.name} · ${s.duration_minutes} min`} selected={service === s.id} onPress={() => { onService(s.id); if (barber && !catalog.barber_services.some(bs => bs.barber_id === barber && bs.service_id === s.id))
    onBarber(null); }}/>)}
</View>{services.filter(s => s.id === service).map(s => <Text key={s.id} style={type.caption}>Estimated {money(s.price_min_minor)}–{money(s.price_max_minor)}. Final price confirmed with your barber.</Text>)}
<Text style={type.section}>Choose a barber</Text><View style={styles.row}><Chip label="Any Available Barber" selected={!barber} onPress={() => onBarber(null)}/>{staff.map(b => <Chip key={b.id} label={b.display_name} selected={barber === b.id} onPress={() => onBarber(b.id)}/>)}</View>
<Text style={type.caption}>Any Available Barber uses the earliest suitable availability around hours, service duration, breaks, appointments and checked-in customers.</Text></>;
}
