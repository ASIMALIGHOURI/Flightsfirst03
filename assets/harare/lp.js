(function(){
'use strict';
var POPUP_DELAY_MS=4000, EXIT_ARM_MS=8000, SITEKEY='0x4AAAAAAEKPlmkjvjqjjmRr';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){return null}}

/* DTR: swap keyword in H1 */
try{
  var kw=new URLSearchParams(location.search).get('keywords');
  if(kw){kw=kw.replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,90);
    if(kw){$$('[data-kw]').forEach(function(n){n.textContent=kw});}}
  var g=new URLSearchParams(location.search).get('gclid');
  var ms=new URLSearchParams(location.search).get('msclkid');if(ms&&$('#msclkid'))$('#msclkid').value=ms.slice(0,80);
  if(kw&&$('#kwField'))$('#kwField').value=kw;
  if(g){var f=$('#gclid');if(f)f.value=g;if(ls('ff_cookie_consent')==='accepted')ls('ff_gclid',g);}
  else if(ls('ff_cookie_consent')==='accepted'){var sg=ls('ff_gclid');if(sg&&$('#gclid'))$('#gclid').value=sg;}
}catch(e){}

/* dates */
var dep=$('#depart'),ret=$('#return'),panel=$('#more'),form=$('#quoteForm');
var t=new Date();t.setMinutes(t.getMinutes()-t.getTimezoneOffset());
var today=t.toISOString().slice(0,10);
dep.min=today;ret.min=today;
function open(){
  if(panel.classList.contains('open'))return;
  panel.classList.add('open');panel.removeAttribute('inert');
  loadTurnstile();
}
dep.addEventListener('change',function(){
  if(dep.value){ret.min=dep.value;if(ret.value&&ret.value<dep.value)ret.value='';open();}
});
ret.addEventListener('change',function(){if(ret.value)open();});
$$('input[name=trip]').forEach(function(r){r.addEventListener('change',function(){
  var one=r.value==='One way'&&r.checked;
  if(r.checked){ret.disabled=one;ret.closest('.fld').classList.toggle('off',one);if(one)ret.value='';}
});});

/* turnstile */
var tsLoaded=false,tsId=null;
function loadTurnstile(){
  if(tsLoaded)return;tsLoaded=true;
  window.onTsReady=function(){
    try{tsId=turnstile.render('#ts',{sitekey:SITEKEY,theme:'light',callback:function(tok){
      var i=$('input[name="cf-turnstile-response"]',form);if(i)i.value=tok;
      $('#sendBtn').disabled=false;
    },'expired-callback':function(){$('#sendBtn').disabled=true;}});}catch(e){$('#sendBtn').disabled=false;}
  };
  var s=document.createElement('script');
  s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTsReady';
  s.async=true;s.onerror=function(){$('#sendBtn').disabled=false;};
  document.head.appendChild(s);
  setTimeout(function(){if(!tsId)$('#sendBtn').disabled=false;},6000);
}

/* submit */
var done=false;
form.addEventListener('submit',function(e){
  e.preventDefault();
  var ph=$('#phone').value.replace(/[^\d+]/g,'');
  if(ph.length<9){$('#phone').focus();$('#msg').textContent='Please enter a valid phone number so we can call you back.';return;}
  if($('input[name=_honey]').value)return;
  var b=$('#sendBtn');b.disabled=true;b.textContent='Sending…';
  var fd=new FormData(form);
  fetch('https://formsubmit.co/ajax/info@luxfly.co.uk',{method:'POST',body:fd,headers:{Accept:'application/json'}})
  .then(function(r){if(!r.ok)throw 0;return r.json()})
  .then(function(d){if(d&&(d.success===false||d.success==='false'))throw 0;success()})
  .catch(function(){try{HTMLFormElement.prototype.submit.call(form)}catch(x){b.disabled=false;b.textContent='Get my free quote';$('#msg').textContent='Something went wrong. Please call 0203 981 0232.';}});
});
function success(){
  done=true;ss('hre_popup','1');
  form.innerHTML='<div class="ok" role="status"><svg class="ic"><use href="#i-check"/></svg><h3>Request received</h3><p>A flight expert will call you back shortly. Prefer to talk now? Call <a href="tel:02039810232">0203 981 0232</a>.</p></div>';
  closePop();
}

/* popup */
var pop=$('#pop'),lastFocus=null,shown=false;
function showPop(){
  if(shown||done||ss('hre_popup'))return;
  shown=true;ss('hre_popup','1');lastFocus=document.activeElement;
  pop.hidden=false;document.body.classList.add('lock');
  requestAnimationFrame(function(){pop.classList.add('in');var c=$('.pop-call',pop);if(c)c.focus();});
}
function closePop(){
  if(pop.hidden)return;pop.classList.remove('in');document.body.classList.remove('lock');
  setTimeout(function(){pop.hidden=true},200);
  if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}
}
$$('[data-close]',pop).forEach(function(n){n.addEventListener('click',closePop)});
pop.addEventListener('click',function(e){if(e.target===pop)closePop()});
$('#popCb').addEventListener('click',function(){closePop();var q=$('#quote');if(q)q.scrollIntoView({behavior:'smooth',block:'start'});});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape')closePop();
  if(e.key==='Tab'&&!pop.hidden){
    var f=$$('a[href],button',pop).filter(function(x){return x.offsetParent});
    if(!f.length)return;var a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
  }
});
var interacted=false,due=false;
function tryShow(){if(due&&interacted)showPop();}
['pointerdown','pointermove','touchstart','scroll','keydown'].forEach(function(e){window.addEventListener(e,function(){interacted=true;tryShow()},{once:true,passive:true})});
setTimeout(function(){due=true;tryShow()},POPUP_DELAY_MS);
var armed=false,moved=false;
document.addEventListener('mousemove',function(){moved=true},{once:true});
setTimeout(function(){armed=true},EXIT_ARM_MS);
document.documentElement.addEventListener('mouseleave',function(e){
  if(armed&&moved&&e.clientY<=0&&window.innerWidth>900)showPop();
});

/* free call back tab: show after first scroll, hide while the form is on screen */
var cbt=$('#cbtab');
if(cbt){var qd=$('#quote');
  function upd(){var y=window.scrollY||0,vis=y>500;
    if(vis&&qd){var r=qd.getBoundingClientRect();if(r.top<innerHeight*0.85&&r.bottom>innerHeight*0.15)vis=false;}
    cbt.classList.toggle('show',vis);}
  window.addEventListener('scroll',upd,{passive:true});upd();}


/* mobile: hide header on scroll down, show on scroll up */
(function(){var h=$('header.top');if(!h)return;var last=window.scrollY||0,tick=false;
function upd(){tick=false;var y=window.scrollY||0;if(window.innerWidth>700||y<80){h.classList.remove('hide-up');last=y;return}
h.classList.toggle('hide-up',y>=80);last=y}
window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});})();

/* cookie notice */
var cb=$('#cookieBanner');
if(cb){
  if(ls('ff_cookie_consent')){cb.hidden=true;}
  else{
    $('#cookieAccept').addEventListener('click',function(){ls('ff_cookie_consent','accepted');cb.hidden=true;});
    $('#cookieDecline').addEventListener('click',function(){ls('ff_cookie_consent','declined');cb.hidden=true;});
  }
}
})();
