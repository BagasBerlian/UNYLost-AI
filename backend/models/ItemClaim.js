const db = require("../config/database");

class ItemClaim {
  static create(claimData) {
    return new Promise((resolve, reject) => {
      db.query("INSERT INTO item_claims SET ?", claimData, (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve({ id: results.insertId, ...claimData });
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT c.*, u.full_name as claimer_name, u.email as claimer_email, 
                f.item_name, f.image_url, f.category_id, f.location as found_location,
                f.found_date, cat.name as category_name
         FROM item_claims c 
         JOIN users u ON c.user_id = u.id 
         JOIN found_items f ON c.item_id = f.id
         JOIN categories cat ON f.category_id = cat.id
         WHERE c.id = ?`,
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

  static updateStatus(id, status, adminNotes) {
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE item_claims SET status = ?, admin_notes = ? WHERE id = ?",
        [status, adminNotes, id],
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
        `SELECT c.*, f.item_name, f.image_url, cat.name as category_name 
         FROM item_claims c 
         JOIN found_items f ON c.item_id = f.id 
         JOIN categories cat ON f.category_id = cat.id
         WHERE c.user_id = ? 
         ORDER BY c.created_at DESC 
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

  static getByItem(itemId, limit = 10, offset = 0) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT c.*, u.full_name as claimer_name, u.email as claimer_email
         FROM item_claims c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.item_id = ? 
         ORDER BY c.created_at DESC 
         LIMIT ? OFFSET ?`,
        [itemId, limit, offset],
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
        SELECT c.*, u.full_name as claimer_name, f.item_name, f.image_url, 
               cat.name as category_name 
        FROM item_claims c 
        JOIN users u ON c.user_id = u.id 
        JOIN found_items f ON c.item_id = f.id
        JOIN categories cat ON f.category_id = cat.id
        WHERE 1=1
      `;
      const queryParams = [];

      if (filters.status) {
        query += " AND c.status = ?";
        queryParams.push(filters.status);
      }

      if (filters.categoryId) {
        query += " AND f.category_id = ?";
        queryParams.push(filters.categoryId);
      }

      if (filters.fromDate) {
        query += " AND c.created_at >= ?";
        queryParams.push(filters.fromDate);
      }

      if (filters.toDate) {
        query += " AND c.created_at <= ?";
        queryParams.push(filters.toDate);
      }

      query += " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";
      queryParams.push(limit, offset);

      db.query(query, queryParams, (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  }

  static getCount(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = "SELECT COUNT(*) as count FROM item_claims c WHERE 1=1";
      const queryParams = [];

      if (filters.categoryId) {
        query = `
          SELECT COUNT(*) as count 
          FROM item_claims c 
          JOIN found_items f ON c.item_id = f.id 
          WHERE 1=1
        `;
      }

      if (filters.status) {
        query += " AND c.status = ?";
        queryParams.push(filters.status);
      }

      if (filters.categoryId) {
        query += " AND f.category_id = ?";
        queryParams.push(filters.categoryId);
      }

      if (filters.fromDate) {
        query += " AND c.created_at >= ?";
        queryParams.push(filters.fromDate);
      }

      if (filters.toDate) {
        query += " AND c.created_at <= ?";
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

  static hasUserClaimedItem(userId, itemId) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT id FROM item_claims WHERE user_id = ? AND item_id = ?",
        [userId, itemId],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results.length > 0);
        }
      );
    });
  }
}

module.exports = ItemClaim;
