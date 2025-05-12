const db = require("../config/database");

class FoundItem {
  static create(itemData) {
    return new Promise((resolve, reject) => {
      db.query("INSERT INTO found_items SET ?", itemData, (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve({ id: results.insertId, ...itemData });
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT f.*, c.name as category_name, u.full_name as reporter_name 
         FROM found_items f 
         JOIN categories c ON f.category_id = c.id 
         JOIN users u ON f.user_id = u.id 
         WHERE f.id = ?`,
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

  static getByFirestoreId(firestoreId) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT f.*, c.name as category_name, u.full_name as reporter_name 
         FROM found_items f 
         JOIN categories c ON f.category_id = c.id 
         JOIN users u ON f.user_id = u.id 
         WHERE f.firestore_id = ?`,
        [firestoreId],
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

  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE found_items SET status = ? WHERE id = ?",
        [status, id],
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

  static update(id, itemData) {
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE found_items SET ? WHERE id = ?",
        [itemData, id],
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
        "DELETE FROM found_items WHERE id = ?",
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

  static getByUser(userId, limit = 10, offset = 0) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT f.*, c.name as category_name 
         FROM found_items f 
         JOIN categories c ON f.category_id = c.id 
         WHERE f.user_id = ? 
         ORDER BY f.created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results);
        }
      );
    });
  }

  static getByCategory(categoryId, limit = 10, offset = 0) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT f.*, c.name as category_name, u.full_name as reporter_name 
         FROM found_items f 
         JOIN categories c ON f.category_id = c.id 
         JOIN users u ON f.user_id = u.id 
         WHERE f.category_id = ? 
         ORDER BY f.created_at DESC 
         LIMIT ? OFFSET ?`,
        [categoryId, limit, offset],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results);
        }
      );
    });
  }

  static getAll(filters = {}, limit = 10, offset = 0) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT f.*, c.name as category_name, u.full_name as reporter_name 
        FROM found_items f 
        JOIN categories c ON f.category_id = c.id 
        JOIN users u ON f.user_id = u.id 
        WHERE 1=1
      `;
      const queryParams = [];

      if (filters.status) {
        query += " AND f.status = ?";
        queryParams.push(filters.status);
      }

      if (filters.categoryId) {
        query += " AND f.category_id = ?";
        queryParams.push(filters.categoryId);
      }

      if (filters.fromDate) {
        query += " AND f.found_date >= ?";
        queryParams.push(filters.fromDate);
      }

      if (filters.toDate) {
        query += " AND f.found_date <= ?";
        queryParams.push(filters.toDate);
      }

      query += " ORDER BY f.created_at DESC LIMIT ? OFFSET ?";
      queryParams.push(limit, offset);

      db.query(query, queryParams, (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  }

  static search(keywords, limit = 10, offset = 0) {
    return new Promise((resolve, reject) => {
      const searchKeyword = `%${keywords}%`;
      db.query(
        `SELECT f.*, c.name as category_name, u.full_name as reporter_name 
       FROM found_items f 
       JOIN categories c ON f.category_id = c.id 
       JOIN users u ON f.user_id = u.id 
       WHERE f.item_name LIKE ? OR f.description LIKE ? 
       ORDER BY f.created_at DESC 
       LIMIT ? OFFSET ?`,
        [searchKeyword, searchKeyword, limit, offset],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results);
        }
      );
    });
  }

  static getCount(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = "SELECT COUNT(*) as count FROM found_items WHERE 1=1";
      const queryParams = [];

      if (filters.status) {
        query += " AND status = ?";
        queryParams.push(filters.status);
      }

      if (filters.categoryId) {
        query += " AND category_id = ?";
        queryParams.push(filters.categoryId);
      }

      if (filters.fromDate) {
        query += " AND found_date >= ?";
        queryParams.push(filters.fromDate);
      }

      if (filters.toDate) {
        query += " AND found_date <= ?";
        queryParams.push(filters.toDate);
      }

      db.query(query, queryParams, (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results[0].count);
      });
    });
  }
}

module.exports = FoundItem;
