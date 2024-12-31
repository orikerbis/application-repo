const express = require("express");
const app = express();
const mysql = require("mysql2");

app.use((req, res, next) => {
  res
      .header('Access-Control-Allow-Origin',
          '*');
  res
      .header('Access-Control-Allow-Methods',
          'GET, POST, PUT, DELETE');
  res
      .header('Access-Control-Allow-Headers',
          'Origin, X-Requested-With,Content-Type, Accept');
  next();
});

const db = mysql.createPool({
  port: 3306,
  host: "MYSQL_HOST",
  user: "MYSQL_USER",
  password: "MYSQL_PASSWORD",
  database: "employee-db",
});

app.use(express.json());

//  db.connect(function(err) {
//    if (err) {
//      console.error('⚠️  Error Connecting: ' + err.stack);
//      return;
//    }
 
//    console.log('✅  Connected as ID: ' + connection.threadId);
//  });

app.post("/create", (req, res) => {
  const name = req.body.name;
  const age = req.body.age;
  const country = req.body.country;
  const position = req.body.position;
  const wage = req.body.wage;

  db.query(
    "INSERT INTO employees (name, age, country, position, wage) VALUES (?,?,?,?,?)",
    [name, age, country, position, wage],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("Values Inserted");
      }
    }
  );
});

app.get("/employees", (req, res) => {
  db.query("SELECT * FROM employees", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.put("/update", (req, res) => {
  const id = req.body.id;
  const wage = req.body.wage;
  db.query(
    "UPDATE employees SET wage = ? WHERE id = ?",
    [wage, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM employees WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.listen(3001, () => {
  console.log("✅ Server running on port: 3001");
});
