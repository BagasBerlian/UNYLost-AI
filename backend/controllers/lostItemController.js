const LostItem = require("../models/LostItem");
const Category = require("../models/Category");
const { validationResult } = require("express-validator");
const axios = require("axios");

const aiLayerBaseUrl = process.env.AI_LAYER_URL || "http://localhost:8000";

exports.createLostItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      item_name,
      category_id,
      description,
      last_seen_location,
      lost_date,
      image_url,
      reward,
    } = req.body;

    const category = await Category.getById(category_id);
    if (!category) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const userId = req.user.id;

    const itemData = {
      user_id: userId,
      item_name,
      category_id,
      description,
      last_seen_location,
      lost_date,
      image_url,
      reward,
      status: "active",
    };

    let firestoreId = null;
    if (image_url) {
      try {
        const aiResponse = await axios.post(
          `${aiLayerBaseUrl}/image-matcher/add-lost-item`,
          {
            item_name,
            description,
            location: last_seen_location,
            category: category.name,
            file_url: image_url,
            owner_id: userId.toString(),
            reward,
          }
        );

        if (aiResponse.data && aiResponse.data.item_id) {
          firestoreId = aiResponse.data.item_id;
          itemData.firestore_id = firestoreId;
        }
      } catch (aiError) {
        console.error("Error communicating with AI layer:", aiError);
      }
    }

    const newItem = await LostItem.create(itemData);

    let matches = [];
    try {
      const matchResponse = await axios.post(
        `${aiLayerBaseUrl}/hybrid-matcher/match`,
        {
          query: description,
          image_url,
          image_threshold: 0.7,
          text_threshold: 0.2,
        }
      );
      matches = matchResponse.data.matches || [];
    } catch (matchError) {
      console.error("Error finding matches:", matchError);
    }

    res.status(201).json({
      message: "Lost item created successfully",
      item: newItem,
      firestore_id: firestoreId,
      potential_matches: matches.length > 0 ? matches.slice(0, 5) : [],
    });
  } catch (error) {
    console.error("Error creating lost item:", error);
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
