// Firebase Config - replace with your own
const firebaseConfig = {
  apiKey: "AIzaSyCDAMWFFDy3mgzbiGzqNdm7idHVUZ8tPoI",
  authDomain: "smartbudget-1ecac.firebaseapp.com",
  databaseURL: "https://smartbudget-1ecac-default-rtdb.firebaseio.com",
  projectId: "smartbudget-1ecac",
  storageBucket: "smartbudget-1ecac.firebasestorage.app",
  messagingSenderId: "758176413916",
  appId: "1:758176413916:web:9c3fe710d752b5371c1c19"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const SmartBudget = (function() {
  let records = [];
  let salary=0, savingGoal=0;

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthSelect = document.getElementById("month");
  if(monthSelect) monthNames.forEach(m=> { const opt=document.createElement("option"); opt.value=m; opt.text=m; monthSelect.appendChild(opt); });

  function saveSetup() {
    salary = parseFloat(document.getElementById("salary").value)||0;
    savingGoal = parseFloat(document.getElementById("savingGoal").value)||0;
    localStorage.setItem("salary", salary);
    localStorage.setItem("savingGoal", savingGoal);
    updateOverview();
  }

  function updateOverview() {
    const expenses = records.filter(r=>r.Type==='Expense').reduce((a,b)=>a+b.Amount,0);
    const spendable = salary - savingGoal;
    const remaining = spendable - expenses;
    document.getElementById("totalIncome").textContent=salary.toFixed(2);
    document.getElementById("savingGoalDisplay").textContent=savingGoal.toFixed(2);
    document.getElementById("totalExpense").textContent=expenses.toFixed(2);
    document.getElementById("remainingToSpend").textContent=spendable.toFixed(2);
    document.getElementById("remainingBalance").textContent=remaining.toFixed(2);
  }

  function renderTable() {
    const tbody=document.querySelector('#recordsTable tbody');
    if(!tbody) return;
    tbody.innerHTML='';
    records.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${r.Date}</td><td>${r.Category}</td><td>${r.Description}</td><td>${r.Amount}</td><td>${r.Type}</td>`;
      tbody.appendChild(tr);
    });
  }

  function initDashboard() {
    db.ref('expenses').on('value', snapshot=>{
      const data = snapshot.val()||{};
      records = Object.values(data);
      updateOverview();
    });
  }

  function initExpensesPage() {
    const form=document.getElementById('expenseForm');
    db.ref('expenses').on('value', snapshot=>{
      records = Object.values(snapshot.val()||{});
      renderTable();
    });

    if(form){
      form.addEventListener('submit', e=>{
        e.preventDefault();
        const obj={
          Date: document.getElementById('date').value,
          Category: document.getElementById('category').value||'Others',
          Description: document.getElementById('description').value||'',
          Amount: parseFloat(document.getElementById('amount').value),
          Type: document.getElementById('type').value
        };
        db.ref('expenses').push(obj).then(()=>{
          alert('✅ Expense added!');
          form.reset();
        }).catch(err=>{
          alert('❌ Failed to add record');
          console.error(err);
        });
      });
    }
  }

  return { initDashboard, initExpensesPage, saveSetup };
})();
