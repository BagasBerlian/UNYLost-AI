require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function initializeDatabase() {
  try {
    console.log("Trying to connect to MySQL server...");

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log("Connected to MySQL server.");

    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${process.env.DB_NAME}'`
    );

    if (rows.length === 0) {
      console.log(
        `Database '${process.env.DB_NAME}' tidak ditemukan. Membuat database baru...`
      );
      await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database '${process.env.DB_NAME}' berhasil dibuat.`);
    } else {
      console.log(`Database '${process.env.DB_NAME}' sudah ada.`);
    }

    await connection.query(`USE ${process.env.DB_NAME}`);

    // Baca file SQL schema
    const schemaPath = path.join(__dirname, "schema.sql");
    let sqlSchema = "";

    try {
      sqlSchema = fs.readFileSync(schemaPath, "utf8");
    } catch (readError) {
      console.error("Error membaca file schema.sql:", readError);
      await connection.end();
      return;
    }

    console.log("Menjalankan script SQL schema...");

    const queries = sqlSchema
      .split(";")
      .map((query) => query.trim())
      .filter((query) => query.length > 0);

    for (const query of queries) {
      try {
        await connection.query(query);
      } catch (queryError) {
        console.error(`Error pada query: ${query}`);
        console.error(queryError);
      }
    }

    console.log("Script SQL schema berhasil dijalankan.");

    const [adminCheck] = await connection.query(
      "SELECT * FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (adminCheck.length === 0) {
      console.log("Membuat admin default...");

      const bcrypt = require("bcryptjs");
      const adminPassword = "admin123"; // Ganti dengan password yang lebih aman di environment production
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await connection.query(
        "INSERT INTO users (full_name, email, password, phone_number, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)",
        [
          "Admin UNYLost",
          "admin@unylost.com",
          hashedPassword,
          "0812345678",
          "admin",
          true,
        ]
      );

      console.log("Admin default berhasil dibuat.");
      console.log("Email: admin@unylost.com");
      console.log("Password: admin123");
    } else {
      console.log("Admin sudah ada di database.");
    }

    await connection.end();
    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initializeDatabase();
