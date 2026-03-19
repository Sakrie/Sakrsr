let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = null;
let agents = [];
let chartInstance = null;

function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

function showApp() {
  document.getElementById("authBox").style.display = "none";
  document.getElementById("appBox").style.display = "block";
}

function showAuth() {
  document.getElementById("authBox").style.display = "block";
  document.getElementById("appBox").style.display = "none";
}

function signup() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("املأ اسم المستخدم وكلمة المرور");
    return;
  }

  if (users[username]) {
    alert("اسم المستخدم موجود مسبقاً");
    return;
  }

  users[username] = {
    password: password,
    agents: []
  };

  saveUsers();
  alert("تم إنشاء الحساب بنجاح");
}

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("املأ اسم المستخدم وكلمة المرور");
    return;
  }

  if (!users[username] || users[username].password !== password) {
    alert("اسم المستخدم أو كلمة المرور غير صحيحة");
    return;
  }

  currentUser = username;
  agents = Array.isArray(users[username].agents) ? users[username].agents : [];

  showApp();
  render();
}

function logout() {
  currentUser = null;
  agents = [];
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  showAuth();
}

function save() {
  if (!currentUser) return;
  users[currentUser].agents = agents;
  saveUsers();
}

function addAgent() {
  if (!currentUser) {
    alert("سجل الدخول أولاً");
    return;
  }

  const nameInput = document.getElementById("name");
  const typeSelect = document.getElementById("type");

  const name = nameInput.value.trim();
  const type = typeSelect.value;

  if (!name) {
    alert("اكتب اسم المندوب");
    return;
  }

  agents.push({
    name: name,
    type: type,
    cards: 0,
    money: 0,
    history: []
  });

  nameInput.value = "";
  save();
  render();
}

function addCards(index) {
  if (!currentUser) {
    alert("سجل الدخول أولاً");
    return;
  }

  const value = prompt("عدد البطاقات");
  if (value === null) return;

  const cards = Number(value);

  if (!Number.isFinite(cards) || cards <= 0) {
    alert("اكتب عدداً صحيحاً أكبر من صفر");
    return;
  }

  const agent = agents[index];
  const price = agent.type === "inside" ? 750 : 1500;
  const money = cards * price;

  agent.cards += cards;
  agent.money += money;
  agent.history.push({
    cards: cards,
    money: money,
    date: new Date().toISOString()
  });

  save();
  render();
}

function resetAgent(index) {
  const agent = agents[index];

  if (!confirm(`هل تريد تصفير سجل وحساب ${agent.name} ؟`)) {
    return;
  }

  agent.cards = 0;
  agent.money = 0;
  agent.history = [];

  save();
  render();
}

function deleteAgent(index) {
  const agent = agents[index];

  if (!confirm(`هل تريد حذف ${agent.name} ؟`)) {
    return;
  }

  agents.splice(index, 1);
  save();
  render();
}

function showStatement(index) {
  const agent = agents[index];
  let totalCards = 0;
  let totalMoney = 0;

  let text = `كشف حساب: ${agent.name}\n\n`;

  if (!agent.history || agent.history.length === 0) {
    alert(`كشف حساب: ${agent.name}\n\nلا يوجد سجل`);
    return;
  }

  agent.history.forEach((item, i) => {
    totalCards += Number(item.cards || 0);
    totalMoney += Number(item.money || 0);

    const displayDate = new Date(item.date).toLocaleString("ar-IQ");

    text += `${i + 1}) ${displayDate}\n`;
    text += `البطاقات: ${item.cards}\n`;
    text += `المبلغ: ${item.money}\n\n`;
  });

  text += "------------------------\n";
  text += `مجموع البطاقات: ${totalCards}\n`;
  text += `مجموع المبلغ: ${totalMoney}`;

  alert(text);
}

function exportStatementPDF(index) {
  const agent = agents[index];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 15;
  let totalCards = 0;
  let totalMoney = 0;

  doc.setFontSize(16);
  doc.text(`Statement - ${agent.name}`, 10, y);
  y += 10;

  if (!agent.history || agent.history.length === 0) {
    doc.setFontSize(12);
    doc.text("No history", 10, y);
    doc.save(`${agent.name}_statement.pdf`);
    return;
  }

  doc.setFontSize(11);

  agent.history.forEach((item, i) => {
    if (y > 260) {
      doc.addPage();
      y = 15;
    }

    const displayDate = new Date(item.date).toLocaleString("ar-IQ");

    doc.text(`${i + 1}) ${displayDate}`, 10, y);
    y += 6;
    doc.text(`Cards: ${item.cards}`, 10, y);
    y += 6;
    doc.text(`Money: ${item.money}`, 10, y);
    y += 10;

    totalCards += Number(item.cards || 0);
    totalMoney += Number(item.money || 0);
  });

  if (y > 250) {
    doc.addPage();
    y = 15;
  }

  doc.text(`Total Cards: ${totalCards}`, 10, y);
  y += 8;
  doc.text(`Total Money: ${totalMoney}`, 10, y);

  doc.save(`${agent.name}_statement.pdf`);
}

function searchAgent() {
  const searchValue = document.getElementById("search").value.toLowerCase();
  const items = document.querySelectorAll("#agents li");

  items.forEach((li) => {
    const text = li.innerText.toLowerCase();
    li.style.display = text.includes(searchValue) ? "block" : "none";
  });
}

function drawChart(inside, outside) {
  const ctx = document.getElementById("chart");

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["داخل", "خارج"],
      datasets: [
        {
          data: [inside, outside]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function render() {
  const agentsList = document.getElementById("agents");
  const insideTotal = document.getElementById("insideTotal");
  const outsideTotal = document.getElementById("outsideTotal");
  const cardsTotal = document.getElementById("cardsTotal");

  agentsList.innerHTML = "";

  let inside = 0;
  let outside = 0;
  let totalCards = 0;

  agents.forEach((agent, index) => {
    totalCards += Number(agent.cards || 0);

    if (agent.type === "inside") {
      inside += Number(agent.money || 0);
    } else {
      outside += Number(agent.money || 0);
    }

    const li = document.createElement("li");
    li.innerHTML = `
      <b>${agent.name}</b><br>
      النوع: ${agent.type === "inside" ? "داخل" : "خارج"}<br>
      البطاقات: ${agent.cards}<br>
      المبلغ: ${agent.money}<br><br>

      <button type="button" onclick="addCards(${index})">➕ بطاقات</button>
      <button type="button" onclick="showStatement(${index})">📊 كشف</button>
      <button type="button" onclick="exportStatementPDF(${index})">📁 PDF</button>
      <button type="button" onclick="resetAgent(${index})">🔄 تصفير</button>
      <button type="button" onclick="deleteAgent(${index})">🗑 حذف</button>
    `;
    agentsList.appendChild(li);
  });

  insideTotal.textContent = inside;
  outsideTotal.textContent = outside;
  cardsTotal.textContent = totalCards;

  drawChart(inside, outside);
}

function resetAll() {
  if (!confirm("هل تريد تصفير كل المندوبين؟")) {
    return;
  }

  agents = [];
  save();
  render();
}

function generateReport() {
  const monthValue = document.getElementById("monthPicker").value;
  const reportBox = document.getElementById("reportBox");

  if (!monthValue) {
    alert("اختر الشهر أولاً");
    return;
  }

  const [yearStr, monthStr] = monthValue.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;

  let totalCards = 0;
  let totalMoney = 0;

  const reportData = agents.map((agent) => {
    let agentCards = 0;
    let agentMoney = 0;

    (agent.history || []).forEach((item) => {
      const d = new Date(item.date);

      if (!isNaN(d) && d.getFullYear() === year && d.getMonth() === month) {
        agentCards += Number(item.cards || 0);
        agentMoney += Number(item.money || 0);
      }
    });

    totalCards += agentCards;
    totalMoney += agentMoney;

    return {
      name: agent.name,
      cards: agentCards,
      money: agentMoney
    };
  });

  reportData.sort((a, b) => b.money - a.money);

  const best = reportData.length ? reportData[0] : null;
  const worst = reportData.length ? reportData[reportData.length - 1] : null;

  let html = `
    <h3>تقرير الشهر</h3>
    <table class="report-table">
      <thead>
        <tr>
          <th>#</th>
          <th>المندوب</th>
          <th>عدد البطاقات</th>
          <th>المبلغ</th>
          <th>النسبة</th>
        </tr>
      </thead>
      <tbody>
  `;

  reportData.forEach((row, i) => {
    const percent = totalMoney > 0 ? ((row.money / totalMoney) * 100).toFixed(1) : "0.0";
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${row.name}</td>
        <td>${row.cards}</td>
        <td>${row.money}</td>
        <td>${percent}%</td>
      </tr>
    `;
  });

  html += `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2">المجموع</td>
          <td>${totalCards}</td>
          <td>${totalMoney}</td>
          <td>100%</td>
        </tr>
      </tfoot>
    </table>

    <div class="report-summary">
      <p>أفضل مندوب: ${best ? best.name : "-"}</p>
      <p>أضعف مندوب: ${worst ? worst.name : "-"}</p>
    </div>
  `;

  reportBox.innerHTML = html;
}

function exportPDF() {
  const monthValue = document.getElementById("monthPicker").value;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 15;

  doc.setFontSize(16);
  doc.text("Monthly Report", 10, y);
  y += 10;

  let totalCards = 0;
  let totalMoney = 0;

  if (!monthValue) {
    alert("اختر الشهر أولاً");
    return;
  }

  const [yearStr, monthStr] = monthValue.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;

  agents.forEach((agent) => {
    let agentCards = 0;
    let agentMoney = 0;

    (agent.history || []).forEach((item) => {
      const d = new Date(item.date);

      if (!isNaN(d) && d.getFullYear() === year && d.getMonth() === month) {
        agentCards += Number(item.cards || 0);
        agentMoney += Number(item.money || 0);
      }
    });

    if (y > 260) {
      doc.addPage();
      y = 15;
    }

    doc.text(`Name: ${agent.name}`, 10, y);
    y += 6;
    doc.text(`Cards: ${agentCards}`, 10, y);
    y += 6;
    doc.text(`Money: ${agentMoney}`, 10, y);
    y += 10;

    totalCards += agentCards;
    totalMoney += agentMoney;
  });

  if (y > 250) {
    doc.addPage();
    y = 15;
  }

  doc.text(`Total Cards: ${totalCards}`, 10, y);
  y += 8;
  doc.text(`Total Money: ${totalMoney}`, 10, y);

  doc.save("report.pdf");
}

showAuth();