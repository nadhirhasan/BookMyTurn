import {test,expect} from '@playwright/test';
import {fixture,login,seed} from './management-fixture';
import {readFileSync} from 'node:fs';
import path from 'node:path';

for(const width of [320,393,430])test(`manager salon previews keep square photos and equal columns at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:852});await page.emulateMedia({reducedMotion:'reduce'});const f=await fixture(page);
 const photo=readFileSync(path.resolve(__dirname,'../../customer/assets/images/salon.jpg'));await page.route('**/square-salon.jpg',r=>r.fulfill({contentType:'image/jpeg',body:photo}));
 for(const name of ['Main Street Studio','Second Studio','Third Studio']){const s=seed();s.name=name;s.photo_url=`${info.project.use.baseURL}/square-salon.jpg`;f.data.salons.push(s);}
 await login(page);const cards=page.getByRole('button',{name:/^Manage .*Studio$/});await expect(cards).toHaveCount(3);await cards.first().scrollIntoViewIfNeeded();
 const a=await cards.nth(0).boundingBox(),b=await cards.nth(1).boundingBox(),last=await cards.last().boundingBox();expect(Math.abs(a!.y-b!.y)).toBeLessThan(1);expect(b!.x).toBeGreaterThan(a!.x+a!.width);expect(Math.abs(a!.width-last!.width)).toBeLessThan(1);
 const image=await cards.first().getByRole('img').boundingBox();expect(Math.abs(image!.width-image!.height)).toBeLessThan(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width===393)await page.screenshot({path:info.outputPath('manager-square-salons.png')});
 await cards.first().click();await expect(page.getByRole('heading',{name:'Main Street Studio',exact:true})).toBeVisible();
});
test('opening a manager workspace shows progress before any empty-state or CRUD controls',async({page})=>{
 const f=await fixture(page);f.data.salons.push(seed());let release!:()=>void;const gate=new Promise<void>(r=>release=r);
 await page.route('**/rest/v1/rpc/manager_state',async r=>{await gate;await r.fallback();});
 try{
  await page.goto('/');await page.getByLabel('Email address',{exact:true}).fill('manager@example.invalid');await page.getByLabel('Password',{exact:true}).fill('Fixture password 123');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByText('Opening your workspace…',{exact:true})).toBeVisible();await expect(page.getByText('Start with your first salon.',{exact:true})).toHaveCount(0);release();await expect(page.getByRole('button',{name:'Manage Main Street Studio',exact:true})).toBeVisible();
 }finally{release();}
});
