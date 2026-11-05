import {test,expect,type Page} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {fixture,login,seed} from './management-fixture';
async function settled(page:Page){await page.evaluate(()=>document.fonts.ready);await expect.poll(()=>page.getByRole('heading').first().evaluate(el=>{let opacity=1;for(let p:Element|null=el;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);return opacity;})).toBe(1);}
test('approved owner overview shows database totals and scoped team invitations',async({page},info)=>{
 // RN Animated uses Date.now; the fixed report date must not freeze a screenshot mid-transition.
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.clock.setFixedTime(new Date('2026-11-05T08:00:00Z'));
 const f=await fixture(page),salon=seed(),barber=randomUUID();f.data.today='2026-11-05';salon.waiting=3;salon.in_service=1;salon.pending=2;
 salon.barbers.push({id:barber,salon_id:salon.id,display_name:'Amir',bio:'Thoughtful cuts.',photo_url:null,experience_years:5,specialities:[],is_active:true,availability:'available',service_ids:[]});f.data.salons.push(salon);
 const requests:{from:string;to:string}[]=[];
 await page.route('**/rest/v1/rpc/owner_finance',r=>{const {p_action,p_data:p}=r.request().postDataJSON();if(p_action!=='performance')return r.fallback();requests.push(p);const summary={revenue_minor:1240000,completed_count:8,adjustments_minor:0,average_sale_minor:155000,average_minutes:40};return r.fulfill({json:{today:p.to,from:p.from,to:p.to,summary,previous:{...summary,revenue_minor:1000000,completed_count:6},comparison_from:p.from,comparison_to:p.to,observed_at:new Date().toISOString(),daily:[{day:p.to,revenue_minor:1240000,completed_count:8}],weekly:[],team:[{id:barber,display_name:'Amir',salon_id:salon.id,salon_name:salon.name,photo_url:null,...summary}],salons:[{id:salon.id,name:salon.name,archived:false}]}});});
 await login(page);await expect(page.getByText('Completed haircut revenue',{exact:true}).locator('..').getByText('Rs. 12,400',{exact:true})).toBeVisible();await settled(page);await page.screenshot({path:info.outputPath('manager-dashboard.png')});
 await page.getByRole('button',{name:'This week',exact:true}).click();await expect.poll(()=>requests.at(-1)?.from).toBe('2026-11-02');
 await page.getByRole('button',{name:'Team workspace',exact:true}).click();await expect(page.getByText('Invitation needed',{exact:true})).toBeVisible();await settled(page);await page.screenshot({path:info.outputPath('manager-team.png')});
 await page.getByRole('button',{name:'Invite barber',exact:true}).click();await expect(page.getByRole('button',{name:'Create invitation',exact:true})).toBeVisible();await settled(page);await page.screenshot({path:info.outputPath('manager-invitation.png')});
});
test('approved barber chair exposes queue and personal metrics without requesting owner reports',async({page},info)=>{
 const f=await fixture(page),salon=seed(),barber=randomUUID();salon.waiting=1;
 salon.barbers.push({id:barber,salon_id:salon.id,display_name:'Amir',bio:'Thoughtful cuts.',photo_url:null,experience_years:5,specialities:[],is_active:true,availability:'available',service_ids:[]});salon.queues=[{id:randomUUID(),reference:'123456',customer_name:'Nadeem',mobile:null,service_id:null,status:'arrived',source:'remote',estimated_start:new Date().toISOString(),barber_id:barber,preferred_barber_id:barber,assigned_barber_id:barber,created_at:new Date().toISOString(),arrived_at:new Date().toISOString()}];f.data.salons.push(salon);
 await login(page);await page.getByRole('button',{name:`Manage ${salon.name}`,exact:true}).click();await page.getByRole('button',{name:'Team',exact:true}).click();await page.getByRole('button',{name:"Open Amir's chair",exact:true}).click();await expect(page.getByText('123456',{exact:true})).toBeVisible();await settled(page);await page.screenshot({path:info.outputPath('barber-chair.png')});
 let finances=0;await page.route('**/rest/v1/rpc/owner_finance',r=>{finances++;return r.fulfill({status:403,json:{code:'42501'}});});await page.getByRole('button',{name:'Refresh work',exact:true}).click();await expect(page.getByRole('button',{name:'Verify customer code',exact:true})).toBeEnabled();expect(finances).toBe(0);
});
