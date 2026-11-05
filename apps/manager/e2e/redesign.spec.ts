import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fixture, login, seed } from './management-fixture';

test('manager and chair journey has reviewable mobile screens and one completion', async ({page},info)=>{
  const f=await fixture(page),salon=seed(),barber=randomUUID(),queue=randomUUID();
  const image=readFileSync(path.resolve(__dirname,'../../customer/assets/images/salon.jpg'));
  await page.route('**/staff-review.jpg',r=>r.fulfill({contentType:'image/jpeg',body:image}));
  const photo=`${info.project.use.baseURL}/staff-review.jpg`;
  salon.photo_url=photo;salon.waiting=1;salon.incoming=1;salon.pending=1;
  salon.barbers.push({id:barber,salon_id:salon.id,display_name:'Amir',bio:'Thoughtful cuts, friendly service.',photo_url:null,experience_years:5,specialities:['Fades'],is_active:true,availability:'available',service_ids:[]});
  salon.queues=[{id:queue,reference:'123456',customer_name:'Nadeem',mobile:null,service_id:null,status:'arrived',source:'qr',estimated_start:new Date().toISOString(),barber_id:barber,preferred_barber_id:null,assigned_barber_id:barber,created_at:new Date().toISOString(),arrived_at:new Date().toISOString()}, {id:randomUUID(),reference:'654321',customer_name:'Farhan',mobile:null,service_id:null,status:'joined',source:'remote',estimated_start:null,barber_id:barber,preferred_barber_id:barber,assigned_barber_id:barber,created_at:new Date().toISOString(),arrived_at:null}];
  salon.appointments=[{id:randomUUID(),reference:'112233',customer_name:'Ayaan',service_id:null,status:'pending',source:'appointment',requested_start:new Date(Date.now()+86400000).toISOString(),confirmed_start:null,barber_id:barber} as NonNullable<typeof salon.appointments>[number]];
  f.data.profile.display_name='Nadhir';f.data.salons.push(salon);
  f.references.push({id:randomUUID(),queue_entry_id:queue,appointment_id:null,note:'Keep some length on top.',viewed_at:null,collection_title:'My next haircut',images:[{id:randomUUID(),title:'Haircut reference',image_url:photo}]});
  await login(page);await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:info.outputPath('manager-home.png')});
  await page.getByRole('button',{name:`Manage ${salon.name}`,exact:true}).click();
  await expect(page.getByRole('button',{name:'Show Waiting',exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('salon-queue.png')});
  await page.getByRole('button',{name:'Agenda',exact:true}).click();await expect(page.getByRole('button',{name:'Confirm time',exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('salon-agenda.png')});
  await page.getByRole('button',{name:'Team',exact:true}).click();await expect(page.getByRole('button',{name:"Open Amir's chair",exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('salon-team.png')});
  await page.getByRole('button',{name:"Open Amir's chair",exact:true}).click();await expect(page.getByRole('heading',{name:/Your next customer.*right here/})).toBeVisible();
  await page.screenshot({path:info.outputPath('barber-queue.png')});
  await page.getByRole('button',{name:'Verify customer code',exact:true}).click();await expect(page.getByRole('img',{name:'Haircut reference',exact:true}).filter({visible:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('start-haircut.png')});
  await page.getByRole('button',{name:'Start haircut',exact:true}).click();await expect(page.getByRole('button',{name:'Finish Service',exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('active-haircut.png')});
  await page.getByRole('button',{name:'Finish Service',exact:true}).click();await page.getByLabel('Final price (Rs.)').fill('1250');
  await page.screenshot({path:info.outputPath('finish-haircut.png')});
  await page.getByRole('button',{name:'Complete haircut',exact:true}).click();await expect(page.getByRole('heading',{name:'Haircut completed.'})).toBeVisible();
  await page.screenshot({path:info.outputPath('haircut-complete.png')});
  expect(f.sessions).toHaveLength(1);expect(f.sessions[0]!.final_amount_minor).toBe(125000);
  await page.getByRole('button',{name:'Take a break',exact:true}).click();await page.getByRole('button',{name:'30 min',exact:true}).click();await expect(page.getByLabel('Break duration (minutes)',{exact:true})).toHaveValue('30');
  await page.screenshot({path:info.outputPath('barber-break.png')});
});

for(const size of [{width:320,height:640},{width:430,height:932},{width:844,height:390}]) test(`staff controls fit ${size.width}x${size.height} with larger text`,async({page},info)=>{
  await page.setViewportSize(size);await page.emulateMedia({reducedMotion:'reduce'});
  const f=await fixture(page),salon=seed(),id=randomUUID();
  salon.barbers.push({id,salon_id:salon.id,display_name:'A barber with a longer display name',bio:'',photo_url:null,experience_years:null,specialities:[],is_active:true,availability:'available',service_ids:[]});f.data.salons.push(salon);
  await login(page);await page.getByRole('button',{name:`Manage ${salon.name}`,exact:true}).click();await page.getByRole('button',{name:'Team',exact:true}).click();
  await page.evaluate(()=>document.querySelectorAll<HTMLElement>('div[dir="auto"]').forEach(el=>{el.style.fontSize=`${parseFloat(getComputedStyle(el).fontSize)*1.4}px`;el.style.lineHeight='1.4';}));
  await page.screenshot({path:info.outputPath('large-text-team.png')});
  const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll<HTMLElement>('div[dir="auto"]')).filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>innerWidth+1;}).map(el=>({text:el.textContent,right:el.getBoundingClientRect().right})));
  expect(overflow).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:"Open A barber with a longer display name's chair",exact:true}).click();
  await page.getByRole('button',{name:'Take a break',exact:true}).click();
  const action=page.getByRole('button',{name:'Start break',exact:true});await expect(action).toBeVisible();
  const rect=await action.boundingBox();expect(rect!.y+rect!.height).toBeLessThanOrEqual(size.height);
  await page.screenshot({path:info.outputPath('staff-break-layout.png')});
});

test('hours are chosen without typing, invalid closing times highlight and the draft is retained',async({page})=>{
  const f=await fixture(page),salon=seed();f.data.salons.push(salon);await login(page);
  await page.getByRole('button',{name:`Manage ${salon.name}`,exact:true}).click();await page.getByRole('button',{name:'Edit salon',exact:true}).click();
  await page.getByRole('button',{name:'Friday closes',exact:true}).click();await page.getByRole('button',{name:'Friday closes AM',exact:true}).click();await page.getByRole('button',{name:'Done choosing Friday closes',exact:true}).click();await page.getByRole('button',{name:'Save salon',exact:true}).click();
  await expect(page.getByRole('button',{name:'Friday closes',exact:true})).toHaveAttribute('aria-invalid','true');
  await expect(page.getByLabel('Salon name',{exact:true})).toHaveValue(salon.name);
  await page.getByRole('button',{name:'Friday closes',exact:true}).click();await page.getByRole('button',{name:'Friday closes PM',exact:true}).click();await page.getByRole('button',{name:'Friday closes hour 6',exact:true}).click();await page.getByRole('button',{name:'Friday closes minute 30',exact:true}).click();await page.getByRole('button',{name:'Done choosing Friday closes',exact:true}).click();await page.getByRole('button',{name:'Save salon',exact:true}).click();
  await expect(page.getByRole('heading',{name:salon.name,exact:true})).toBeVisible();expect(salon.hours[0]!.closes_at).toBe('18:30');
});
