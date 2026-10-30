import {test,expect} from '@playwright/test';
import {mockDatabase,signInFixture,salonId,serviceId,barberId,queueId,appointmentId} from './fixtures';

test('archived catalogue records keep own appointment and queue history readable',async({page})=>{
 const {catalog}=await mockDatabase(page);catalog.salons=[];catalog.barbers=[];catalog.services=[];catalog.barber_services=[];
 const labels={salon_name:'Archived Studio',service_name:'Historical haircut',barber_name:'Retired Barber'};
 await page.route('**/rest/v1/rpc/customer_state',r=>r.fulfill({json:{queues:[{...labels,id:queueId,salon_id:salonId,service_id:serviceId,reference:'BMT-OLD-QUEUE',preferred_barber_id:barberId,assigned_barber_id:barberId,status:'completed',source:'remote',created_at:'2026-10-30T08:00:00Z',estimated_start:null}],appointments:[{...labels,id:appointmentId,salon_id:salonId,service_id:serviceId,reference:'BMT-OLD-APPOINTMENT',preferred_barber_id:barberId,confirmed_barber_id:barberId,status:'declined',requested_start:'2026-10-30T09:00:00Z',confirmed_start:null}],proposals:[],sessions:[],reviews:[],style_requests:[],notifications:[]}}));
 await signInFixture(page);await page.goto('/appointments');await expect(page.getByText('Archived Studio',{exact:true})).toBeVisible();await expect(page.getByText(/Historical haircut.*Retired Barber/)).toBeVisible();await expect(page.getByRole('button',{name:'Cancel appointment',exact:true})).toHaveCount(0);
 await page.goto('/queue');await expect(page.getByText('Archived Studio',{exact:true})).toBeVisible();await expect(page.getByText(/Retired Barber.*Historical haircut/)).toBeVisible();await expect(page.getByText('BMT-OLD-QUEUE',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Cancel queue entry',exact:true})).toHaveCount(0);
});
