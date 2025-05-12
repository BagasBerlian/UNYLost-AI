const db = require("../config/database");

exports.getAllUsers = async (req, res) => {
  try {
    db.query(
      `SELECT id, full_name, email, phone_number, role, is_verified, last_login, created_at, updated_at
       FROM users
       ORDER BY id ASC`,
      (error, results) => {
        if (error) {
          console.error("Error getting users:", error);
          return res.status(500).json({ message: "Server error" });
        }

        res.status(200).json({
          users: results,
          count: results.length,
        });
      }
    );
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    db.query(
      `SELECT id, full_name, email, phone_number, role, is_verified, last_login, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [userId],
      (error, results) => {
        if (error) {
          console.error(`Error getting user ${userId}:`, error);
          return res.status(500).json({ message: "Server error" });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        const user = results[0];

        db.query(
          "SELECT COUNT(*) as count FROM found_items WHERE user_id = ?",
          [userId],
          (error, foundItemResults) => {
            if (error) {
              console.error(`Error getting found items count:`, error);
              return res.status(500).json({ message: "Server error" });
            }

            db.query(
              "SELECT COUNT(*) as count FROM lost_items WHERE user_id = ?",
              [userId],
              (error, lostItemResults) => {
                if (error) {
                  console.error(`Error getting lost items count:`, error);
                  return res.status(500).json({ message: "Server error" });
                }

                db.query(
                  "SELECT COUNT(*) as count FROM item_claims WHERE user_id = ?",
                  [userId],
                  (error, claimsResults) => {
                    if (error) {
                      console.error(`Error getting claims count:`, error);
                      return res.status(500).json({ message: "Server error" });
                    }

                    res.status(200).json({
                      user: {
                        ...user,
                        found_items_count: foundItemResults[0].count,
                        lost_items_count: lostItemResults[0].count,
                        claims_count: claimsResults[0].count,
                      },
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error(`Error getting user ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role. Role must be 'user' or 'admin'" });
    }

    db.query("SELECT * FROM users WHERE id = ?", [userId], (error, results) => {
      if (error) {
        console.error(`Error checking user ${userId}:`, error);
        return res.status(500).json({ message: "Server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      db.query(
        "UPDATE users SET role = ? WHERE id = ?",
        [role, userId],
        (error, results) => {
          if (error) {
            console.error(`Error updating user role:`, error);
            return res.status(500).json({ message: "Server error" });
          }

          res.status(200).json({
            message: "User role updated successfully",
            user: {
              id: userId,
              role,
            },
          });
        }
      );
    });
  } catch (error) {
    console.error(`Error updating user role:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    db.query(
      "SELECT COUNT(*) as total, SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count FROM users",
      (error, userResults) => {
        if (error) {
          console.error("Error getting user stats:", error);
          return res.status(500).json({ message: "Server error" });
        }

        db.query(
          `SELECT COUNT(*) as total, 
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
           SUM(CASE WHEN status = 'claimed' THEN 1 ELSE 0 END) as claimed_count
           FROM found_items`,
          (error, foundItemResults) => {
            if (error) {
              console.error("Error getting found items stats:", error);
              return res.status(500).json({ message: "Server error" });
            }

            db.query(
              `SELECT COUNT(*) as total, 
               SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
               SUM(CASE WHEN status = 'found' THEN 1 ELSE 0 END) as found_count
               FROM lost_items`,
              (error, lostItemResults) => {
                if (error) {
                  console.error("Error getting lost items stats:", error);
                  return res.status(500).json({ message: "Server error" });
                }

                db.query(
                  `SELECT COUNT(*) as total, 
                   SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                   SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                   SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
                   FROM item_claims`,
                  (error, claimsResults) => {
                    if (error) {
                      console.error("Error getting claims stats:", error);
                      return res.status(500).json({ message: "Server error" });
                    }

                    db.query(
                      `SELECT c.id, c.name, COUNT(f.id) as item_count
                       FROM categories c
                       LEFT JOIN found_items f ON c.id = f.category_id
                       GROUP BY c.id
                       ORDER BY item_count DESC
                       LIMIT 5`,
                      (error, categoriesResults) => {
                        if (error) {
                          console.error(
                            "Error getting categories stats:",
                            error
                          );
                          return res
                            .status(500)
                            .json({ message: "Server error" });
                        }

                        // Get recent items
                        db.query(
                          `SELECT f.id, f.item_name, f.status, f.created_at, 'found' as type
                           FROM found_items f
                           ORDER BY f.created_at DESC
                           LIMIT 5`,
                          (error, recentFoundResults) => {
                            if (error) {
                              console.error(
                                "Error getting recent found items:",
                                error
                              );
                              return res
                                .status(500)
                                .json({ message: "Server error" });
                            }

                            db.query(
                              `SELECT l.id, l.item_name, l.status, l.created_at, 'lost' as type
                               FROM lost_items l
                               ORDER BY l.created_at DESC
                               LIMIT 5`,
                              (error, recentLostResults) => {
                                if (error) {
                                  console.error(
                                    "Error getting recent lost items:",
                                    error
                                  );
                                  return res
                                    .status(500)
                                    .json({ message: "Server error" });
                                }

                                const recentItems = [
                                  ...recentFoundResults,
                                  ...recentLostResults,
                                ]
                                  .sort(
                                    (a, b) =>
                                      new Date(b.created_at) -
                                      new Date(a.created_at)
                                  )
                                  .slice(0, 5);

                                res.status(200).json({
                                  users: {
                                    total: userResults[0].total,
                                    admin_count: userResults[0].admin_count,
                                    user_count:
                                      userResults[0].total -
                                      userResults[0].admin_count,
                                  },
                                  found_items: foundItemResults[0],
                                  lost_items: lostItemResults[0],
                                  claims: claimsResults[0],
                                  top_categories: categoriesResults,
                                  recent_items: recentItems,
                                });
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};
