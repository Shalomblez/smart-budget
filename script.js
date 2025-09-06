const firebaseConfig = {
    apiKey: "AIzaSyCDAMWFFDy3mgzbiGzqNdm7idHVUZ8tPoI",
    authDomain: "smartbudget-1ecac.firebaseapp.com",
    databaseURL: "https://smartbudget-1ecac-default-rtdb.firebaseio.com",
    projectId: "smartbudget-1ecac",
    storageBucket: "smartbudget-1ecac.firebasestorage.app",
    messagingSenderId: "758176413916",
    appId: "1:758176413916:web:9c3fe710d752b5371c1c19"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const SmartBudget = {
  saveSetup: function () {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const salary = parseInt(document.getElementById("salary").value) || 0;
    const savingGoal = parseInt(document.getElementById("savingGoal").value) || 0;

    db.ref("setup/" + year + "/" + month).set({
      salary: salary,
      savingGoal: savingGoal
    }).then(() => {
      alert("✅ Setup saved successfully!");
    }).catch(err => alert("❌ Failed: " + err));
  },

  initDashboard: function () {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    db.ref("setup/" + year + "/" + month).on("value", snapshot => {
      const setup = snapshot.val();
      if (setup) {
        document.getElementById("totalIncome").innerText = setup.salary;
        document.getElementById("savingGoalDisplay").innerText = setup.savingGoal;
      }
    });

    db.ref("expenses/" + year + "/" + month).on("value", snapshot => {
      let totalExpense = 0;
      const categoryData = {};
      snapshot.forEach(exp => {
        const data = exp.val();
        totalExpense += data.amount;
        categoryData[data.category] = (categoryData[data.category] || 0) + data.amount;
      });

      document.getElementById("totalExpense").innerText = totalExpense;

      const salary = parseInt(document.getElementById("totalIncome").innerText) || 0;
      const savingGoal = parseInt(document.getElementById("savingGoalDisplay").innerText) || 0;

      const spendable = salary - savingGoal;
      const balance = spendable - totalExpense;

      document.getElementById("remainingToSpend").innerText = spendable;
      document.getElementById("remainingBalance").innerText = balance;

      // ✅ Category Chart
      const ctx1 = document.getElementById("categoryChart").getContext("2d");
      new Chart(ctx1, {
        type: "pie",
        data: {
          labels: Object.keys(categoryData),
          datasets: [{ data: Object.values(categoryData) }]
        }
      });

      // ✅ Monthly Chart
      const ctx2 = document.getElementById("monthlyChart").getContext("2d");
      new Chart(ctx2, {
        type: "bar",
        data: {
          labels: Object.keys(categoryData),
          datasets: [{
            label: "Expenses",
            data: Object.values(categoryData)
          }]
        }
      });
    });
  },

  addExpense: function () {
    const category = document.getElementById("category").value;
    const amount = parseInt(document.getElementById("amount").value);
    const date = document.getElementById("date").value;

    if (!amount || !date) {
      alert("⚠ Please enter all fields!");
      return;
    }

    const month = new Date(date).getMonth() + 1;
    const year = new Date(date).getFullYear();

    db.ref("expenses/" + year + "/" + month).push({
      category: category,
      amount: amount,
      date: date
    }).then(() => {
      alert("✅ Expense added!");
    }).catch(err => alert("❌ Failed: " + err));
  },

  initExpenses: function () {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    db.ref("expenses/" + year + "/" + month).on("value", snapshot => {
      const tbody = document.getElementById("expenseTable");
      tbody.innerHTML = "";
      snapshot.forEach(exp => {
        const data = exp.val();
        const row = `<tr>
          <td>${data.category}</td>
          <td>${data.amount}</td>
          <td>${data.date}</td>
        </tr>`;
        tbody.innerHTML += row;
      });
    });
  }
};
