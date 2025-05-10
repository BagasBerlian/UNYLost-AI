const db = require("../config/database");

class Category {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM categories ORDER BY priority ASC",
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results);
        }
      );
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM categories WHERE id = ?",
        [id],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          if (results.length === 0) {
            return resolve(null);
          }
          resolve(results[0]);
        }
      );
    });
  }

  // Menambahkan kategori baru
  static create(categoryData) {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO categories SET ?",
        categoryData,
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve({ id: results.insertId, ...categoryData });
        }
      );
    });
  }

  static update(id, categoryData) {
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE categories SET ? WHERE id = ?",
        [categoryData, id],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          if (results.affectedRows === 0) {
            return resolve(false);
          }
          resolve(true);
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.query(
        "DELETE FROM categories WHERE id = ?",
        [id],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          if (results.affectedRows === 0) {
            return resolve(false);
          }
          resolve(true);
        }
      );
    });
  }

  // Mendapatkan jumlah barang temuan dalam kategori
  static getFoundItemCount(id) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) as count FROM found_items WHERE category_id = ?",
        [id],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results[0].count);
        }
      );
    });
  }

  static getLostItemCount(id) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) as count FROM lost_items WHERE category_id = ?",
        [id],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results[0].count);
        }
      );
    });
  }
}

module.exports = Category;
