let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser=null;
let agents=[];

let selectedAgent=null;
let selectedType=null;

function signup(){
let u=username.value.trim();
let p=password.value;
if(!u||!p) return alert("املأ الحقول");
if(users[u]) return alert("المستخدم موجود");

users[u]={password:p,agents:[]};
localStorage.setItem("users",JSON.stringify(users));
alert("تم");
}

function login(){
let u=username.value.trim();
let p=password.value;

if(!users[u]||users[u].password!==p)
return alert("خطأ");

currentUser=u;
agents=users[u].agents;

authBox.style.display="none";
appBox.style.display="block";

render();
}

function logout(){
location.reload();
}

function save(){
users[currentUser].agents=agents;
localStorage.setItem("users",JSON.stringify(users));
}

function addAgent(){
let n=name.value.trim();
let t=type.value;
if(!n) return;

agents.push({name:n,type:t,cards:0,money:0,tips:0,debt:0,history:[]});

name.value="";
save();
render();
}

function openModal(i){
selectedAgent=i;
modalTitle.innerText="عملية لـ "+agents[i].name;
modal.classList.remove("hidden");
}

function closeModal(){
modal.classList.add("hidden");
valueInput.value="";
}

function chooseType(t){
selectedType=t;
}

function saveTransaction(){
let val=Number(valueInput.value);
if(!val) return;

let a=agents[selectedAgent];

if(selectedType==="cards"){
let price=a.type==="inside"?750:1500;
let money=val*price;
a.cards+=val;
a.money+=money;

a.history.push({cards:val,money:money,tip:0,debt:0,date:new Date().toISOString()});
}

if(selectedType==="money"){
a.money+=val;
a.history.push({cards:0,money:val,tip:0,debt:0,date:new Date().toISOString()});
}

if(selectedType==="tip"){
a.tips+=val;
a.money+=val;
a.history.push({cards:0,money:val,tip:val,debt:0,date:new Date().toISOString()});
}

if(selectedType==="debt"){
a.debt+=val;
a.history.push({cards:0,money:0,tip:0,debt:val,date:new Date().toISOString()});
}

save();
render();
closeModal();
}

function render(){
agentsList.innerHTML="";

let inside=0,outside=0,cards=0;

agents.forEach((a,i)=>{
cards+=a.cards;

if(a.type==="inside") inside+=a.money;
else outside+=a.money;

agentsList.innerHTML+=`
<li>
<b>${a.name}</b><br>
بطاقات:${a.cards}<br>
إكراميات:${a.tips}<br>
دين:${a.debt}<br>
مبلغ:${a.money}<br>

<button onclick="openModal(${i})">➕</button>
<button onclick="showStatement(${i})">كشف</button>
<button onclick="resetAgent(${i})">تصفير</button>
</li>
`;
});

insideTotal.innerText=inside;
outsideTotal.innerText=outside;
cardsTotal.innerText=cards;
}

function showStatement(i){
let a=agents[i];
let t="كشف "+a.name+"\n\n";

a.history.forEach(h=>{
t+=new Date(h.date).toLocaleString()+"\n";
t+="بطاقات:"+h.cards+"\n";
t+="مبلغ:"+h.money+"\n";
if(h.tip) t+="إكرامية:"+h.tip+"\n";
if(h.debt) t+="دين:"+h.debt+"\n";
t+="\n";
});

alert(t);
}

function resetAgent(i){
if(!confirm("تصفير؟")) return;
agents[i]={...agents[i],cards:0,money:0,tips:0,debt:0,history:[]};
save();
render();
}

function searchAgent(){
let s=search.value.toLowerCase();
document.querySelectorAll("#agents li").forEach(li=>{
li.style.display=li.innerText.toLowerCase().includes(s)?"block":"none";
});
}

function generateReport(){
let m=monthPicker.value;
if(!m) return alert("اختر شهر");

let [y,mo]=m.split("-");
mo--;

let html="<table class='report-table'><tr><th>مندوب</th><th>بطاقات</th><th>إكراميات</th><th>دين</th><th>مبلغ</th></tr>";

agents.forEach(a=>{
let c=0,mo2=0,t=0,d2=0;

a.history.forEach(h=>{
let d=new Date(h.date);
if(d.getFullYear()==y && d.getMonth()==mo){
c+=h.cards;
mo2+=h.money;
t+=h.tip||0;
d2+=h.debt||0;
}
});

html+=`<tr><td>${a.name}</td><td>${c}</td><td>${t}</td><td>${d2}</td><td>${mo2}</td></tr>`;
});

html+="</table>";

reportBox.innerHTML=html;
}

function exportPDF(){
let data=reportBox.innerHTML;

let w=window.open("");
w.document.write(`
<html dir="rtl">
<head>
<style>
body{font-family:Arial;padding:20px}
table{width:100%;border-collapse:collapse}
td,th{border:1px solid #000;padding:8px;text-align:center}
th{background:#1565c0;color:white}
</style>
</head>
<body>
<h2 style="text-align:center">التقرير الشهري</h2>
${data}
</body>
</html>
`);
w.print();
}