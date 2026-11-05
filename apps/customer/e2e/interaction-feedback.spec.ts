import {test,expect} from '@playwright/test';
import {mockDatabase,signInFixture} from './fixtures';

for(const width of [320,393,430])test(`salon previews form two equal square-photo columns at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:852});await page.emulateMedia({reducedMotion:'reduce'});await mockDatabase(page);await page.goto('/salons');
 const cards=page.getByRole('button',{name:/^View /});await expect(cards).toHaveCount(13);
 const a=await cards.nth(0).boundingBox(),b=await cards.nth(1).boundingBox(),last=await cards.last().boundingBox();
 expect(Math.abs(a!.y-b!.y)).toBeLessThan(1);expect(b!.x).toBeGreaterThan(a!.x+a!.width);expect(Math.abs(a!.width-last!.width)).toBeLessThan(1);
 const photo=await cards.first().getByRole('img',{name:/photo$/}).boundingBox();expect(Math.abs(photo!.width-photo!.height)).toBeLessThan(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width===393)await page.screenshot({path:info.outputPath('customer-square-salons.png')});
});
test('salon skeletons precede records and press feedback respects reduced motion',async({page})=>{
 const f=await mockDatabase(page);let release!:()=>void;const gate=new Promise<void>(r=>release=r);
 await page.route('**/rest/v1/rpc/customer_catalog',async r=>{await gate;await r.fulfill({json:f.catalog});});
 try{
  await page.goto('/salons');await expect(page.getByText('Loading salons',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/^View /})).toHaveCount(0);
  release();await expect(page.getByRole('button',{name:/^View /})).toHaveCount(13);
  const chip=page.getByRole('button',{name:'Open now',exact:true});const box=await chip.boundingBox();await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height/2);await page.mouse.down();
  await expect.poll(()=>chip.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).a)).toBeLessThan(0.999);await page.mouse.up();await expect(chip).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, 0)');
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await expect(page.getByRole('button',{name:/^View /})).toHaveCount(13);const reduced=page.getByRole('button',{name:'Open now',exact:true}),r=await reduced.boundingBox();await page.mouse.move(r!.x+r!.width/2,r!.y+r!.height/2);await page.mouse.down();await expect(reduced).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, 0)');await page.mouse.up();
 }finally{release();await page.mouse.up();}
});
test('queue submission stays busy and disabled until one command completes',async({page})=>{
 const f=await mockDatabase(page);await signInFixture(page);let release!:()=>void;const gate=new Promise<void>(r=>release=r);
 await page.route('**/rest/v1/rpc/customer_command',async r=>{await gate;await r.fallback();});
 try{
  await page.goto('/salon/royal-saloon/join');await page.getByRole('button',{name:'Join Queue',exact:true}).click();const pending=page.getByRole('button',{name:'Joining…',exact:true});await expect(pending).toBeDisabled();await expect(pending).toHaveAttribute('aria-busy','true');expect(f.calls).toHaveLength(0);
  release();await expect(page.getByText('184205',{exact:true})).toBeVisible();expect(f.calls.filter(c=>c.action==='join_queue')).toHaveLength(1);
 }finally{release();}
});
test('private visits distinguish first loading, failed fetch, retry and genuinely empty state',async({page})=>{
 await mockDatabase(page);let release!:()=>void;const gate=new Promise<void>(r=>release=r);let fail=true;
 await page.route('**/rest/v1/rpc/customer_state',async r=>{await gate;if(fail)return r.fulfill({status:503,json:{message:'Fixture unavailable'}});return r.fallback();});
 try{
  await signInFixture(page);await page.getByRole('button',{name:'Explore salons',exact:true}).click();await page.goto('/visits');await expect(page.getByText('Loading your visits…',{exact:true})).toBeVisible();await expect(page.getByText('Nothing planned yet.',{exact:true})).toHaveCount(0);
  release();await expect(page.getByText('Could not load your visits. Refresh to try again.',{exact:true})).toBeVisible();await expect(page.getByText('Nothing planned yet.',{exact:true})).toHaveCount(0);
  fail=false;await page.getByRole('button',{name:'Refresh visits',exact:true}).click();await expect(page.getByText('Nothing planned yet.',{exact:true})).toBeVisible();
 }finally{release();}
});
