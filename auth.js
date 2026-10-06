(()=>{const $=s=>document.querySelector(s),L=()=>JSON.parse(localStorage.glowUsers||"[]");
{const U=L();[["Stackly Admin","admin@stackly.com","Admin@123","admin"],["Ananya Rao","user@stackly.com","User@123","user"]].forEach(d=>{if(!U.some(x=>x.email===d[1]))U.push({name:d[0],email:d[1],pwd:d[2],role:d[3]})});localStorage.glowUsers=JSON.stringify(U)}
const f=$("#authForm"),m=$("#msg"),say=(t,ok)=>{m.textContent=t;m.className="msg"+(ok?" ok":"")};
const s=JSON.parse(localStorage.glowSession||"null");if(s&&f.dataset.mode==="login")location.replace(s.role==="admin"?"admin.html":"user.html");
document.querySelectorAll(".eye").forEach(b=>b.addEventListener("click",()=>{const i=b.previousElementSibling.previousElementSibling||b.parentNode.querySelector("input");i.type=i.type==="password"?"text":"password";b.textContent=i.type==="password"?"Show":"Hide"}));
f.addEventListener("submit",e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f)),em=(d.email||"").trim().toLowerCase(),users=L();
if(f.dataset.mode==="login"){if(!em||!d.pwd)return say("Please enter your email and password.");
const k=users.find(x=>x.email===em),nm=k?k.name:em.split("@")[0].replace(/[._-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase()),rl=d.role==="admin"?"admin":"user";
localStorage.glowSession=JSON.stringify({name:nm,email:em,role:rl});say("Welcome back — opening your dashboard…",1);
setTimeout(()=>location.href=rl==="admin"?"admin.html":"user.html",700);}
else{if(!d.name.trim())return say("Please enter your name.");if(d.pwd.length<6)return say("Password needs at least 6 characters.");if(d.pwd!==d.pwd2)return say("Passwords do not match.");
if(users.some(x=>x.email===em))return say("This email is already registered.");
users.push({name:d.name.trim(),email:em,pwd:d.pwd,role:d.role});localStorage.glowUsers=JSON.stringify(users);
say("Account created! Taking you to login…",1);setTimeout(()=>location.href="login.html",1100);}});})();