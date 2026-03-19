let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = null;
let agents = [];
let chartInstance = null;

let selectedAgentIndex = null;
let selectedTransactionType = null;

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
    tips: 0,
    history: []
  });

  nameInput.value = "";
  save();
  render();
}

function openTransactionModal(index) {
  if (!currentUser) {
    alert("سجل الدخول أولاً");
    return;
  }

  selectedAgentIndex = index;
  selectedTransactionType = null;

  const agent = agents[index];
  document.getElementById("modalAgentName").textContent = `إضافة عملية للمندوب: ${agent.name}`;
  document.getElementById("transactionLabel").textContent = "اختر نوع العملية أولاً";
  document.getElementById("transactionValue").value = "";
  document.getElementById("transactionValue").placeholder = "أدخل القيمة";
  document.getElementById("transactionModal").classList.remove("hidden");
}

function closeTransactionModal() {
  selectedAgentIndex = null;
  selectedTransactionType = null;
  document.getElementById("transactionValue").value = "";
  document.getElementById("transactionModal").classList.add("hidden");
}

function selectTransactionType(type) {
  selectedTransactionType = type;
  const label = document.getElementById("transactionLabel");
  const input = document.getElementById("transactionValue");

  if (type === "cards") {
    label.textContent = "عدد البطاقات";
    input.placeholder = "أدخل عدد البطاقات";
  } else if (type === "money") {
    label.textContent = "المبلغ المباشر";
    input.placeholder = "أدخل المبلغ";
  } else if (type === "tip") {
    label.textContent = "الإكرامية";
    input.placeholder = "أدخل الإكرامية";
  }

  input.focus();
}

function saveTransaction() {
  if (selectedAgentIndex === null) {
    alert("لم يتم اختيار مندوب");
    return;
  }

  if (!selectedTransactionType) {
    alert("اختر نوع العملية");
    return;
  }

  const value = Number(document.getElementById("transactionValue").value);

  if (!Number.isFinite(value) || value <= 0) {
    alert("أدخل قيمة صحيحة أكبر من صفر");
    return;
  }

  const agent = agents[selectedAgentIndex];

  if (selectedTransactionType === "cards") {
    const price = agent.type === "inside" ? 750 : 1500;
    const money = value * price;

    agent.cards += value;
    agent.money += money;

    agent.history.push({
      operationType: "cards",
      cards: value,
      money: money,
      tip: 0,
      date: new Date().toISOString()
    });
  } else if (selectedTransactionType === "money") {
    agent.money += value;

    agent.history.push({
      operationType: "money",
      cards: 0,
      money: value,
      tip: 0,
      date: new Date().toISOString()
    });
  } else if (selectedTransactionType === "tip") {
    agent.tips = Number(agent.tips || 0) + value;
    agent.money += value;

    agent.history.push({
      operationType: "tip",
      cards: 0,
      money: value,
      tip: value,
      date: new Date().toISOString()
    });
  }

  save();
  render();
  closeTransactionModal();
}

function resetAgent(index) {
  const agent = agents[index];

  if (!confirm(`هل تريد تصفير سجل وحساب ${agent.name} ؟`)) {
    return;
  }

  agent.cards = 0;
  agent.money = 0;
  agent.tips = 0;
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

function getOperationLabel(item) {
  if (item.operationType === "cards") return "بطاقات";
  if (item.operationType === "money") return "مبلغ مباشر";
  if (item.operationType === "tip") return "إكرامية";
  return "عملية";
}

function showStatement(index) {
  const agent = agents[index];
  let totalCards = 0;
  let totalMoney = 0;
  let totalTips = 0;

  let text = `كشف حساب: ${agent.name}\n\n`;

  if (!agent.history || agent.history.length === 0) {
    alert(`كشف حساب: ${agent.name}\n\nلا يوجد سجل`);
    return;
  }

  agent.history.forEach((item, i) => {
    totalCards += Number(item.cards || 0);
    totalMoney += Number(item.money || 0);
    totalTips += Number(item.tip || 0);

    const displayDate = new Date(item.date).toLocaleString("ar-IQ");
    const label = getOperationLabel(item);

    text += `${i + 1}) ${displayDate}\n`;
    text += `النوع: ${label}\n`;
    text += `البطاقات: ${item.cards || 0}\n`;
    text += `المبلغ: ${item.money || 0}\n`;

    if (Number(item.tip || 0) > 0) {
      text += `الإكرامية: ${item.tip}\n`;
    }

    text += `\n`;
  });

  text += "------------------------\n";
  text += `مجموع البطاقات: ${totalCards}\n`;
  text += `مجموع الإكراميات: ${totalTips}\n`;
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
  let totalTips = 0;

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
    if (y > 250) {
      doc.addPage();
      y = 15;
    }

    const displayDate = new Date(item.date).toLocaleString("ar-IQ");
    const label = getOperationLabel(item);

    doc.text(`${i + 1}) ${displayDate}`, 10, y);
    y += 6;
    doc.text(`Type: ${label}`, 10, y);
    y += 6;
    doc.text(`Cards: ${item.cards || 0}`, 10, y);
    y += 6;
    doc.text(`Money: ${item.money || 0}`, 10, y);
    y += 6;

    if (Number(item.tip || 0) > 0) {
      doc.text(`Tip: ${item.tip}`, 10, y);
      y += 6;
    }

    y += 4;

    totalCards += Number(item.cards || 0);
    totalMoney += Number(item.money || 0);
    totalTips += Number(item.tip || 0);
  });

  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  doc.text(`Total Cards: ${totalCards}`, 10, y);
  y += 8;
  doc.text(`Total Tips: ${totalTips}`, 10, y);
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
      الإكراميات: ${agent.tips || 0}<br>
      المبلغ: ${agent.money}<br>

      <div class="agent-actions">
        <button type="button" onclick="openTransactionModal(${index})">➕ إضافة</button>
        <button type="button" onclick="showStatement(${index})">📊 كشف</button>
        <button type="button" onclick="exportStatementPDF(${index})">📁 PDF</button>
        <button type="button" onclick="resetAgent(${index})">🔄 تصفير</button>
        <button type="button" onclick="deleteAgent(${index})">🗑 حذف</button>
      </div>
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
  let totalTips = 0;

  const reportData = agents.map((agent) => {
    let agentCards = 0;
    let agentMoney = 0;
    let agentTips = 0;

    (agent.history || []).forEach((item) => {
      const d = new Date(item.date);

      if (!isNaN(d) && d.getFullYear() === year && d.getMonth() === month) {
        agentCards += Number(item.cards || 0);
        agentMoney += Number(item.money || 0);
        agentTips += Number(item.tip || 0);
      }
    });

    totalCards += agentCards;
    totalMoney += agentMoney;
    totalTips += agentTips;

    return {
      name: agent.name,
      cards: agentCards,
      tips: agentTips,
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
          <th>الإكراميات</th>
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
        <td>${row.tips}</td>
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
          <td>${totalTips}</td>
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
  let totalTips = 0;

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
    let agentTips = 0;

    (agent.history || []).forEach((item) => {
      const d = new Date(item.date);

      if (!isNaN(d) && d.getFullYear() === year && d.getMonth() === month) {
        agentCards += Number(item.cards || 0);
        agentMoney += Number(item.money || 0);
        agentTips += Number(item.tip || 0);
      }
    });

    if (y > 245) {
      doc.addPage();
      y = 15;
    }

    doc.text(`Name: ${agent.name}`, 10, y);
    y += 6;
    doc.text(`Cards: ${agentCards}`, 10, y);
    y += 6;
    doc.text(`Tips: ${agentTips}`, 10, y);
    y += 6;
    doc.text(`Money: ${agentMoney}`, 10, y);
    y += 10;

    totalCards += agentCards;
    totalMoney += agentMoney;
    totalTips += agentTips;
  });

  if (y > 235) {
    doc.addPage();
    y = 15;
  }

  doc.text(`Total Cards: ${totalCards}`, 10, y);
  y += 8;
  doc.text(`Total Tips: ${totalTips}`, 10, y);
  y += 8;
  doc.text(`Total Money: ${totalMoney}`, 10, y);

  doc.save("report.pdf");
}

showAuth();