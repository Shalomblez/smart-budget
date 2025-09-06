
// ==== FIREBASE SETUP ====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, push, get, child } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
const firebaseConfig = {
    apiKey: "AIzaSyCDAMWFFDy3mgzbiGzqNdm7idHVUZ8tPoI",
    authDomain: "smartbudget-1ecac.firebaseapp.com",
    databaseURL: "https://smartbudget-1ecac-default-rtdb.firebaseio.com",
    projectId: "smartbudget-1ecac",
    storageBucket: "smartbudget-1ecac.firebasestorage.app",
    messagingSenderId: "758176413916",
    appId: "1:758176413916:web:9c3fe710d752b5371c1c19"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==== MAIN OBJECT ====
const SmartBudget = {
  // Save salary + saving goal
  saveSetup: async function() {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const salary = document.getElementById("salary").value;
    const savingGoal = document.getElementById("savingGoal").value;

    if (!salary || !savingGoal) {
      this.showPopup("⚠️ Enter salary and goal!", "red");
      return;
    }

    const key = `${year}-${month}`;
    await set(ref(db, "setups/" + key), {
      salary: parseInt(salary),
      savingGoal: parseInt(savingGoal)
    });

    this.showPopup("✅ Setup saved!", "green");
    this.updateDashboard();
  },

  // Save expense
  saveExpense: async function(category, amount, desc, date) {
    if (!category || !amount) {
      this.showPopup("⚠️ Fill category and amount!", "red");
      return;
    }

    const entry = { category, amount: parseInt(amount), desc, date };
    const key = new Date(date).toISOString().slice(0,7); // YYYY-MM
    await push(ref(db, "expenses/" + key), entry);

    this.showPopup("✅ Expense added!", "green");
  },

  // Update dashboard values
  updateDashboard: async function() {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const key = `${year}-${month}`;

    const dbRef = ref(db);

    // Salary + Goal
    const setupSnap = await get(child(dbRef, "setups/" + key));
    let salary = 0, goal = 0;
    if (setupSnap.exists()) {
      salary = setupSnap.val().salary;
      goal = setupSnap.val().savingGoal;
    }

    // Expenses
    const expSnap = await get(child(dbRef, "expenses/" + key));
    let totalExpense = 0;
    if (expSnap.exists()) {
      Object.values(expSnap.val()).forEach(e => totalExpense += e.amount);
    }

    document.getElementById("totalIncome").innerText = salary;
    document.getElementById("totalExpense").innerText = totalExpense;
    document.getElementById("savingGoalDisplay").innerText = goal;
    document.getElementById("remainingToSpend").innerText = salary - goal;
    document.getElementById("remainingBalance").innerText = salary - goal - totalExpense;
  },

  // Popup message
  showPopup: function(message, color) {
    let popup = document.createElement("div");
    popup.innerText = message;
    popup.style.position = "fixed";
    popup.style.top = "20px";
    popup.style.right = "20px";
    popup.style.background = color;
    popup.style.color = "white";
    popup.style.padding = "10px 15px";
    popup.style.borderRadius = "5px";
    popup.style.zIndex = "9999";
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
  },

  // Init dashboard
  initDashboard: function() {
    document.getElementById("month").value = new Date().getMonth() + 1;
    document.getElementById("year").value = new Date().getFullYear();
    this.updateDashboard();
  }
};

window.SmartBudget = SmartBudget;
