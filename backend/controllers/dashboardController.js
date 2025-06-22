const db = require("../config/database");

exports.getUserStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Getting statistics for user ID: ${userId}`);

    // Helper function untuk menjalankan query
    const executeQuery = (query, params) => {
      return new Promise((resolve, reject) => {
        db.query(query, params, (error, results) => {
          if (error) {
            console.error("Query error:", error);
            reject(error);
          } else {
            resolve(results[0]?.count || 0);
          }
        });
      });
    };

    // 1. Jumlah barang temuan yang dilaporkan oleh pengguna
    const foundItemsQuery = `
        SELECT COUNT(*) as count 
        FROM found_items 
        WHERE user_id = ?
      `;

    // 2. Jumlah barang hilang yang dilaporkan oleh pengguna
    const lostItemsQuery = `
        SELECT COUNT(*) as count 
        FROM lost_items 
        WHERE user_id = ?
      `;

    // 3. Jumlah barang yang di-match (berdasarkan item_claims yang approved)
    // Pengguna bisa menjadi pelapor barang hilang atau penemu barang
    const matchedItemsQuery = `
        SELECT COUNT(*) as count 
        FROM item_claims ic
        JOIN found_items fi ON ic.item_id = fi.id
        WHERE (ic.user_id = ? OR fi.user_id = ?)
        AND ic.status = 'approved'
      `;

    // 4. Jumlah klaim yang menunggu review (status pending)
    const pendingClaimsQuery = `
        SELECT COUNT(*) as count 
        FROM item_claims
        WHERE user_id = ? AND status = 'pending'
      `;

    // Jalankan semua query secara paralel
    const [foundItems, lostItems, matchedItems, pendingClaims] =
      await Promise.all([
        executeQuery(foundItemsQuery, [userId]),
        executeQuery(lostItemsQuery, [userId]),
        executeQuery(matchedItemsQuery, [userId, userId]),
        executeQuery(pendingClaimsQuery, [userId]),
      ]);

    console.log("Statistics retrieved:", {
      foundItems,
      lostItems,
      matchedItems,
      pendingClaims,
    });

    res.status(200).json({
      foundItems,
      lostItems,
      matchedItems,
      pendingClaims,
    });
  } catch (error) {
    console.error("Error getting user statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
};
