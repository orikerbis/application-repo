const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const promClient = require("prom-client");
// Enable CORS for all origins (adjust as needed for production)
app.use(cors());
app.use(express.json());

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics(); // Collects default metrics like CPU usage, memory, etc.

// Define custom metrics
const httpRequestCounter = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "status_code"],
  buckets: [50, 100, 200, 300, 400, 500, 1000], // Define buckets for response time
});

app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  res.on("finish", () => {
    const route = req.route ? req.route.path : req.path; // Handle dynamic routes
    httpRequestCounter.labels(req.method, route, res.statusCode).inc();
    end({ method: req.method, route: route, status_code: res.statusCode });
  });
  
  next();
});

app.get("api/metrics", async (req, res) => {
  try {
    res.set("Content-Type", promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});
// Parse JSON bodies


const db = mysql.createPool({
  port: 3306,
  host: process.env.MYSQL_HOST, // Use environment variables
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: "employee-db",
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


app.listen(3001, () => {
  console.log("✅ Server running on port: 3001");
});