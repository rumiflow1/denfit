import { atelierBase } from './AtelierBase.js';
import { ATELIER_CONFIG } from './AtelierAesthetics.js';
import { renderButton, renderLine, renderTrendingGrid } from './AtelierComponents.js';

export const getPromotionalEmail=(name:string,offerCode:string)=>{
 const code=offerCode?String(offerCode).replace(/[<>"']/g,''):'';
 const content=`<div style="font-size:10px;color:#D4AF37;letter-spacing:.28em;margin-bottom:16px;text-transform:uppercase;font-weight:700;">Private Access</div><h2 style="color:#0F0F0F;font-family:Georgia,'Times New Roman',serif;font-size:31px;font-weight:400;margin:0 0 18px;line-height:1.25;">A curated invitation for ${name.replace(/[<>"']/g,'')}</h2><p style="color:#555;line-height:1.8;font-size:15px;margin:0;">Discover the latest ${ATELIER_CONFIG.brandName} collection, selected for members of our private circle.</p>${code?`<div style="margin:26px 0;padding:20px;background:#FBF8F1;border:1px solid #D4AF37;text-align:center;"><div style="font-size:10px;color:#A78624;letter-spacing:.2em;text-transform:uppercase;font-weight:700;">Your offer code</div><div style="font-size:24px;letter-spacing:.18em;font-weight:700;margin-top:8px;">${code}</div></div>`:''}${renderLine()}${renderButton('Explore Collection','/products','#0A0A0A')}${renderTrendingGrid([])}`;
 return atelierBase(content,`${ATELIER_CONFIG.brandName} | Private collection invitation`,'#D4AF37');
};
