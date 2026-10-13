/* Public Google Calendar snapshot, refreshed automatically by GitHub Actions. */
(() => {
 const zone='America/Edmonton';
 const calendarUrl='https://calendar.google.com/calendar/embed?src=046963d83f8556e8c4ef4fa33c72f92203bb73526b0cd63d9f7218aa33507e96%40group.calendar.google.com&ctz=America%2FEdmonton';
 let feed=null,state='loading';
 const text=(en,fr)=>lang==='fr'?fr:en;
 const key=date=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 const fromKey=value=>{const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d);};
 const onDay=day=>(feed?.events||[]).filter(e=>e.startDay<=day&&e.endDay>=day);
 function todayKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
 function when(event){
  const locale=lang==='fr'?'fr-CA':'en-CA';
  const dates=new Intl.DateTimeFormat(locale,{month:'short',day:'numeric',year:'numeric'});
  const first=dates.format(fromKey(event.startDay)),last=dates.format(fromKey(event.endDay));
  if(event.allDay)return (event.startDay===event.endDay?first:first+' – '+last)+' · '+text('All day','Toute la journée');
  const times=new Intl.DateTimeFormat(locale,{timeZone:zone,hour:'numeric',minute:'2-digit'});
  return first+' · '+times.format(new Date(event.start))+(event.start===event.end?'':' – '+(event.startDay===event.endDay?'':dates.format(fromKey(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(event.end))))+' · ')+times.format(new Date(event.end)));
 }
 function element(tag,value,className){const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;}
 function card(event,compact=false){
  const article=element('article','','calendar-event');
  article.append(element(compact?'h4':'h5',event.title),element('p',when(event),'event-time'));
  if(event.location)article.append(element('p',text('Location: ','Lieu : ')+event.location));
  if(!compact&&event.description){
   const description=element('p','','event-description');
   // Render event text safely; only HTTP(S) URLs become links.
   const pieces=event.description.split(/(https?:\/\/[^\s<>]+)/g);
   pieces.forEach(piece=>{if(/^https?:\/\//.test(piece)){const a=element('a',piece);a.href=piece;a.target='_blank';a.rel='noopener noreferrer';description.append(a);}else description.append(document.createTextNode(piece));});
   article.append(description);
  }
  if(compact){const button=element('button',text('View details','Voir les détails'),'event-details');button.type='button';button.addEventListener('click',()=>{selectedCalendarDate=fromKey(event.startDay<todayKey()?todayKey():event.startDay);calendarYear=selectedCalendarDate.getFullYear();calendarMonth=selectedCalendarDate.getMonth();renderCalendar();document.querySelector('#calendar-selection').focus();});article.append(button);}
  return article;
 }
 const originalRender=renderCalendar;
 renderCalendar=function(){
  originalRender();
  const selection=document.querySelector('#calendar-selection');if(!selection)return;
  selection.tabIndex=-1;
  document.querySelectorAll('.calendar-day').forEach(button=>{
   const events=onDay(key(new Date(calendarYear,calendarMonth,Number(button.dataset.day))));
   button.classList.toggle('has-events',events.length>0);
   if(events.length)button.setAttribute('aria-label',button.getAttribute('aria-label')+', '+events.length+text(' event(s)',' événement(s)'));
  });
  selection.querySelectorAll('p,.calendar-event').forEach(el=>el.remove());
  const day=key(selectedCalendarDate),events=onDay(day);
  let message='';
  if(state==='loading')message=text('Loading events…','Chargement des événements…');
  else if(state==='error')message=text('Events could not be loaded. Please use the live calendar link.','Impossible de charger les événements. Consultez le calendrier en direct.');
  else if(day<feed.windowStart||day>=feed.windowEnd)message=text('See the live calendar for events in this period.','Consultez le calendrier en direct pour les événements de cette période.');
  else if(!events.length)message=text('No events have been announced for this date.','Aucun événement n’est annoncé pour cette date.');
  if(message)selection.append(element('p',message));else events.forEach(event=>selection.append(card(event)));
  const upcoming=document.querySelector('#upcoming-events');upcoming.replaceChildren();
  const future=(feed?.events||[]).filter(e=>e.allDay?e.endDay>=todayKey():new Date(e.end)>=new Date()).slice(0,4);
  if(state==='ready'&&future.length)future.forEach(event=>upcoming.append(card(event,true)));
  else upcoming.append(element('p',state==='loading'?text('Loading upcoming events…','Chargement des événements à venir…'):state==='error'?text('Check the live calendar for upcoming events.','Consultez le calendrier en direct pour les événements à venir.'):text('New dates will appear here when announced. Follow our social channels for updates.','Les nouvelles dates seront affichées ici dès leur annonce. Suivez nos réseaux sociaux pour les nouvelles.')));
  const status=document.querySelector('#calendar-sync-status');status.hidden=!(feed&&Date.now()-Date.parse(feed.checkedAt)>48*60*60*1000);status.textContent=text('Calendar updates are delayed. Check the live calendar for the latest information.','La mise à jour du calendrier est retardée. Consultez le calendrier en direct pour les dernières informations.');
  document.querySelector('[data-public-calendar]').href=calendarUrl+'&hl='+lang;
 };
 async function load(){
  try{
   const response=await fetch('events.json',{cache:'no-cache',signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw new Error('Calendar request failed');
   const data=await response.json();
   const validDay=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
   if(data.version!==1||data.timeZone!==zone||!Array.isArray(data.events)||!Number.isFinite(Date.parse(data.checkedAt))||!validDay(data.windowStart)||!validDay(data.windowEnd)||!data.events.every(e=>typeof e.title==='string'&&typeof e.location==='string'&&typeof e.description==='string'&&typeof e.allDay==='boolean'&&validDay(e.startDay)&&validDay(e.endDay)&&Number.isFinite(Date.parse(e.start))&&Number.isFinite(Date.parse(e.end))))throw new Error('Invalid calendar data');
   feed=data;state='ready';
  }catch{state='error';}
  renderCalendar();
 }
 renderCalendar();load();
})();
