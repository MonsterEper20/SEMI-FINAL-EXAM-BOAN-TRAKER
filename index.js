const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let goals = [];
let goalId = 1;

// Serve HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "home.html"));
});

// Get all goals
app.get("/goals", (req, res) => {
  res.json(goals);
});

// Create goal
app.post("/goals", (req, res) => {
  const { name, target } = req.body;

  if (!name || !target) {
    return res.status(400).json({ message: "Name and target required" });
  }

  const newGoal = {
    id: goalId++,
    name,
    target: parseInt(target),
    saved: 0
  };

  goals.push(newGoal);
  res.status(201).json(newGoal);
});

// Add money
app.put("/goals/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { value } = req.body;

  const goal = goals.find(g => g.id === id);
  if (!goal) return res.status(404).json({ message: "Goal not found" });

  const addValue = parseInt(value);
  if (isNaN(addValue)) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  goal.saved += addValue;

  res.json(goal);
});

// Delete goal
app.delete("/goals/:id", (req, res) => {
  const id = parseInt(req.params.id);
  goals = goals.filter(g => g.id !== id);

  res.json({ message: "Deleted" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});