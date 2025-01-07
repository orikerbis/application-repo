const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const client = require("prom-client"); // Import prom-client
const bodyParser = require("body-parser"); // For parsing JSON bodies

// Enable CORS for all origins (adjust as needed for production)
app.use(cors());

// Parse JSON bodies
app.use(express.json());
app.use(bodyParser.json());

// Initialize Prometheus metrics registry
const register = new client.Registry();

// Optional: Collect default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Define custom metrics
const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "endpoint", "status_code"],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "endpoint", "status_code"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5], // Define appropriate buckets
});

// Register custom metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);

// Database connection pool
const db = mysql.createPool({
  port: 3306,
  host: process.env.MYSQL_HOST, // Use environment variables
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: "employeeDB",
});

// Middleware to instrument requests
app.use((req, res, next) => {
  const startHrTime = process.hrtime();

  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedSeconds = elapsedHrTime[0] + elapsedHrTime[1] / 1e9;

    httpRequestsTotal.inc({
      method: req.method,
      endpoint: req.path,
      status_code: res.statusCode,
    });

    httpRequestDurationSeconds.observe({
      method: req.method,
      endpoint: req.path,
      status_code: res.statusCode,
    }, elapsedSeconds);
  });

  next();
});

// Optional: Test Database Connection
// db.getConnection((err, connection) => {
//   if (err) {
//     console.error('⚠️  Error Connecting: ' + err.stack);
//     return;
//   }
//   console.log('✅  Connected as ID: ' + connection.threadId);
//   connection.release();
// });

// API Endpoints

app.post("/api/create", (req, res) => { // Prefixed with /api
  const { name, age, country, position, wage } = req.body;

  db.query(
    "INSERT INTO employees (name, age, country, position, wage) VALUES (?,?,?,?,?)",
    [name, age, country, position, wage],
    (err, result) => {
      if (err) {
        console.error("Error inserting employee:", err);
        res.status(500).send("Error inserting employee");
      } else {
        res.status(201).send("Employee Added Successfully");
      }
    }
  );
});

app.get("/api/employees", (req, res) => { // Prefixed with /api
  db.query("SELECT * FROM employees", (err, result) => {
    if (err) {
      console.error("Error fetching employees:", err);
      res.status(500).send("Error fetching employees");
    } else {
      res.status(200).json(result);
    }
  });
});

app.put("/api/update", (req, res) => { // Prefixed with /api
  const { id, wage } = req.body;

  db.query(
    "UPDATE employees SET wage = ? WHERE id = ?",
    [wage, id],
    (err, result) => {
      if (err) {
        console.error("Error updating wage:", err);
        res.status(500).send("Error updating wage");
      } else {
        res.status(200).send("Wage Updated Successfully");
      }
    }
  );
});

app.delete("/api/delete/:id", (req, res) => { // Prefixed with /api
  const id = req.params.id;

  db.query("DELETE FROM employees WHERE id = ?", id, (err, result) => {
    if (err) {
      console.error("Error deleting employee:", err);
      res.status(500).send("Error deleting employee");
    } else {
      res.status(200).send("Employee Deleted Successfully");
    }
  });
});

// Metrics Endpoint
app.get("/metrics", async (req, res) => { // Exposed for Prometheus scraping
  try {
    res.set("Content-Type", register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.listen(3001, () => {
  console.log("✅ Server running on port: 3001");
});