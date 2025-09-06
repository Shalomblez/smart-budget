const SmartBudget = (function() {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbx7M-PehNu4Ti5pW_TrY9QVdIJ0aupPNOBYa1G7FdlPH4q8stn9t5G9ZPnh2xXyLNAH/exec'; // Replace with your Apps Script Web App URL

  let records = [];
  let settings = [];

  async function fetchAll() {
    try {
      const r = await fetch(GAS_URL);
      const data = await r.json();
      records = (data.records || []).map(r => ({
        Date: new Date(r.Date),
        Category: r.Category,
        Amount: Number(r.Amount || 0),
        Type: r.Type
      }));

      const s = await fetch(GAS_URL+'?action=settings');
      const sdata = await s.json();
      settings = sdata.settings || [];

      return { records, settings };
    } catch(err) {
      console.error(err);
      records = []; settings = [];
      return { records, settings };
    }
  }

  async function postRecord(obj) {
    try {
      const res = await fetch(GAS_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(obj)
      });
      const data = await res.json();
      return data.status === 'ok';
    } catch(err) { console.error(err); return false; }
  }

  function getTotalExpenses() {
    return records.filter(r=>r.Type.toLowerCase()==='expense')
                  .reduce((sum,r)=>sum+r.Amount,0);
  }

  function renderCharts() {
    // Category chart
    const catMap = {};
    records.forEach(r=>{
      if(r.Type.toLowerCase()==='expense'){
        catMap[r.Category] = (catMap[r.Category]||0)+r.Amount;
      }
    });
    const ctxCat = document.getElementById('categoryChart');
    if(ctxCat){
      new Chart(ctxCat.getContext('2d'),{
        type:'pie',
        data:{ labels:Object.keys(catMap), datasets:[{ data:Object.values(catMap) }] }
      });
    }

    // Monthly chart
    const monthMap = {};
    records.forEach(r=>{
      const key = `${r.Date.getFullYear()}-${r.Date.getMonth()+1}`;
      if(!monthMap[key]) monthMap[key]={income:0,expense:0};
      if(r.Type.toLowerCase()==='income') monthMap[key].income+=r.Amount;
      else monthMap[key].expense+=r.Amount;
    });
    const months = Object.keys(monthMap).sort();
    const ctxMonth = document.getElementById('monthlyChart');
    if(ctxMonth){
      new Chart(ctxMonth.getContext('2d'),{
        type:'bar',
        data:{
          labels:months,
          datasets:[
            { label:'Income', data:months.map(m=>monthMap[m].income), backgroundColor:'#27ae60' },
            { label:'Expense', data:months.map(m=>monthMap[m].expense), backgroundColor:'#c0392b' }
          ]
        },
        options:{ responsive:true, scales:{y:{beginAtZero:true}} }
      });
    }
  }

  async function initDashboard() {
    await fetchAll();
    renderCharts();
  }

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
          alert('Record added successfully!');
          form.reset();
        }
      });
    }
  }

  function renderTable() {
    const tbody = document.querySelector('#recordsTable tbody');
    if(!tbody) return;
    tbody.innerHTML='';
    records.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML=`<td>${r.Date.toLocaleDateString()}</td>
                    <td>${r.Category}</td>
                    <td>${r.Description}</td>
                    <td>${r.Amount}</td>
                    <td>${r.Type}</td>`;
      tbody.appendChild(tr);
    });
  }

  return { initDashboard, initExpensesPage, getTotalExpenses };
})();
