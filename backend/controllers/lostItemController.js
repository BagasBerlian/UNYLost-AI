const LostItem = require("../models/LostItem");
const Category = require("../models/Category");
const FoundItem = require("../models/FoundItem");
const FoundItemImage = require("../models/FoundItemImage");
const { validationResult } = require("express-validator");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

const aiLayerBaseUrl = process.env.AI_LAYER_URL || "http://localhost:8000";

exports.createLostItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      item_name,
      category_id,
      description,
      last_seen_location,
      lost_date,
      reward,
    } = req.body;
    const userId = req.user.id;

    const category = await Category.getById(category_id);
    if (!category) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Invalid category" });
    }

    const itemData = {
      user_id: userId,
      item_name,
      category_id,
      description,
      last_seen_location,
      lost_date,
      reward,
      status: "active",
    };

    if (req.file) {
      const localImageUrl = `/uploads/${path.basename(req.file.path)}`;
      itemData.image_url = localImageUrl;
    }

    const newItem = await LostItem.create(itemData);
    const itemId = newItem.id;

    const firebaseData = {
      item_name,
      description: description || "",
      last_seen_location,
      category: category.name,
      date_lost: lost_date,
      owner_id: userId.toString(),
      reward: reward || "",
      status: "active",
      mysql_id: itemId.toString(),
    };

    if (req.file) {
      const form = new FormData();
      Object.keys(firebaseData).forEach((key) => {
        form.append(key, firebaseData[key]);
      });

      const fileStream = fs.createReadStream(req.file.path);
      form.append("file", fileStream, {
        filename: req.file.originalname || "image.jpg",
        contentType: req.file.mimetype || "image/jpeg",
      });

      try {
        const aiResponse = await axios.post(
          `${aiLayerBaseUrl}/lost-items/add`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );

        if (aiResponse.data && aiResponse.data.item_id) {
          await LostItem.update(itemId, {
            firestore_id: aiResponse.data.item_id,
            image_url: aiResponse.data.image_url || itemData.image_url,
          });

          const matches = aiResponse.data.matches || [];

          res.status(201).json({
            message: "Lost item created successfully",
            item: { ...newItem, firestore_id: aiResponse.data.item_id },
            image_url: aiResponse.data.image_url || itemData.image_url,
            potential_matches: matches,
          });
        } else {
          throw new Error("No item_id returned from AI Layer");
        }
      } catch (aiError) {
        console.error("Error communicating with AI layer:", aiError);
        await LostItem.update(itemId, { needs_sync: true });
        res.status(201).json({
          message: "Lost item created successfully, but AI processing failed",
          item: newItem,
          image_url: itemData.image_url,
          warning:
            "Item not synced with AI system, matching functionality limited",
        });
      }
    } else {
      try {
        const aiResponse = await axios.post(
          `${aiLayerBaseUrl}/lost-items/add-text`,
          firebaseData
        );

        if (aiResponse.data && aiResponse.data.item_id) {
          await LostItem.update(itemId, {
            firestore_id: aiResponse.data.item_id,
          });

          const matches = aiResponse.data.matches || [];

          res.status(201).json({
            message: "Lost item created successfully",
            item: { ...newItem, firestore_id: aiResponse.data.item_id },
            potential_matches: matches,
          });
        } else {
          throw new Error("No item_id returned from AI Layer");
        }
      } catch (aiError) {
        console.error("Error communicating with AI layer:", aiError);

        await LostItem.update(itemId, { needs_sync: true });

        res.status(201).json({
          message: "Lost item created successfully, but AI processing failed",
          item: newItem,
          warning:
            "Item not synced with AI system, matching functionality limited",
        });
      }
    }
  } catch (error) {
    console.error("Error creating lost item:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.getLostItemById = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await LostItem.getById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    res.status(200).json({ item });
  } catch (error) {
    console.error(`Error getting lost item ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateLostItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const itemId = req.params.id;
    const {
      item_name,
      category_id,
      description,
      last_seen_location,
      lost_date,
      image_url,
      reward,
      status,
    } = req.body;

    const existingItem = await LostItem.getById(itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    if (existingItem.user_id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this item" });
    }

    const itemData = {};

    if (item_name) itemData.item_name = item_name;
    if (category_id) {
      const category = await Category.getById(category_id);
      if (!category) {
        return res.status(400).json({ message: "Invalid category" });
      }
      itemData.category_id = category_id;
    }
    if (description !== undefined) itemData.description = description;
    if (last_seen_location) itemData.last_seen_location = last_seen_location;
    if (lost_date) itemData.lost_date = lost_date;
    if (image_url) itemData.image_url = image_url;
    if (reward !== undefined) itemData.reward = reward;
    if (status && ["active", "found", "closed"].includes(status)) {
      itemData.status = status;
    }

    const updated = await LostItem.update(itemId, itemData);
    if (!updated) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    if (existingItem.firestore_id && Object.keys(itemData).length > 0) {
      try {
        await axios.put(
          `${aiLayerBaseUrl}/image-matcher/items/${existingItem.firestore_id}`,
          {
            ...itemData,
            category: category_id
              ? (
                  await Category.getById(category_id)
                ).name
              : undefined,
            last_seen_location:
              last_seen_location || existingItem.last_seen_location,
            date_lost: lost_date || existingItem.lost_date,
          }
        );
      } catch (aiError) {
        console.error("Error updating item in AI layer:", aiError);
      }
    }

    res.status(200).json({
      message: "Lost item updated successfully",
      item: { id: itemId, ...itemData },
    });
  } catch (error) {
    console.error(`Error updating lost item ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteLostItem = async (req, res) => {
  try {
    const itemId = req.params.id;

    const existingItem = await LostItem.getById(itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    if (existingItem.user_id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this item" });
    }

    const deleted = await LostItem.delete(itemId);
    if (!deleted) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    if (existingItem.firestore_id) {
      try {
        await axios.delete(
          `${aiLayerBaseUrl}/image-matcher/items/${existingItem.firestore_id}`
        );
      } catch (aiError) {
        console.error("Error deleting item in AI layer:", aiError);
      }
    }

    res.status(200).json({ message: "Lost item deleted successfully" });
  } catch (error) {
    console.error(`Error deleting lost item ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getLostItemsByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view these items" });
    }

    const items = await LostItem.getByUser(userId, limit, offset);
    const totalItems = await LostItem.getCount({ userId });

    res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    console.error("Error getting lost items by user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getLostItemsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const category = await Category.getById(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const items = await LostItem.getByCategory(categoryId, limit, offset);
    const totalItems = await LostItem.getCount({ categoryId });

    res.status(200).json({
      category,
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    console.error("Error getting lost items by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.searchLostItems = async (req, res) => {
  try {
    const keywords = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!keywords) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const items = await LostItem.search(keywords, limit, offset);

    res.status(200).json({
      items,
      query: keywords,
      count: items.length,
    });
  } catch (error) {
    console.error("Error searching lost items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllLostItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const filters = {};

    if (
      req.query.status &&
      ["active", "found", "closed"].includes(req.query.status)
    ) {
      filters.status = req.query.status;
    }

    if (req.query.categoryId) {
      filters.categoryId = req.query.categoryId;
    }

    if (req.query.fromDate) {
      filters.fromDate = req.query.fromDate;
    }

    if (req.query.toDate) {
      filters.toDate = req.query.toDate;
    }

    const items = await LostItem.getAll(filters, limit, offset);
    const totalItems = await LostItem.getCount(filters);

    res.status(200).json({
      items,
      filters,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    console.error("Error getting all lost items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateLostItemStatus = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { status } = req.body;

    if (!["active", "found", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existingItem = await LostItem.getById(itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    if (existingItem.user_id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update status" });
    }

    const updated = await LostItem.updateStatus(itemId, status);
    if (!updated) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    if (existingItem.firestore_id) {
      try {
        await axios.put(
          `${aiLayerBaseUrl}/image-matcher/items/${existingItem.firestore_id}/status`,
          {
            status,
          }
        );
      } catch (aiError) {
        console.error("Error updating item status in AI layer:", aiError);
      }
    }

    res.status(200).json({
      message: "Lost item status updated successfully",
      item: { id: itemId, status },
    });
  } catch (error) {
    console.error(`Error updating lost item status ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.findPotentialMatches = async (req, res) => {
  try {
    const itemId = req.params.id;

    const lostItem = await LostItem.getById(itemId);
    if (!lostItem) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    if (lostItem.user_id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view matches for this item" });
    }

    let matches = [];
    try {
      const response = await axios.post(
        `${aiLayerBaseUrl}/hybrid-matcher/match`,
        {
          query: lostItem.description,
          image_url: lostItem.image_url,
          image_threshold: 0.3,
          text_threshold: 0.2,
        }
      );
      matches = response.data.matches || [];
    } catch (aiError) {
      console.error("Error communicating with AI layer:", aiError);
      return res.status(500).json({ message: "Error finding matching items" });
    }

    res.status(200).json({
      lostItem,
      matches,
      total_matches: matches.length,
    });
  } catch (error) {
    console.error(
      `Error finding matches for lost item ${req.params.id}:`,
      error
    );
    res.status(500).json({ message: "Server error" });
  }
};

exports.findMatchingItems = async (req, res) => {
  try {
    const { description } = req.body;
    const file = req.file;

    if (!description && !file) {
      return res
        .status(400)
        .json({ message: "Either description or image file is required" });
    }

    console.log(`Mencari barang temuan yang cocok dengan barang hilang...`);
    console.log(`Deskripsi: ${description || "tidak ada"}`);
    console.log(`File gambar: ${file ? file.originalname : "tidak ada"}`);

    let matches = [];

    try {
      if (file) {
        const form = new FormData();

        if (description) {
          form.append("query", description);
        }

        const fileStream = fs.createReadStream(file.path);
        form.append("file", fileStream, {
          filename: file.originalname || "image.jpg",
          contentType: file.mimetype || "image/jpeg",
        });

        const response = await axios.post(
          `${aiLayerBaseUrl}/hybrid-matcher/match`,
          form,
          {
            headers: { ...form.getHeaders() },
            params: {
              collection: "found_items",
            },
          }
        );

        matches = response.data.matches || [];
        console.log(`Ditemukan ${matches.length} kecocokan hybrid`);
      } else if (description) {
        const response = await axios.get(
          `${aiLayerBaseUrl}/text-matcher/search`,
          {
            params: {
              q: description,
              threshold: 0.2,
              collection: "found_items",
            },
          }
        );
        matches = response.data.matches || [];
        console.log(`Ditemukan ${matches.length} kecocokan teks`);
      }
    } catch (aiError) {
      console.error("Error berkomunikasi dengan AI layer:", aiError.message);

      if (aiError.response) {
        console.error("Status error:", aiError.response.status);
        console.error("Data error:", aiError.response.data);
      }

      return res.status(500).json({
        message: "Error finding matching items",
        details: aiError.message,
      });
    } finally {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    const matchedItems = [];
    for (const match of matches) {
      if (match.id) {
        const item = await FoundItem.getByFirestoreId(match.id);
        if (item) {
          const images = await FoundItemImage.getByItemId(item.id);

          matchedItems.push({
            ...item,
            images,
            match_score: match.score,
            match_type: match.match_type,
          });
        }
      }
    }

    res.status(200).json({
      message: "Found items that match your lost item",
      direction: "lost → found",
      matches: matchedItems,
      total_matches: matchedItems.length,
    });
  } catch (error) {
    console.error("Error finding matching items:", error);
    res.status(500).json({ message: "Server error" });
  }
};
