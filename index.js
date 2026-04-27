const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =========================
// HELPERS
// =========================
const send400 = (res, msg) => res.status(400).json({ error: msg });
const send404 = (res, msg) => res.status(404).json({ error: msg });

// =========================
// DATA
// =========================
let weeks = [];
let goals = [];

let weekId = 1;
let goalId = 1;

// =========================
// GOALS
// =========================
app.get("/goals", (req, res) => {
  res.status(200).json(goals);
});

app.post("/goals", (req, res) => {
  const { name, targetAmount } = req.body;

  if (!name) return send400(res, "Goal name required");
  if (!Number.isFinite(targetAmount) || targetAmount <= 0)
    return send400(res, "Invalid target amount");

  const goal = {
    id: goalId++,
    name,
    targetAmount,
    currentAmount: 0,
    remaining: targetAmount,
    progressPercent: 0,
    achieved: false
  };

  goals.push(goal);
  res.status(201).json(goal);
});

app.post("/goals/:id/contribute", (req, res) => {
  const id = Number(req.params.id);
  const { amount } = req.body;

  const goal = goals.find(g => g.id === id);
  if (!goal) return send404(res, "Goal not found");

  if (!Number.isFinite(amount) || amount <= 0)
    return send400(res, "Invalid amount");

  if (goal.achieved)
    return send400(res, "Goal already achieved");

  goal.currentAmount += amount;

  goal.remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  goal.progressPercent = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100
  );
  goal.achieved = goal.currentAmount >= goal.targetAmount;

  res.status(200).json({ message: "Added", goal });
});

app.delete("/goals/:id", (req, res) => {
  const id = Number(req.params.id);

  const initial = goals.length;
  goals = goals.filter(g => g.id !== id);

  if (goals.length === initial)
    return send404(res, "Goal not found");

  res.status(200).json({ message: "Deleted" });
});

// =========================
// WEEKS
// =========================
app.get("/weeks", (req, res) => {
  res.status(200).json(weeks);
});

app.post("/weeks", (req, res) => {
  const { weekLabel, allowance, spent, saveTarget } = req.body;

  if (!weekLabel) return send400(res, "Week label required");
  if (!Number.isFinite(allowance) || allowance <= 0)
    return send400(res, "Invalid allowance");
  if (!Number.isFinite(spent) || spent < 0 || spent > allowance)
    return send400(res, "Invalid spent");

  const saved = allowance - spent;
  const metTarget = saved >= saveTarget;

  const week = {
    id: weekId++,
    weekLabel,
    allowance,
    spent,
    saved,
    saveTarget,
    metTarget,
    createdAt: new Date()
  };

  weeks.push(week);
  res.status(201).json(week);
});

// =========================
// SUMMARY
// =========================
app.get("/summary/all", (req, res) => {
  const totalWeeks = weeks.length;

  const totalAllowance = weeks.reduce((a, w) => a + w.allowance, 0);
  const totalSpent = weeks.reduce((a, w) => a + w.spent, 0);
  const totalSaved = weeks.reduce((a, w) => a + w.saved, 0);

  const weeksMetTarget = weeks.filter(w => w.metTarget).length;

  res.status(200).json({
    totalWeeks,
    totalAllowance,
    totalSpent,
    totalSaved,
    weeksMetTarget,
    weeksMissed: totalWeeks - weeksMetTarget
  });
});

// =========================
// FRONTEND ROUTE
// =========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/home.html"));
});

// =========================
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);