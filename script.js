// script.js

const SmartBudget = (function() {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbx7M-PehNu4Ti5pW_TrY9QVdIJ0aupPNOBYa1G7FdlPH4q8stn9t5G9ZPnh2xXyLNAH/exec'; // <-- Replace with your deployed Apps Script URL

  let records = [];
  let settings = [];

  // Fetch all records and settings from Google Sheets
  async function fetchAll() {
    try {
      // Fetch records
      const r = await fetch(GAS_URL);
      const data = await r.json();
      records = (data.records || []).map(r => ({
        Date: new Date(r.Date),
        Category: r.Category,
        Description: r.Description || '',
        Amount: Number(r.Amount || 0),
        Type: r.Type
      }));

      // Fetch settings
      const s = await fetch(GAS_URL+'?action=settings');
      const sdata = await s.json();
      settings = sdata.settings || [];

      return { records, settings };
    } catch(err) {
      console.error(err);
      records = [];
      settings = [];
      return { records, settings };
    }
  }

  // Post a new record to Google Sheets
  async function postRecord(obj) {
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      });
      const data = await res.json();
      return data.status === 'ok';
    } catch(err) {
      console.error(err);
      return false;
    }
  }

  // Get total expenses for dashboard
  function getTotalExpenses(monthFilter = null) {
    return records
      .filter(r => r.Type.toLowerCase() === 'expense' &&
        (!monthFilter || (r.Date.getMonth()+1) === parseInt(monthFilter)))
      .reduce((sum,r) => sum + r.Amount, 0);
  }

  // Render charts
  function renderCharts(monthFilter = null) {
    // Category chart
    const catMap = {};
    records.forEach(r => {
      if(r.Type.toLowerCase() === 'expense' &&
         (!monthFilter || (r.Date.getMonth()+1) === parseInt(monthFilter))) {
        catMap[r.Category] = (catMap[r.Category]||0) + r.Amount;
      }
    });
    const ctxCat = document.getElementById('categoryChart');
    if(ctxCat){
      new Chart(ctxCat.getContext('2d'), {
        type:'pie',
        data:{ labels:Object.keys(catMap), datasets:[{ data:Object.values(catMap) }] }
      });
    }

    // Monthly chart
    const monthMap = {};
    records.forEach(r=>{
      const key = `${r.Date.getFullYear()}-${r.Date.getMonth()+1}`;
      if(!monthMap[key]) monthMap[key]={income:0,expense:0};
      if(r.Type.toLowerCase()==='income') monthMap[key].income += r.Amount;
      else monthMap[key].expense += r.Amount;
    });
    const months = Object.keys(monthMap).sort();
    const ctxMonth = document.getElementById('monthlyChart');
    if(ctxMonth){
      new Chart(ctxMonth.getContext('2d'), {
        type:'bar',
        data:{
          labels: months,
          datasets:[
            { label:'Income', data: months.map(m => monthMap[m].income), backgroundColor:'#27ae60' },
            { label:'Expense', data: months.map(m => monthMap[m].expense), backgroundColor:'#c0392b' }
          ]
        },
        options:{ responsive:true, scales:{y:{beginAtZero:true}} }
      });
    }
  }

  // Show green/red popup message
  function showMessage(msg, isSuccess = true) {
    const div = document.createElement('div');
    div.textContent = msg;
    div.style.position = 'fixed';
    div.style.top = '20px';
    div.style.right = '20px';
    div.style.padding = '10px 20px';
    div.style.backgroundColor = isSuccess ? '#27ae60' : '#c0392b';
    div.style.color = '#fff';
    div.style.borderRadius = '5px';
    div.style.zIndex = 1000;
    document.body.appendChild(div);
    setTimeout(() => document.body.removeChild(div), 3000);
  }

  // Initialize dashboard page
  async function initDashboard() {
    await fetchAll();

    // Populate month dropdown for filtering charts (if exists)
    const monthSelect = document.getElementById('filterMonth');
    if(monthSelect){
      monthSelect.addEventListener('change', () => {
        const monthVal = monthSelect.value === 'all' ? null : monthSelect.value;
        renderCharts(monthVal);
      });
    }

    // Initial render
    renderCharts();

    // Dashboard totals
    const salary = parseFloat(localStorage.getItem("salary") || 0);
    const savingGoal = parseFloat(localStorage.getItem("savingGoal") || 0);
    const spendable = salary - savingGoal;
    const expenses = getTotalExpenses();
    const remaining = spendable - expenses;

    document.getElementById("totalIncome").textContent = salary.toFixed(2);
    document.getElementById("savingGoalDisplay").textContent = savingGoal.toFixed(2);
    document.getElementById("totalExpense").textContent = expenses.toFixed(2);
    document.getElementById("remainingToSpend").textContent = spendable.toFixed(2);
    document.getElementById("remainingBalance").textContent = remaining.toFixed(2);
  }

  // Initialize expenses page
  async function initExpensesPage() {
    await fetchAll();
    renderTable();

    const form = document.getElementById('expenseForm');
    if(form){
      form.addEventListener('submit', async function(e){
        e.preventDefault();
        const obj = {
          Date: document.getElementById('date').value,
          Category: document.getElementById('category').value || 'Others',
          Description: document.getElementById('description').value || '',
          Amount: parseFloat(document.getElementById('amount').value),
          Type: document.getElementById('type').value
        };
        const ok = await postRecord(obj);
        if(ok){
          records.push({...obj, Date:new Date(obj.Date)});
          renderTable();
          showMessage('Record added successfully!');
          form.reset();
        } else {
          showMessage('Failed to add record', false);
        }
      });
    }

    // Month filter
    const monthSelect = document.getElementById('filterMonth');
    monthSelect?.addEventListener('change', renderTable);
  }

  // Render expenses table
  function renderTable() {
    const tbody = document.querySelector('#recordsTable tbody');
    if(!tbody) return;
    tbody.innerHTML='';

    const monthFilter = document.getElementById('filterMonth')?.value;

    records.forEach(r=>{
      if(monthFilter && monthFilter !== 'all' && (r.Date.getMonth()+1).toString() !== monthFilter) return;

      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.Date.toLocaleDateString()}</td>
                      <td>${r.Category}</td>
                      <td>${r.Description}</td>
                      <td>${r.Amount}</td>
                      <td>${r.Type}</td>`;
      tbody.appendChild(tr);
    });
  }

  return { initDashboard, initExpensesPage, getTotalExpenses };
})();
