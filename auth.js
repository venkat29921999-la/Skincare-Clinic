(()=>{
const $=s=>document.querySelector(s);
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||d)}catch(e){return JSON.parse(d)}};
const L=()=>read("glowUsers","[]");

/* demo accounts */
{const U=L();
[["Stackly Admin","admin@stackly.com","Admin@123","admin"],["Ananya Rao","user@stackly.com","User@123","user"]]
.forEach(d=>{if(!U.some(x=>x.email===d[1]))U.push({name:d[0],email:d[1],pwd:d[2],role:d[3]})});
localStorage.setItem("glowUsers",JSON.stringify(U));}

const f=$("#authForm"),m=$("#msg");
const say=(t,ok)=>{m.textContent=t;m.className="au-msg"+(ok?" ok":"")};
const home=r=>r==="admin"?"admin.html":"user.html";

/* already logged in -> go to dashboard */
const s=read("glowSession","null");
if(s&&f.dataset.mode==="login")location.replace(home(s.role));

/* show / hide password */
document.querySelectorAll(".au-eye").forEach(b=>b.addEventListener("click",()=>{
  const i=b.parentNode.querySelector("input");
  i.type=i.type==="password"?"text":"password";
  b.textContent=i.type==="password"?"Show":"Hide";
}));

/* remember me */
if(f.dataset.mode==="login"){
  const r=localStorage.getItem("glowRemember");
  if(r){f.email.value=r;f.remember.checked=true}
}

/* social buttons (placeholder) */
document.querySelectorAll(".au-soc").forEach(b=>b.addEventListener("click",()=>say(b.dataset.soc+" login is coming soon.")));

f.addEventListener("submit",e=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(f)),
        em=(d.email||"").trim().toLowerCase(),
        users=L(),
        role=d.role==="admin"?"admin":"user";

  if(f.dataset.mode==="login"){
    if(!em||!d.pwd)return say("Please enter your email and password.");
    /* any email + password works; the chosen role (Client/Admin) decides the dashboard */
    const u=users.find(x=>x.email===em),
          nm=u?u.name:(em.split("@")[0].replace(/\d+/g,"").replace(/[._-]+/g," ").trim().replace(/\b\w/g,c=>c.toUpperCase())||em);
    if(d.remember)localStorage.setItem("glowRemember",em);else localStorage.removeItem("glowRemember");
    localStorage.setItem("glowSession",JSON.stringify({name:nm,email:em,role}));
    say("Welcome back — opening your dashboard…",1);
    setTimeout(()=>location.href=home(role),700);
  }else{
    if(!(d.name||"").trim())return say("Please enter your name.");
    if(!em)return say("Please enter your email address.");
    if((d.pwd||"").length<6)return say("Password needs at least 6 characters.");
    if(d.pwd!==d.pwd2)return say("Passwords do not match.");
    /* same email can sign up any number of times: the account is simply updated */
    const rec={name:d.name.trim(),email:em,pwd:d.pwd,role},i=users.findIndex(x=>x.email===em);
    if(i>-1)users[i]=rec;else users.push(rec);
    localStorage.setItem("glowUsers",JSON.stringify(users));
    say("Account created! Taking you to login…",1);
    setTimeout(()=>location.href="login.html",1100);
  }
});
})();