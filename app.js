const legacyRoutes={'#about':'about.html','#community':'cdylc.html','#leadership':'board.html','#resources':'resources.html','#contact':'contact.html'};if((location.pathname.endsWith('/')||location.pathname.endsWith('index.html'))&&legacyRoutes[location.hash]){location.replace(legacyRoutes[location.hash]);}
const languageButton=document.querySelector('#language');
const menu=document.querySelector('.menu');
const nav=document.querySelector('#nav');
let lang='en';
try{lang=localStorage.getItem('dyc-language')==='fr'?'fr':'en'}catch{}
function setLanguage(next){lang=next;document.documentElement.lang=lang;document.querySelectorAll('[data-en]').forEach(el=>{el.innerHTML=el.dataset[lang]});document.querySelectorAll('[data-alt-en]').forEach(el=>{el.alt=el.getAttribute('data-alt-'+lang)});languageButton.textContent=lang==='en'?'FR':'EN';languageButton.setAttribute('aria-label',lang==='en'?'Afficher le site en français':'View website in English');document.title=document.body.getAttribute('data-title-'+lang)||'DYC / JSC';try{localStorage.setItem('dyc-language',lang)}catch{};if(typeof renderCalendar==='function')renderCalendar();}
languageButton.addEventListener('click',()=>setLanguage(lang==='en'?'fr':'en'));
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus()}});


const calendarDate=new Date();let calendarYear=calendarDate.getFullYear();let calendarMonth=calendarDate.getMonth();let selectedCalendarDate=new Date(calendarYear,calendarMonth,calendarDate.getDate());
function renderCalendar(){
 const heading=document.querySelector('#calendar-month');if(!heading)return;
 const locale=lang==='fr'?'fr-CA':'en-CA';
 heading.textContent=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(new Date(calendarYear,calendarMonth,1));
 document.querySelector('#previous-month').setAttribute('aria-label',lang==='fr'?'Mois précédent':'Previous month');document.querySelector('#next-month').setAttribute('aria-label',lang==='fr'?'Mois suivant':'Next month');
 const weekdays=Array.from({length:7},(_,i)=>{const d=new Date(2024,0,7+i);return '<th scope="col"><abbr title="'+new Intl.DateTimeFormat(locale,{weekday:'long'}).format(d)+'">'+new Intl.DateTimeFormat(locale,{weekday:'short'}).format(d)+'</abbr></th>'});
 document.querySelector('#calendar-weekdays').innerHTML='<tr>'+weekdays.join('')+'</tr>';
 const offset=new Date(calendarYear,calendarMonth,1).getDay(),count=new Date(calendarYear,calendarMonth+1,0).getDate();let rows='';
 const now=new Date();
 for(let i=0;i<Math.ceil((offset+count)/7)*7;i++){
  if(i%7===0)rows+='<tr>';
  const day=i-offset+1;
  const today=day===now.getDate()&&calendarMonth===now.getMonth()&&calendarYear===now.getFullYear();
  const selected=day===selectedCalendarDate.getDate()&&calendarMonth===selectedCalendarDate.getMonth()&&calendarYear===selectedCalendarDate.getFullYear();
  const label=new Intl.DateTimeFormat(locale,{dateStyle:'full'}).format(new Date(calendarYear,calendarMonth,day));
  rows+=day<1||day>count?'<td></td>':'<td><button type="button" class="calendar-day" data-day="'+day+'" aria-label="'+label+'" aria-pressed="'+selected+'"'+(today?' aria-current="date"':'')+'>'+day+'</button></td>';
  if(i%7===6)rows+='</tr>';
 }
 document.querySelector('#calendar-days').innerHTML=rows;
 let selection=document.querySelector('#calendar-selection');
 if(!selection){selection=document.createElement('div');selection.id='calendar-selection';selection.className='calendar-selection';selection.setAttribute('role','status');selection.setAttribute('aria-live','polite');document.querySelector('.calendar').appendChild(selection);}
 const selectedLabel=new Intl.DateTimeFormat(locale,{dateStyle:'full'}).format(selectedCalendarDate);
 selection.replaceChildren();
 const title=document.createElement('h4');title.textContent=selectedLabel;
 const message=document.createElement('p');message.textContent=lang==='fr'?'Aucun événement n’est annoncé pour cette date.':'No events have been announced for this date.';
 selection.append(title,message);
}
function moveMonth(amount){const d=new Date(calendarYear,calendarMonth+amount,1);calendarYear=d.getFullYear();calendarMonth=d.getMonth();selectedCalendarDate=new Date(calendarYear,calendarMonth,1);renderCalendar()}
document.querySelector('#previous-month')?.addEventListener('click',()=>moveMonth(-1));document.querySelector('#next-month')?.addEventListener('click',()=>moveMonth(1));document.querySelector('#today-month')?.addEventListener('click',()=>{const today=new Date();calendarYear=today.getFullYear();calendarMonth=today.getMonth();selectedCalendarDate=new Date(calendarYear,calendarMonth,today.getDate());renderCalendar()});
document.querySelector('#calendar-days')?.addEventListener('click',event=>{const button=event.target.closest('button[data-day]');if(!button)return;const day=Number(button.dataset.day);selectedCalendarDate=new Date(calendarYear,calendarMonth,day);renderCalendar();document.querySelector('#calendar-days button[data-day="'+day+'"]').focus({preventScroll:true});});
setLanguage(lang);

const photoLinks=Array.from(document.querySelectorAll('[data-photo-index]'));
const photoViewer=document.querySelector('#photo-viewer');let activePhoto=0;let photoTrigger=null;
function showPhoto(index){activePhoto=(index+photoLinks.length)%photoLinks.length;const link=photoLinks[activePhoto];const img=link.querySelector('img');document.querySelector('#full-photo').src=link.getAttribute('href');document.querySelector('#full-photo').alt=img.alt;document.querySelector('#original-photo').href=link.getAttribute('href');document.querySelector('#photo-counter').textContent=(lang==='fr'?'Photo ':'Photo ')+(activePhoto+1)+(lang==='fr'?' sur ':' of ')+photoLinks.length;}
photoLinks.forEach((link,i)=>link.addEventListener('click',e=>{if(!photoViewer?.showModal)return;e.preventDefault();photoTrigger=link;showPhoto(i);photoViewer.showModal();document.body.style.overflow='hidden';document.querySelector('#close-photo').focus()}));
document.querySelector('#close-photo')?.addEventListener('click',()=>photoViewer.close());document.querySelector('#previous-photo')?.addEventListener('click',()=>showPhoto(activePhoto-1));document.querySelector('#next-photo')?.addEventListener('click',()=>showPhoto(activePhoto+1));
photoViewer?.addEventListener('close',()=>{document.body.style.overflow='';photoTrigger?.focus()});photoViewer?.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(activePhoto-1)}if(e.key==='ArrowRight'){e.preventDefault();showPhoto(activePhoto+1)}});

const dropdowns=Array.from(document.querySelectorAll('.about-dropdown'));
function setDropdown(group,open){group.querySelector('.about-toggle').setAttribute('aria-expanded',String(open));group.querySelector('.about-submenu').hidden=!open}
function openDropdown(group){dropdowns.forEach(other=>setDropdown(other,other===group))}
dropdowns.forEach(group=>{const button=group.querySelector('.about-toggle');const submenu=group.querySelector('.about-submenu');button.addEventListener('click',()=>{if(button.getAttribute('aria-expanded')==='true')setDropdown(group,false);else openDropdown(group)});group.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')openDropdown(group)});group.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')setDropdown(group,false)});button.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();openDropdown(group);submenu.querySelector('a').focus()}});group.addEventListener('keydown',e=>{if(e.key==='Escape'){setDropdown(group,false);button.focus()}});group.addEventListener('focusout',e=>{if(!group.contains(e.relatedTarget))setDropdown(group,false)})});
document.addEventListener('click',e=>{dropdowns.forEach(group=>{if(!group.contains(e.target))setDropdown(group,false)})});

const docButtons=Array.from(document.querySelectorAll('[data-doc]'));
function selectBylaws(doc){docButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.doc===doc)));document.querySelectorAll('.bylaw-document').forEach(el=>{el.hidden=el.id!=='bylaws-'+doc});}
docButtons.forEach(button=>button.addEventListener('click',()=>selectBylaws(button.dataset.doc)));
if(docButtons.length)selectBylaws(document.documentElement.lang==='fr'?'fr':'en');
document.querySelector('#bylaw-zoom')?.addEventListener('change',e=>{document.querySelectorAll('.bylaw-pages').forEach(el=>{el.style.width=e.target.value+'%'});document.querySelectorAll('.bylaw-page').forEach(el=>{el.style.maxWidth=e.target.value==='100'?'950px':'none'})});


// Keep the contact confirmation on the current GitHub Pages or custom-domain site.
const contactForm = document.querySelector('form[action="https://formsubmit.co/info@dycjsc.ca"]');
if (contactForm && /^https?:$/.test(window.location.protocol)) {
  const nextPage = document.createElement('input');
  nextPage.type = 'hidden';
  nextPage.name = '_next';
  nextPage.value = new URL('contact-thanks.html', window.location.href).href;
  contactForm.appendChild(nextPage);
}



// Camp-inspired entrances: a paced opening, then one-time scroll reveals.
(() => {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches) return;
  const active = new Map();
  const seen = new WeakSet();
  function reveal(element, delay = 0) {
    if (seen.has(element)) return;
    seen.add(element);
    if (preference.matches || element.contains(document.activeElement)) return;
    const photo = element.matches('.hero-image, .camp-grid > img');
    const from = photo ? 'scale(.97)' : 'translateY(32px)';
    const animation = element.animate([
      {opacity:0, transform:from}, {opacity:1, transform:'none'}
    ], {duration:photo ? 900 : 720, delay, easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards'});
    active.set(element, animation);
    animation.finished.then(() => active.delete(element), () => active.delete(element));
  }
  const observer = new IntersectionObserver(entries => {
    let order = 0;
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal(entry.target, Math.min(order++ * 90, 270));
      observer.unobserve(entry.target);
    });
  }, {rootMargin:'0px 0px -30px 0px', threshold:0});
  const targets = document.querySelectorAll('.hero-copy > *, .hero-image, .section-heading, .home-about > div, .who-overview, .who-history, .who-mission, .volunteer-section, .explore-card, .board-card, .directory-heading, .camp-grid > img');
  targets.forEach(element => {
    // Preserve direct anchor navigation and long-form policy reading.
    if (!element.closest('.policy-page') && (!location.hash || element.getBoundingClientRect().top >= innerHeight)) observer.observe(element);
  });
  document.addEventListener('focusin', event => {
    active.forEach((animation, element) => { if (element.contains(event.target)) animation.finish(); });
  });
  preference.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    active.forEach(animation => animation.finish());
  });
})();

// Bounded photo depth on larger screens; the page keeps its normal scrolling.
(() => {
  const frame = document.querySelector('.hero-image');
  const photo = frame?.querySelector('img');
  if (!photo) return;
  const allowed = matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
  let pending = false;
  function update() {
    pending = false;
    if (!allowed.matches) { photo.style.removeProperty('transform'); return; }
    const rect = frame.getBoundingClientRect();
    const shift = Math.max(-18, Math.min(18, (innerHeight / 2 - rect.top - rect.height / 2) * .055));
    photo.style.transform = 'translateY(' + shift.toFixed(2) + 'px) scale(1.08)';
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  allowed.addEventListener('change', update);
  update();
})();

// Animate intentional interactions only; retain native controls and focus.
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set();
  function track(animation) {
    active.add(animation);
    animation.finished.then(() => active.delete(animation), () => active.delete(animation));
    return animation;
  }
  preference.addEventListener('change', event => {
    if (event.matches) [...active].forEach(animation => animation.finish());
  });
  let calendarAnimation;
  const calendar = document.querySelector('.calendar');
  calendar?.addEventListener('click', event => {
    if (preference.matches || !calendar.animate) return;
    const month = event.target.closest('#previous-month, #next-month, #today-month');
    const day = event.target.closest('.calendar-day');
    if (!month && !day) return;
    calendarAnimation?.cancel();
    const target = document.querySelector(month ? '.calendar-table' : '#calendar-selection');
    if (target) calendarAnimation = track(target.animate([{opacity:.4},{opacity:1}], {duration:180,easing:'ease-out'}));
  });
  document.querySelectorAll('details.board-term, details.resource-region').forEach(details => {
    const summary = details.querySelector('summary');
    let animation = null;
    let targetOpen = details.open;
    summary.addEventListener('click', event => {
      if (preference.matches || !details.animate || event.defaultPrevented) return;
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      const next = animation ? !targetOpen : !details.open;
      if (animation) { animation.onfinish = null; animation.cancel(); }
      targetOpen = next;
      // Measure the exact destination including borders, without fixed heights.
      details.open = next;
      const end = details.getBoundingClientRect().height;
      details.open = true;
      animation = track(details.animate([{height:start+'px'},{height:end+'px'}], {duration:220,easing:'ease-out'}));
      animation.onfinish = () => { details.open = next; animation = null; };
    });
  });
})();

