const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());


const send400 = (res, message) => {
  return res.status(400).json({ error: message });
};

const send404 = (res, message) => {
  return res.status(404).json({ error: message });
};


let weeks = [];
let goals = [];

let weekId = 1;
let goalId = 1;


// GET all weeks
app.get("/weeks", (req, res) => {
  res.status(200).json(weeks);
});

// GET single week
app.get("/weeks/:id", (req, res) => {
  const id = Number(req.params.id);
  const week = weeks.find(w => w.id === id);

  if (!week) return send404(res, "Week not found");

  res.status(200).json(week);
});

// CREATE week
app.post("/weeks", (req, res) => {
  const { weekLabel, allowance, spent, saveTarget } = req.body;

  if (!weekLabel) return send400(res, "Week label is required");

  if (!Number.isFinite(allowance) || allowance <= 0) {
    return send400(res, "Allowance must be greater than 0");
  }

  if (!Number.isFinite(spent) || spent < 0) {
    return send400(res, "Spent cannot be negative");
  }

  if (spent > allowance) {
    return send400(res, "Spent cannot exceed allowance");
  }

  if (!Number.isFinite(saveTarget) || saveTarget < 0) {
    return send400(res, "Invalid save target");
  }

  const saved = allowance - spent;
  const metTarget = saved >= saveTarget;

  const newWeek = {
    id: weekId++,
    weekLabel,
    allowance,
    spent,
    saved,
    saveTarget,
    metTarget,
    createdAt: new Date()
  };

  weeks.push(newWeek);

  res.status(201).json(newWeek);
});

// UPDATE week
app.put("/weeks/:id", (req, res) => {
  const id = Number(req.params.id);
  const week = weeks.find(w => w.id === id);

  if (!week) return send404(res, "Week not found");

  const { weekLabel, allowance, spent, saveTarget } = req.body;

  if (!weekLabel) return send400(res, "Week label is required");

  if (!Number.isFinite(allowance) || allowance <= 0) {
    return send400(res, "Allowance must be greater than 0");
  }

  if (!Number.isFinite(spent) || spent < 0 || spent > allowance) {
    return send400(res, "Invalid spent value");
  }

  if (!Number.isFinite(saveTarget) || saveTarget < 0) {
    return send400(res, "Invalid save target");
  }

  week.weekLabel = weekLabel;
  week.allowance = allowance;
  week.spent = spent;
  week.saveTarget = saveTarget;

  week.saved = allowance - spent;
  week.metTarget = week.saved >= saveTarget;

  res.status(200).json({
    message: "Week updated",
    week
  });
});

// DELETE week
app.delete("/weeks/:id", (req, res) => {
  const id = Number(req.params.id);

  const initialLength = weeks.length;
  weeks = weeks.filter(w => w.id !== id);

  if (weeks.length === initialLength) {
    return send404(res, "Week not found");
  }

  res.status(200).json({ message: "Week deleted" });
});



app.get("/summary/all", (req, res) => {
  const totalWeeks = weeks.length;

  const totalAllowance = weeks.reduce((sum, w) => sum + w.allowance, 0);
  const totalSpent = weeks.reduce((sum, w) => sum + w.spent, 0);
  const totalSaved = weeks.reduce((sum, w) => sum + w.saved, 0);

  const weeksMetTarget = weeks.filter(w => w.metTarget).length;
  const weeksMissed = totalWeeks - weeksMetTarget;

  res.status(200).json({
    totalWeeks,
    totalAllowance,
    totalSpent,
    totalSaved,
    weeksMetTarget,
    weeksMissed
  });
});



// GET all goals
app.get("/goals", (req, res) => {
  res.status(200).json(goals);
});

// GET single goal
app.get("/goals/:id", (req, res) => {
  const id = Number(req.params.id);
  const goal = goals.find(g => g.id === id);

  if (!goal) return send404(res, "Goal not found");

  res.status(200).json(goal);
});

// CREATE goal
app.post("/goals", (req, res) => {
  const { name, targetAmount } = req.body;

  if (!name) return send400(res, "Goal name is required");

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return send400(res, "Target amount must be greater than 0");
  }

  const newGoal = {
    id: goalId++,
    name,
    targetAmount,
    currentAmount: 0,
    remaining: targetAmount,
    progressPercent: 0,
    achieved: false
  };

  goals.push(newGoal);

  res.status(201).json(newGoal);
});

// UPDATE goal
app.put("/goals/:id", (req, res) => {
  const id = Number(req.params.id);
  const goal = goals.find(g => g.id === id);

  if (!goal) return send404(res, "Goal not found");

  const { name, targetAmount } = req.body;

  if (name) goal.name = name;

  if (targetAmount !== undefined) {
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return send400(res, "Invalid target amount");
    }
    goal.targetAmount = targetAmount;
  }

  goal.remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  goal.progressPercent = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100
  );
  goal.achieved = goal.currentAmount >= goal.targetAmount;

  res.status(200).json({
    message: "Goal updated",
    goal
  });
});

// DELETE goal
app.delete("/goals/:id", (req, res) => {
  const id = Number(req.params.id);

  const initialLength = goals.length;
  goals = goals.filter(g => g.id !== id);

  if (goals.length === initialLength) {
    return send404(res, "Goal not found");
  }

  res.status(200).json({ message: "Goal deleted" });
});

// CONTRIBUTE to goal
app.post("/goals/:id/contribute", (req, res) => {
  const id = Number(req.params.id);
  const { amount } = req.body;

  const goal = goals.find(g => g.id === id);

  if (!goal) return send404(res, "Goal not found");

  if (!Number.isFinite(amount) || amount <= 0) {
    return send400(res, "Amount must be greater than 0");
  }

  if (goal.achieved) {
    return send400(res, "Goal already achieved");
  }

  goal.currentAmount += amount;

  goal.remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  goal.progressPercent = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100
  );
  goal.achieved = goal.currentAmount >= goal.targetAmount;

  res.status(200).json({
    message: "Contribution added",
    goal
  });
});


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});