import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {mockDatabase,signInFixture,barberId} from './fixtures';

async function settled(page:import('@playwright/test').Page){
 await page.evaluate(()=>document.fonts.ready);
 await expect.poll(()=>page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
 // RN Animated updates styles on animation frames rather than Web Animations.
 await expect.poll(()=>page.getByRole('heading').first().evaluate(el=>{let opacity=1;for(let p:Element|null=el;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);return opacity;})).toBe(1);
}
test('approved customer navigation, fixed actions, private decks and paper ticket use real records',async({page},info)=>{
 const f=await mockDatabase(page);await signInFixture(page);
 const photo=readFileSync(path.resolve(__dirname,'../assets/images/salon.jpg'));
 await page.route('**/charcoal-photo.jpg',r=>r.fulfill({contentType:'image/jpeg',body:photo}));
 f.catalog.salons.forEach(s=>{s.photo_url=`${info.project.use.baseURL}/charcoal-photo.jpg`;});
 f.collections.push({id:'dark-library',title:'My next haircut'});f.photos.push({id:'dark-photo',collection_id:'dark-library',title:'Front view',image_url:`${info.project.use.baseURL}/charcoal-photo.jpg`});
 await page.goto('/');await expect(page.getByRole('tab')).toHaveCount(4);await settled(page);
 for(const name of ['Explore','My visits','My photos','Account'])await expect(page.getByRole('tab',{name,exact:true})).toBeVisible();
 await page.screenshot({path:info.outputPath('customer-home.png')});
 await page.getByRole('button',{name:'View Royal Saloon',exact:true}).first().click();await expect(page).toHaveURL(/\/salon\/royal-saloon$/);await settled(page);
 const cta=page.getByRole('button',{name:'Join Queue',exact:true});await expect(cta).toBeVisible();
 const r=await cta.boundingBox();expect(r!.y+r!.height).toBeLessThanOrEqual(852);
 await page.screenshot({path:info.outputPath('salon-details.png')});
 await page.getByRole('button',{name:'Sameer',exact:true}).click();
 await page.getByRole('button',{name:'Request a time',exact:true}).click();await expect(page).toHaveURL(new RegExp(`barber=${barberId}`));await settled(page);
 await page.screenshot({path:info.outputPath('calendar.png')});
 await page.goto('/hairstyles');await expect(page.getByRole('button',{name:'Open collection My next haircut'})).toBeVisible();await settled(page);await page.screenshot({path:info.outputPath('collections.png')});
 await page.goto('/profile');await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible();await settled(page);await page.screenshot({path:info.outputPath('account.png')});
 await page.goto('/salon/royal-saloon/join');await page.getByRole('button',{name:'Join Queue',exact:true}).click();await settled(page);
 const code=page.getByText('184205',{exact:true});await expect(code).toBeVisible();await expect(code).toHaveCSS('color','rgb(25, 27, 22)');
 await page.screenshot({path:info.outputPath('queue-ticket.png')});
 expect(f.calls.filter(c=>c.action==='join_queue')).toHaveLength(1);
});
test('scan link shortcut stays inside the app and rejects unrelated or executable QR contents',async({page})=>{
 await mockDatabase(page);await page.goto('/scan');
 await page.getByLabel('Salon QR link',{exact:true}).fill('javascript:alert(1)');await page.getByRole('button',{name:'Open salon link'}).click();await expect(page.getByRole('alert')).toContainText('not a salon QR');
 await page.getByLabel('Salon QR link',{exact:true}).fill('https://bookmyturn.example/qr/royal-saloon');await page.getByRole('button',{name:'Open salon link'}).click();await expect(page).toHaveURL(/royal-saloon\/join\?source=qr/);await expect(page.getByRole('button',{name:'Join Queue'})).toBeVisible();
});
