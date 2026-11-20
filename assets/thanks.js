/* Sends visitors to /thank-you after a successful FormSubmit AJAX request (site forms that use assets/script.js). Does not modify script.js. */
(function(w){
  "use strict";
  if(!w.fetch)return;
  var orig=w.fetch,gone=false;
  w.fetch=function(u){
    var p=orig.apply(this,arguments);
    try{
      if(typeof u==='string'&&u.indexOf('formsubmit.co/ajax/')>-1){
        p.then(function(r){
          if(r&&r.ok&&!gone){gone=true;setTimeout(function(){
            try{sessionStorage.setItem('ff_back',location.href)}catch(e){}
            location.href='thank-you.html?from='+encodeURIComponent(location.pathname);
          },1200);}
        }).catch(function(){});
      }
    }catch(e){}
    return p;
  };
})(window);
