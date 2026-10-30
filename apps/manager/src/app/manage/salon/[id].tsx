import {useLocalSearchParams} from 'expo-router';
import {ManagementScreen} from '@/components/ManagementUI';
import {Note} from '@/components/UI';
import {useManager} from '@/providers/ManagerProvider';
import {SalonEditor} from '@/components/SalonEditor';
import {SalonOperations} from '@/components/SalonOperations';
export default function SalonDetail(){const {id,tab,focus}=useLocalSearchParams<{id:string;tab?:string;focus?:string}>();const {data}=useManager();const salon=data?.salons.find(s=>s.id===id);if(id==='new')return <ManagementScreen title="Add salon" back><SalonEditor/></ManagementScreen>;if(!salon)return <ManagementScreen title="Your salon" back><Note>This salon is unavailable in your account.</Note></ManagementScreen>;return <SalonOperations key={id+':'+(tab??'queue')+':'+(focus??'')} salon={salon} initialTab={tab} focus={focus}/>;}
