
const firebaseConfig = {
  apiKey: "AIzaSyCDAMWFFDy3mgzbiGzqNdm7idHVUZ8tPoI",
  authDomain: "smartbudget-1ecac.firebaseapp.com",
  databaseURL: "https://smartbudget-1ecac-default-rtdb.firebaseio.com",
  projectId: "smartbudget-1ecac",
  storageBucket: "smartbudget-1ecac.appspot.com",
  messagingSenderId: "758176413916",
  appId: "1:758176413916:web:9c3fe710d752b5371c1c19"
};

// Firebase init
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database(app);

const SmartBudget = {
  saveSetup: function () {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const salary = parseFloat(document.getElementById("salary").value) || 0;
    const savingGoal = parseFloat(document.getElementById("savingGoal").value) || 0;

    const key = `${year}-${month}`;

    db.ref("setup/" + key).set({
      month,
      year,
      salary,
      savingGoal
    }).then(() => {
      alert("✅ Setup saved!");
      this.loadOverview();
    });
  },

  loadOverview: function () {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const key = `${year}-${month}`;

    db.ref("setup/" + key).once("value").then(snapshot => {
      const data = snapshot.val();
      if (data) {
        document.getElementById("totalIncome").innerText = data.salary;
        document.getElementById("savingGoalDisplay").innerText = data.savingGoal;

        db.ref("expenses/" + key).once("value").then(snap => {
          let totalExpense = 0;
          const categoryTotals = {};

          snap.forEach(exp => {
            let e = exp.val();
            totalExpense += e.amount;
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
          });

          document.getElementById("totalExpense").innerText = totalExpense;

          let spendable = data.salary - data.savingGoal;
          let balance = spendable - totalExpense;

          document.getElementById("remainingToSpend").innerText = spendable;
          document.getElementById("remainingBalance").innerText = balance;

          this.renderCharts(categoryTotals, totalExpense, data.salary);
        });
      }
    });
  },

  addExpense: function () {
    const category = document.getElementById("category").value;
    const amount = parseFloat(document.getElementById("amount").value) || 0;
    const date = document.getElementById("date").value;

    if (!date) {
      alert("⚠️ Please select a date!");
      return;
    }

    const month = new Date(date).getMonth() + 1;
    const year = new Date(date).getFullYear();
    const key = `${year}-${month}`;

    db.ref("expenses/" + key).push({
      category,
      amount,
      date
    }).then(() => {
      alert("✅ Expense added!");
    });
  },

  renderCharts: function (categoryTotals, totalExpense, salary) {
    const ctx1 = document.getElementById("categoryChart").getContext("2d");
    new Chart(ctx1, {
      type: "pie",
      data: {
        labels: Object.keys(categoryTotals),
        datasets: [{
          data: Object.values(categoryTotals),
          backgroundColor: ["#e74c3c", "#3498db", "#2ecc71", "#9b59b6", "#f1c40f"]
        }]
      }
    });

    const ctx2 = document.getElementById("monthlyChart").getContext("2d");
    new Chart(ctx2, {
      type: "bar",
      data: {
        labels: ["Salary", "Expenses", "Saving Goal"],
        datasets: [{
          label: "₹ Amount",
          data: [salary, totalExpense, salary - totalExpense],
          backgroundColor: ["#2ecc71", "#e74c3c", "#3498db"]
        }]
      }
    });
  },

  initDashboard: function () {
    this.loadOverview();
  }
};
