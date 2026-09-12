const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database(path.join(__dirname, "data.db"));

function sanitizeColumnName(name) {
  // Alleen letters, cijfers en underscore, en niet starten met cijfer
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return null;
  return name;
}

function ensureRecordsTable(callback) {
  const sql = `
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.run(sql, callback);
}

// 1) Maak database/tabel aan
app.post("/api/init", (req, res) => {
  ensureRecordsTable((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ ok: true, message: "Database/tabel is klaar." });
  });
});

// 2) Voeg record toe met dynamische kolomnaam + string
app.post("/api/record", (req, res) => {
  const { columnName, value } = req.body;

  const safeColumn = sanitizeColumnName(columnName);
  if (!safeColumn) {
    return res.status(400).json({
      error: "Ongeldige kolomnaam. Gebruik alleen letters/cijfers/underscore.",
    });
  }

  if (typeof value !== "string") {
    return res.status(400).json({ error: "Waarde moet een string zijn." });
  }

  ensureRecordsTable((tableErr) => {
    if (tableErr) {
      return res.status(500).json({ error: tableErr.message });
    }

    db.serialize(() => {
      // Kolom toevoegen als deze nog niet bestaat
      const alterSql = `ALTER TABLE records ADD COLUMN ${safeColumn} TEXT`;
      db.run(alterSql, (alterErr) => {
        // Duplicate column name negeren
        if (alterErr && !String(alterErr.message).includes("duplicate column name")) {
          return res.status(500).json({ error: alterErr.message });
        }

        const insertSql = `INSERT INTO records (${safeColumn}) VALUES (?)`;
        db.run(insertSql, [value], function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: insertErr.message });
          }
          res.json({ ok: true, id: this.lastID });
        });
      });
    });
  });
});

// 3) Lees alle records uit
app.get("/api/records", (req, res) => {
  ensureRecordsTable((tableErr) => {
    if (tableErr) {
      return res.status(500).json({ error: tableErr.message });
    }

    db.all("SELECT * FROM records ORDER BY id DESC", [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ ok: true, rows });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});