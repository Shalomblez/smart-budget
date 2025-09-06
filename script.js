const SmartBudget = (function() {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbxuiKD4X5aRsGJgMYmGF8-Q4jkRTWik905md7u0qSZI4iFS6-WuMCVJdqQwzrNwvhQ6/exec'; // Replace with your new Apps Script Web App URL

  let records = [];
  let settings = [];

  // Fetch all records and settings
  async function fetchAll() {
    try {
      const r = await fetch(GAS_URL);
      const data = await r.json();
      records = (data.records || []).map(r => ({
        Date: new Date(r.Date),
        Category: r.Category,
        Description: r.Description || '',
        Amount: Number(r.Amount || 0),
        Type: r.Type
      }));

      const s = await fetch(GAS_URL + '?action=settings');
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

  // POST new record
  async function postRecord(obj) {
    try {
      const res = await fetch(GAS_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(obj)
      });
      const data = await res.json();
      return data.status === 'ok';
    } catch(err) {
      console.error(err);
      return false;
    }
  }

  function getTotalExpenses(month=null) {
    let filtered = records.filter(r => r.Type.toLowerCase() === 'expense');
    if(month) {
      filtered = filtered.filter(r => r.Date.getMonth() === month);
    }
    return filtered.reduce((sum,r) => sum + r.Amount, 0);
  }

  // Render table
  function renderTable(month=null) {
    const tbody = document.querySelector('#recordsTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    let filtered = records;
    if(month !== null) {
      filtered = records.filter(r => r.Date.getMonth() === month);
    }
    filtered.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.Date.toLocaleDateString()}</td>
                      <td>${r.Category}</td>
                      <td>${r.Description}</td>
                      <td>${r.Amount}</td>
                      <td>${r.Type}</td>`;
      tbody.appendChild(tr);
    });
  }

  // Render charts
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
        data:{ labels:Object.keys(catMap), datasets:[{ data:Object.values(catMap), backgroundColor:Object.keys(catMap).map(()=>getRandomColor()) }] }
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

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for(let i=0;i<6;i++) color += letters[Math.floor(Math.random()*16)];
    return color;
  }

  // Init Dashboard
  async function initDashboard() {
    await fetchAll();
    renderCharts();
  }

  // Init Expenses Page
  async function initExpensesPage() {
    await fetchAll();
    renderTable();
    addMonthFilter();

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
          renderTable(document.getElementById('monthFilter')?.value ? parseInt(document.getElementById('monthFilter').value) : null);
          showMessage('Record added successfully!', true);
          form.reset();
        } else {
          showMessage('Failed to Add Record', false);
        }
      });
    }
  }

  function showMessage(msg, success=true) {
    let el = document.getElementById('messageBox');
    if(!el){
      el = document.createElement('div');
      el.id = 'messageBox';
      el.style.position = 'fixed';
      el.style.top = '10px';
      el.style.right = '10px';
      el.style.padding = '10px 20px';
      el.style.borderRadius = '5px';
      el.style.zIndex = '9999';
      document.body.appendChild(el);
    }
    el.style.backgroundColor = success ? '#2ecc71' : '#e74c3c';
    el.style.color = '#fff';
    el.textContent = msg;
    setTimeout(()=>{ el.textContent=''; el.style.backgroundColor=''; }, 3000);
  }

  // Add month filter
  function addMonthFilter() {
    const section = document.querySelector('section h2 + table')?.parentNode;
    if(!section) return;
    const label = document.createElement('label');
    label.textContent = 'Filter by Month:';
    label.style.marginTop='10px';
    const select = document.createElement('select');
    select.id='monthFilter';
    const optAll = document.createElement('option');
    optAll.value='';
    optAll.text='All';
    select.appendChild(optAll);
    for(let i=0;i<12;i++){
      const opt = document.createElement('option');
      opt.value=i;
      opt.text=new Date(2025,i).toLocaleString('default',{month:'long'});
      select.appendChild(opt);
    }
    select.addEventListener('change',()=>{
      const val = select.value;
      renderTable(val !== '' ? parseInt(val) : null);
    });
    section.insertBefore(label, section.querySelector('table'));
    section.insertBefore(select, section.querySelector('table'));
  }

  return { initDashboard, initExpensesPage, getTotalExpenses };
})();
