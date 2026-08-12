/* Amirhm offline demo app. localStorage is NOT secure storage. */
const UKEY="amirhm_users", PKEY="amirhm_posts", SKEY="amirhm_session";
const $=id=>document.getElementById(id);
const read=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const hash=s=>btoa(unescape(encodeURIComponent(s))); // demo hash simulation only
const session=()=>localStorage.getItem(SKEY);
function ensure(){let u=read(UKEY); if(!u.some(x=>x.username==="admin")){u.push({username:"admin",password:hash("admin123"),admin:true});write(UKEY,u)}}
function requireLogin(){if(!session())location.href="login.html"}
function requireAdmin(){if(session()!=="admin")location.href="login.html"}
function logout(){localStorage.removeItem(SKEY);location.href="index.html"}
function seed(){let p=read(PKEY);if(!p.length){write(PKEY,[{id:crypto.randomUUID(),title:"Welcome to Amirhm",body:"This is an offline-first personal content demo. Create an account and publish your own posts.",author:"admin",date:new Date().toISOString()}])}}
function card(p,controls=false){return `<article class="card"><h3>${esc(p.title)}</h3><p>${esc(p.body).slice(0,240)}</p><p class="muted">by ${esc(p.author)} · ${new Date(p.date).toLocaleString()}</p>${controls?`<button onclick="editPost('${p.id}')">EDIT</button><button onclick="delPost('${p.id}')">DELETE</button>`:""}</article>`}
function renderHome(){let el=$("posts");if(el)el.innerHTML=read(PKEY).slice().reverse().map(p=>card(p)).join("")||"<p>No posts yet.</p>"}
function setupNav(){let s=session();$("authLink")?.classList.toggle("hidden",!!s);$("dashLink")?.classList.toggle("hidden",!s);$("adminLink")?.classList.toggle("hidden",s!=="admin");$("logout")?.addEventListener("click",logout)}
function delPost(id){if(!confirm("Delete this post?"))return;write(PKEY,read(PKEY).filter(p=>p.id!==id));location.reload()}
function editPost(id){let p=read(PKEY).find(x=>x.id===id);if(!p)return;$("postId").value=p.id;$("postTitle").value=p.title;$("postBody").value=p.body;$("cancelEdit").classList.remove("hidden");scrollTo(0,0)}
ensure();seed();setupNav();renderHome();

$("registerForm")?.addEventListener("submit",e=>{e.preventDefault();let n=$("username").value.trim(),pw=$("password").value,u=read(UKEY);if(u.some(x=>x.username.toLowerCase()===n.toLowerCase()))return $("msg").textContent="Username already exists.";u.push({username:n,password:hash(pw),admin:false});write(UKEY,u);$("msg").textContent="Account created. Redirecting...";setTimeout(()=>location.href="login.html",500)});
$("loginForm")?.addEventListener("submit",e=>{e.preventDefault();let n=$("username").value.trim(),pw=hash($("password").value),u=read(UKEY).find(x=>x.username===n&&x.password===pw);if(!u)return $("msg").textContent="Invalid credentials.";localStorage.setItem(SKEY,u.username);location.href=u.admin?"admin.html":"dashboard.html"});

if($("postForm")){requireLogin();let me=session();$("postForm").addEventListener("submit",e=>{e.preventDefault();let posts=read(PKEY),id=$("postId").value,title=$("postTitle").value.trim(),body=$("postBody").value.trim();if(id){let p=posts.find(x=>x.id===id&&x.author===me);if(p){p.title=title;p.body=body}}else posts.push({id:crypto.randomUUID(),title,body,author:me,date:new Date().toISOString()});write(PKEY,posts);location.reload()});$("cancelEdit").onclick=()=>location.reload();$("myPosts").innerHTML=read(PKEY).filter(p=>p.author===me).reverse().map(p=>card(p,true)).join("")||"<p>No posts yet.</p>"}

if($("allPosts")){requireAdmin();$("allPosts").innerHTML=read(PKEY).reverse().map(p=>card(p,true)).join("")||"<p>No posts.</p>";$("users").innerHTML=read(UKEY).map(u=>`<article class="card"><b>${esc(u.username)}</b><p class="muted">${u.admin?"ADMIN":"USER"}</p>${u.username!=="admin"?`<button onclick="deleteUser('${esc(u.username)}')">DELETE USER</button>`:""}</article>`).join("")}
function deleteUser(n){if(n==="admin")return;if(confirm("Delete user and their posts?")){write(UKEY,read(UKEY).filter(u=>u.username!==n));write(PKEY,read(PKEY).filter(p=>p.author!==n));location.reload()}}

$("chatForm")?.addEventListener("submit",e=>{e.preventDefault();let input=$("chatInput"),q=input.value.trim();if(!q)return;let log=$("chatLog");log.insertAdjacentHTML("beforeend",`<div class="user">&gt; ${esc(q)}</div>`);let replies=["Demo response: I can help you plan that.","Simulation mode: no real AI API is connected.","Interesting query. Try asking about Amirhm content.","Security note: this chat is entirely local."];setTimeout(()=>{log.insertAdjacentHTML("beforeend",`<div class="bot">AI: ${replies[Math.floor(Math.random()*replies.length)]}</div>`);log.scrollTop=log.scrollHeight},250);input.value=""});
