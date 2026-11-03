import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { mockDatabase, installAuthFixture, signInFixture, barberId } from './fixtures';

async function chooseTime(page: Page) {
  await page.getByRole('button', { name: 'Choose date 2026-10-31' }).click();
  await page.getByRole('button', { name: /^9:00\s*am$/i }).click();
  await page.getByRole('button', { name: 'Review appointment', exact: true }).click();
}
test('guest booking keeps chosen date time and barber through sign-in before submitting', async ({page}) => {
  const f=await mockDatabase(page),user=await installAuthFixture(page);
  await page.goto('/salon/royal-saloon/appointment');
  await page.getByRole('button',{name:'Change barber'}).click();
  await page.getByRole('button',{name:'Sameer',exact:true}).click();
  await chooseTime(page);
  await expect(page.getByText('This is a request.',{exact:false})).toBeVisible();
  expect(f.calls).toHaveLength(0);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).fill(user.email);
  await page.getByLabel('Password',{exact:true}).fill('Fixture password 123');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('button',{name:'Change date, time or barber'})).toBeVisible();
  await expect(page.getByText('Sameer',{exact:true}).filter({visible:true})).toBeVisible();
  await page.getByRole('button',{name:'Request Appointment',exact:true}).click();
  await expect(page.getByText('Pending salon confirmation',{exact:true})).toBeVisible();
  const command=f.calls.find(c=>c.action==='request_appointment')!;
  expect(command.data.starts_at).toBe('2026-10-31T03:30:00Z');
  expect(command.data.barber_id).toBe(barberId);
  expect(f.calls).toHaveLength(1);
});

test('review edits keep drafts and never submit until the final action', async ({page}) => {
  const f=await mockDatabase(page);await signInFixture(page);
  await page.goto('/salon/royal-saloon/appointment');await chooseTime(page);
  await page.getByLabel('Name (optional)',{exact:true}).fill('My visit');
  await page.getByRole('button',{name:'Change date, time or barber'}).click();
  await page.getByRole('button',{name:'Next month'}).click();
  await page.getByRole('button',{name:'Choose date 2026-11-01'}).click();
  await expect(page.getByRole('button',{name:/^9:30\s*am unavailable$/i})).toBeDisabled();
  await page.getByRole('button',{name:/^9:00\s*am$/i}).click();
  await page.getByRole('button',{name:'Review appointment'}).click();
  await expect(page.getByLabel('Name (optional)',{exact:true})).toHaveValue('My visit');
  expect(f.calls).toHaveLength(0);
  await page.getByRole('button',{name:'Request Appointment',exact:true}).click();
  await expect(page.getByText('Pending salon confirmation',{exact:true})).toBeVisible();
  expect(f.calls[0]!.data.starts_at).toBe('2026-11-01T03:30:00Z');
});

test('Home resumes an active visit and missing venue photos stay honest', async ({page}) => {
  const f=await mockDatabase(page);f.catalog.salons[0]!.photo_url=null;
  await signInFixture(page);await page.goto('/salon/royal-saloon');
  await expect(page.getByText('Photo coming soon',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Join Queue',exact:true}).click();
  await page.getByRole('button',{name:'Join Queue'}).click();
  await expect(page.getByText('184205',{exact:true})).toBeVisible();
  await page.goto('/');await page.getByRole('button',{name:'Track my queue'}).click();
  await expect(page.getByText('184205',{exact:true})).toBeVisible();
  expect(f.calls.filter(c=>c.action==='join_queue')).toHaveLength(1);
});

test('customer design review with realistic photo fixtures across the complete journey',async({page},info)=>{
  const f=await mockDatabase(page);
  const photo=readFileSync(path.resolve(__dirname,'../assets/images/salon.jpg'));
  await page.route('**/design-fixture.jpg',r=>r.fulfill({contentType:'image/jpeg',body:photo}));
  const photoUrl=`${info.project.use.baseURL}/design-fixture.jpg`;
  f.catalog.salons.forEach(salon=>{salon.photo_url=photoUrl;});
  f.catalog.salons[0]!.waiting=3;f.catalog.salons[0]!.earliest=new Date(Date.now()+45*60000).toISOString();
  f.collections.push({id:'design-c1',title:'My next haircut'},{id:'design-c2',title:'Summer ideas'});
  f.photos.push({id:'design-p1',collection_id:'design-c1',title:'Front view',image_url:photoUrl},{id:'design-p2',collection_id:'design-c1',title:'Side view',image_url:photoUrl},{id:'design-p3',collection_id:'design-c2',title:'Inspiration',image_url:photoUrl});
  await signInFixture(page);
  for(const [name,url] of [['home','/'],['salon','/salon/royal-saloon'],['barber',`/barber/${barberId}`],['gallery','/hairstyles'],['account','/account']] as const){
    await page.goto(url);await expect(page.getByRole('button',{name:name==='home'?'Account':'Go back',exact:true}).or(page.getByRole('button',{name:'New collection',exact:true})).first()).toBeVisible();
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:info.outputPath(`${name}.png`)});
  }
  await page.goto('/salon/royal-saloon/appointment');
  await expect(page.getByRole('button',{name:'Choose date 2026-10-31'})).toBeVisible();
  await page.screenshot({path:info.outputPath('calendar.png')});
  await chooseTime(page);
  expect(await page.evaluate(()=>({scroll:scrollY,height:document.documentElement.scrollHeight}))).toEqual({scroll:0,height:852});
  await page.screenshot({path:info.outputPath('review-request.png')});
  await page.getByRole('button',{name:'Request Appointment',exact:true}).click();
  await expect(page.getByText('Pending salon confirmation',{exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('bookings.png')});
  await page.goto('/salon/royal-saloon/join');
  await expect(page.getByRole('button',{name:'Join Queue'})).toBeVisible();
  await page.screenshot({path:info.outputPath('join.png')});
  await page.getByRole('button',{name:'Join Queue'}).click();
  await expect(page.getByText('184205',{exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('queue.png')});
});

for(const size of [{width:320,height:640},{width:430,height:932},{width:844,height:390}])
test(`calendar review fits ${size.width}x${size.height} and enlarged browser text`,async({page},info)=>{
  await page.setViewportSize(size);await page.emulateMedia({reducedMotion:'reduce'});
  await mockDatabase(page);await signInFixture(page);
  await page.goto('/salon/royal-saloon/appointment');await chooseTime(page);
  await page.evaluate(()=>{
    document.querySelectorAll<HTMLElement>('div[dir="auto"],input').forEach(el=>{
      const style=getComputedStyle(el);el.style.fontSize=`${parseFloat(style.fontSize)*1.5}px`;el.style.lineHeight='1.4';
    });
  });
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const submit=page.getByRole('button',{name:'Request Appointment',exact:true});
  await expect(submit).toBeVisible();const rect=await submit.boundingBox();
  expect(rect!.y+rect!.height).toBeLessThanOrEqual(size.height);
  await page.screenshot({path:info.outputPath('large-text-review.png')});
  await submit.click();await expect(page.getByText('Pending salon confirmation',{exact:true})).toBeVisible();
});
