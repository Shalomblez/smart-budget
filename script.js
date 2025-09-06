const firebaseConfig = {
  apiKey: "AIzaSyCDAMWFFDy3mgzbiGzqNdm7idHVUZ8tPoI",
  authDomain: "smartbudget-1ecac.firebaseapp.com",
  databaseURL: "https://smartbudget-1ecac-default-rtdb.firebaseio.com",
  projectId: "smartbudget-1ecac",
  storageBucket: "smartbudget-1ecac.firebasestorage.app",
  messagingSenderId: "758176413916",
  appId: "1:758176413916:web:9c3fe710d752b5371c1c19"
};

// ✅ Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database(app);

const SmartBudget = {
  saveSetup: function () {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const salary = parseFloat(document.getElementById("salary").value) || 0;
    const savingGoal = parseFloat(document.getElementById("savingGoal").value) || 0;

    const key = `${year}-${month}`;

    // Save in Firebase
    firebase.database().ref("setup/" + key).set({
      month,
      year,
      salary,
      savingGoal
    });

    alert("✅ Setup saved!");

    this.loadOverview();
  },

  loadOverview: function () {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const key = `${year}-${month}`;

    firebase.database().ref("setup/" + key).once("value").then(snapshot => {
      const data = snapshot.val();
      if (data) {
        document.getElementById("totalIncome").innerText = data.salary;
        document.getElementById("savingGoalDisplay").innerText = data.savingGoal;

        // fetch expenses also
        firebase.database().ref("expenses/" + key).once("value").then(snap => {
          let totalExpense = 0;
          snap.forEach(exp => {
            totalExpense += exp.val().amount;
          });
          document.getElementById("totalExpense").innerText = totalExpense;

          let spendable = data.salary - data.savingGoal;
          let balance = spendable - totalExpense;

          document.getElementById("remainingToSpend").innerText = spendable;
          document.getElementById("remainingBalance").innerText = balance;
        });
      }
    });
  },

  initDashboard: function () {
    this.loadOverview();
  }
};
