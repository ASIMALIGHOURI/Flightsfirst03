/* Airport autocomplete for From / To fields. Data: assets/harare/airports.json (OpenFlights, ODbL), loaded on first use. */
(function(){
  "use strict";
  var DATA=null,loading=null,LIST=[];
  var UKFIRST={LHR:1,LGW:1,STN:1,LTN:1,LCY:1,MAN:1,BHX:1,EDI:1,GLA:1,NCL:1,BRS:1,LBA:1,EMA:1};
  function load(cb){
    if(DATA)return cb();
    if(loading){loading.push(cb);return}
    loading=[cb];
    fetch('assets/harare/airports.json?v=1').then(function(r){return r.json()}).then(function(a){
      var cc={};a.forEach(function(r){(cc[r[1]]=cc[r[1]]||[]).push(r)});
      DATA=a.map(function(r){
        var multi=cc[r[1]].length>1,ctry=new Set(cc[r[1]].map(function(x){return x[3]})).size>1;
        var short=r[2].replace(/\s*(International|Airport|Intl)\s*/gi,' ').trim();
        var label=r[1];
        if(multi&&short&&short.toLowerCase()!==r[1].toLowerCase()&&!ctry)label=r[1]+' '+short;
        if(ctry)label=r[1]+', '+r[3];
        var txt=(r[0]+' '+r[1]+' '+r[2]+' '+r[3]).toLowerCase();
        return {i:r[0],c:r[1],n:r[2],k:r[3],v:label+' ('+r[0]+')',t:txt};
      });
      var q=loading;loading=null;q.forEach(function(f){f()});
    }).catch(function(){loading=null});
  }
  function search(q,isFrom){
    q=q.trim().toLowerCase();if(!q)return [];
    var out=[];
    DATA.forEach(function(a){
      var s=0,words=a.t.split(/[\s,\-\/()]+/);
      if(a.i.toLowerCase()===q)s=100;
      else if(a.c.toLowerCase().indexOf(q)===0)s=80;
      else if(a.v.toLowerCase().indexOf(q)===0)s=75;
      else if(words.some(function(w){return w.indexOf(q)===0}))s=55;
      else if(q.length>3&&a.c.toLowerCase().indexOf(q)>-1)s=20;
      if(!s)return;
      if(a.k==='United Kingdom')s+=isFrom?8:3;
      if(UKFIRST[a.i])s+=4;
      out.push([s,a]);
    });
    out.sort(function(x,y){return y[0]-x[0]||x[1].c.localeCompare(y[1].c)});
    return out.slice(0,8).map(function(x){return x[1]});
  }
  function attach(inp){
    if(inp.getAttribute('data-ac'))return;inp.setAttribute('data-ac','1');
    var isFrom=inp.name==='from';
    var wrap=inp.parentNode;if(getComputedStyle(wrap).position==='static')wrap.style.position='relative';
    var ul=document.createElement('ul');ul.className='ac-list';ul.setAttribute('role','listbox');ul.hidden=true;
    var id='ac'+Math.random().toString(36).slice(2,7);ul.id=id;wrap.appendChild(ul);
    inp.setAttribute('role','combobox');inp.setAttribute('aria-autocomplete','list');inp.setAttribute('aria-expanded','false');inp.setAttribute('aria-controls',id);inp.setAttribute('autocomplete','off');
    var items=[],act=-1;
    function close(){ul.hidden=true;inp.setAttribute('aria-expanded','false');act=-1}
    function pick(i){var a=items[i];if(!a)return;inp.value=a.v;close();inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}
    function paint(){
      ul.innerHTML='';
      items.forEach(function(a,i){
        var li=document.createElement('li');li.setAttribute('role','option');li.className=i===act?'on':'';
        var b=document.createElement('b');b.textContent=a.v;var s=document.createElement('small');s.textContent=a.n+' · '+a.k;
        li.appendChild(b);li.appendChild(s);
        li.addEventListener('mousedown',function(e){e.preventDefault();pick(i)});
        li.addEventListener('touchstart',function(e){e.preventDefault();pick(i)},{passive:false});
        ul.appendChild(li);
      });
      ul.hidden=!items.length;inp.setAttribute('aria-expanded',String(!!items.length));
    }
    function run(showAll){
      load(function(){
        var v=inp.value;
        if(showAll&&/\([A-Z]{3}\)\s*$/.test(v))v='';
        items=v?search(v,isFrom):(isFrom?['LHR','LGW','MAN','BHX','EDI','GLA','STN','LTN']:['DXB','IST','DEL','BOM','ISB','LHE','LOS','JNB']).map(function(c){return DATA.filter(function(a){return a.i===c})[0]}).filter(Boolean);
        act=-1;paint();
      });
    }
    inp.addEventListener('focus',function(){run(true);try{if(/\([A-Z]{3}\)\s*$/.test(inp.value))inp.select()}catch(e){}});
    inp.addEventListener('input',function(){run(false)});
    inp.addEventListener('blur',function(){setTimeout(close,120)});
    inp.addEventListener('keydown',function(e){
      if(ul.hidden)return;
      if(e.key==='ArrowDown'){e.preventDefault();act=Math.min(items.length-1,act+1);paint()}
      else if(e.key==='ArrowUp'){e.preventDefault();act=Math.max(0,act-1);paint()}
      else if(e.key==='Enter'&&act>-1){e.preventDefault();pick(act)}
      else if(e.key==='Escape'){close()}
    });
  }
  function init(){document.querySelectorAll('input[name="from"],input[name="to"]').forEach(attach)}
  if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init);
})();
