const LostItem = require("../models/LostItem");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const aiLayerBaseUrl = process.env.AI_LAYER_URL || "http://localhost:8000";

exports.syncLostItemsToFirestore = async (limit = 20) => {
  try {
    console.log(`Starting synchronization of up to ${limit} lost items...`);

    const itemsNeedingSync = await LostItem.getItemsNeedingSync(limit);
    console.log(
      `Found ${itemsNeedingSync.length} items that need synchronization`
    );

    if (itemsNeedingSync.length === 0) {
      return {
        success: true,
        synchronized: 0,
        failed: 0,
        details: [],
      };
    }

    const results = {
      synchronized: 0,
      failed: 0,
      details: [],
    };

    for (const item of itemsNeedingSync) {
      try {
        console.log(`Synchronizing item ${item.id}: ${item.item_name}...`);

        const itemData = {
          item_name: item.item_name,
          description: item.description || "",
          last_seen_location: item.last_seen_location || "",
          category: item.category_name,
          date_lost: item.lost_date
            ? new Date(item.lost_date).toISOString().split("T")[0]
            : "",
          owner_id: item.user_id.toString(),
          reward: item.reward || "",
          mysql_id: item.id.toString(),
          status: item.status,
        };

        let firestoreId;

        if (item.image_url && !item.image_url.startsWith("http")) {
          const imagePath = path.join(__dirname, "..", item.image_url);

          if (fs.existsSync(imagePath)) {
            const form = new FormData();

            Object.keys(itemData).forEach((key) => {
              form.append(key, itemData[key]);
            });

            const fileStream = fs.createReadStream(imagePath);
            form.append("file", fileStream, {
              filename: path.basename(imagePath),
              contentType: "image/jpeg",
            });

            const response = await axios.post(
              `${aiLayerBaseUrl}/lost-items/add`,
              form,
              {
                headers: {
                  ...form.getHeaders(),
                },
              }
            );

            if (response.data && response.data.item_id) {
              firestoreId = response.data.item_id;

              if (response.data.image_url) {
                await LostItem.update(item.id, {
                  image_url: response.data.image_url,
                });
              }
            } else {
              throw new Error("No item_id returned from AI Layer");
            }
          } else {
            console.warn(
              `Image file not found: ${imagePath}. Continuing with text-only sync.`
            );

            const response = await axios.post(
              `${aiLayerBaseUrl}/lost-items/add-text`,
              itemData
            );

            if (response.data && response.data.item_id) {
              firestoreId = response.data.item_id;
            } else {
              throw new Error("No item_id returned from AI Layer");
            }
          }
        } else {
          if (item.image_url && item.image_url.startsWith("http")) {
            itemData.image_url = item.image_url;
          }

          const response = await axios.post(
            `${aiLayerBaseUrl}/lost-items/add-text`,
            itemData
          );

          if (response.data && response.data.item_id) {
            firestoreId = response.data.item_id;
          } else {
            throw new Error("No item_id returned from AI Layer");
          }
        }

        await LostItem.markSynced(item.id, firestoreId);

        results.synchronized++;
        results.details.push({
          id: item.id,
          item_name: item.item_name,
          firestore_id: firestoreId,
          status: "success",
        });

        console.log(
          `Successfully synchronized item ${item.id} with Firestore ID ${firestoreId}`
        );
      } catch (error) {
        console.error(`Error synchronizing item ${item.id}:`, error);

        await LostItem.markSyncFailed(
          item.id,
          error.message || "Unknown error during synchronization"
        );

        results.failed++;
        results.details.push({
          id: item.id,
          item_name: item.item_name,
          status: "failed",
          error: error.message || "Unknown error",
        });
      }
    }

    console.log(
      `Synchronization complete. Succeeded: ${results.synchronized}, Failed: ${results.failed}`
    );
    return {
      success: true,
      ...results,
    };
  } catch (error) {
    console.error("Error in synchronization service:", error);
    return {
      success: false,
      error: error.message,
      synchronized: 0,
      failed: 0,
      details: [],
    };
  }
};

// Fungsi yang sama untuk FoundItem bisa diimplementasikan di sini
