const db = require("../config/database");

class LostItem {
  static create(itemData) {
    return new Promise((resolve, reject) => {
      db.query("INSERT INTO lost_items SET ?", itemData, (error, results) => {
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
        `SELECT l.*, c.name as category_name, u.full_name as owner_name 
         FROM lost_items l 
         JOIN categories c ON l.category_id = c.id 
         JOIN users u ON l.user_id = u.id 
         WHERE l.id = ?`,
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

  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE lost_items SET status = ? WHERE id = ?",
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
        "UPDATE lost_items SET ? WHERE id = ?",
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
        "DELETE FROM lost_items WHERE id = ?",
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
        `SELECT l.*, c.name as category_name 
         FROM lost_items l 
         JOIN categories c ON l.category_id = c.id 
         WHERE l.user_id = ? 
         ORDER BY l.created_at DESC 
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
        `SELECT l.*, c.name as category_name, u.full_name as owner_name 
         FROM lost_items l 
         JOIN categories c ON l.category_id = c.id 
         JOIN users u ON l.user_id = u.id 
         WHERE l.category_id = ? 
         ORDER BY l.created_at DESC 
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
        SELECT l.*, c.name as category_name, u.full_name as owner_name 
        FROM lost_items l 
        JOIN categories c ON l.category_id = c.id 
        JOIN users u ON l.user_id = u.id 
        WHERE 1=1
      `;
      const queryParams = [];

      if (filters.status) {
        query += " AND l.status = ?";
        queryParams.push(filters.status);
      }

      if (filters.categoryId) {
        query += " AND l.category_id = ?";
        queryParams.push(filters.categoryId);
      }

      if (filters.fromDate) {
        query += " AND l.lost_date >= ?";
        queryParams.push(filters.fromDate);
      }

      if (filters.toDate) {
        query += " AND l.lost_date <= ?";
        queryParams.push(filters.toDate);
      }

      query += " ORDER BY l.created_at DESC LIMIT ? OFFSET ?";
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
        `SELECT l.*, c.name as category_name, u.full_name as owner_name 
         FROM lost_items l 
         JOIN categories c ON l.category_id = c.id 
         JOIN users u ON l.user_id = u.id 
         WHERE l.item_name LIKE ? OR l.description LIKE ? 
         ORDER BY l.created_at DESC 
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
      let query = "SELECT COUNT(*) as count FROM lost_items WHERE 1=1";
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
        query += " AND lost_date >= ?";
        queryParams.push(filters.fromDate);
      }

      if (filters.toDate) {
        query += " AND lost_date <= ?";
        queryParams.push(filters.toDate);
      }

      if (filters.userId) {
        query += " AND user_id = ?";
        queryParams.push(filters.userId);
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

module.exports = LostItem;
