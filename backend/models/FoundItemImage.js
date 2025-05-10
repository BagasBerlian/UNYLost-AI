const db = require("../config/database");

class FoundItemImage {
  static create(imageData) {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO found_item_images SET ?",
        imageData,
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve({ id: results.insertId, ...imageData });
        }
      );
    });
  }

  static getByItemId(itemId) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM found_item_images WHERE found_item_id = ? ORDER BY is_primary DESC, created_at ASC",
        [itemId],
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
        "SELECT * FROM found_item_images WHERE id = ?",
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

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.query(
        "DELETE FROM found_item_images WHERE id = ?",
        [id],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results.affectedRows > 0);
        }
      );
    });
  }

  static setPrimary(id, itemId) {
    return new Promise((resolve, reject) => {
      // Mulai transaction
      db.beginTransaction(async (err) => {
        if (err) {
          return reject(err);
        }

        try {
          await new Promise((resolve, reject) => {
            db.query(
              "UPDATE found_item_images SET is_primary = FALSE WHERE found_item_id = ?",
              [itemId],
              (error) => {
                if (error) return reject(error);
                resolve();
              }
            );
          });

          await new Promise((resolve, reject) => {
            db.query(
              "UPDATE found_item_images SET is_primary = TRUE WHERE id = ?",
              [id],
              (error) => {
                if (error) return reject(error);
                resolve();
              }
            );
          });

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                reject(err);
              });
            }
            resolve(true);
          });
        } catch (error) {
          return db.rollback(() => {
            reject(error);
          });
        }
      });
    });
  }

  static getPrimaryImage(itemId) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM found_item_images WHERE found_item_id = ? AND is_primary = TRUE LIMIT 1",
        [itemId],
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

  static deleteByItemId(itemId) {
    return new Promise((resolve, reject) => {
      db.query(
        "DELETE FROM found_item_images WHERE found_item_id = ?",
        [itemId],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results.affectedRows);
        }
      );
    });
  }
}

module.exports = FoundItemImage;
