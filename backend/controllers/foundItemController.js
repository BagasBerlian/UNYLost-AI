const FoundItem = require("../models/FoundItem");
const FoundItemImage = require("../models/FoundItemImage");
const Category = require("../models/Category");
const { validationResult } = require("express-validator");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

const aiLayerBaseUrl = process.env.AI_LAYER_URL || "http://localhost:8000";

exports.createFoundItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { item_name, category_id, description, location, found_date } =
      req.body;

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
      location,
      found_date,
      status: "pending",
    };

    const newItem = await FoundItem.create(itemData);
    const itemId = newItem.id;

    const imageUrls = [];
    let firestoreId = null;

    if (req.files && req.files.length > 0) {
      const form = new FormData();
      form.append("item_name", item_name);
      form.append("description", description);
      form.append("location", location);
      form.append("category", category.name);
      form.append("reporter_id", userId.toString());

      req.files.forEach((file) => {
        const fileStream = fs.createReadStream(file.path);
        form.append("files", fileStream, {
          filename: file.originalname || "image.jpg",
          contentType: file.mimetype || "image/jpeg",
        });
      });

      try {
        const aiResponse = await axios.post(
          `${aiLayerBaseUrl}/image-matcher/add-found-item`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );

        if (aiResponse.data && aiResponse.data.item_id) {
          firestoreId = aiResponse.data.item_id;
          await FoundItem.update(itemId, { firestore_id: firestoreId });
        }

        if (aiResponse.data && aiResponse.data.image_url) {
          const primaryImageUrl = aiResponse.data.image_url;

          await FoundItemImage.create({
            found_item_id: itemId,
            image_url: primaryImageUrl,
            is_primary: true,
          });

          imageUrls.push(primaryImageUrl);

          if (
            aiResponse.data.additional_images &&
            aiResponse.data.additional_images.length > 0
          ) {
            for (const url of aiResponse.data.additional_images) {
              await FoundItemImage.create({
                found_item_id: itemId,
                image_url: url,
                is_primary: false,
              });
              imageUrls.push(url);
            }
          }
        }
      } catch (aiError) {
        console.error("Error communicating with AI layer:", aiError);

        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const imageUrl = `/uploads/${path.basename(file.path)}`;

          await FoundItemImage.create({
            found_item_id: itemId,
            image_url: imageUrl,
            is_primary: i === 0,
          });

          imageUrls.push(imageUrl);
        }
      }
    }

    const item = await FoundItem.getById(itemId);
    const images = await FoundItemImage.getByItemId(itemId);

    res.status(201).json({
      message: "Found item created successfully",
      item: {
        ...item,
        images: images,
      },
      firestore_id: firestoreId,
    });
  } catch (error) {
    console.error("Error creating found item:", error);

    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

exports.getFoundItemById = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await FoundItem.getById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Found item not found" });
    }

    const images = await FoundItemImage.getByItemId(itemId);

    res.status(200).json({
      item: {
        ...item,
        images: images,
      },
    });
  } catch (error) {
    console.error(`Error getting found item ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateFoundItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const itemId = req.params.id;
    const { item_name, category_id, description, location, found_date } =
      req.body;

    const existingItem = await FoundItem.getById(itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Found item not found" });
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
    if (location) itemData.location = location;
    if (found_date) itemData.found_date = found_date;

    const updated = await FoundItem.update(itemId, itemData);
    if (!updated) {
      return res.status(404).json({ message: "Found item not found" });
    }

    if (existingItem.firestore_id && Object.keys(itemData).length > 0) {
      try {
        const category = category_id
          ? await Category.getById(category_id)
          : null;
        const categoryName = category ? category.name : undefined;

        await axios.put(
          `${aiLayerBaseUrl}/image-matcher/items/${existingItem.firestore_id}`,
          {
            item_name,
            description,
            location,
            category: categoryName,
            found_date,
          }
        );
      } catch (aiError) {
        console.error("Error updating item in AI layer:", aiError);
      }
    }

    const updatedItem = await FoundItem.getById(itemId);
    const images = await FoundItemImage.getByItemId(itemId);

    res.status(200).json({
      message: "Found item updated successfully",
      item: {
        ...updatedItem,
        images: images,
      },
    });
  } catch (error) {
    console.error(`Error updating found item ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteFoundItem = async (req, res) => {
  try {
    const itemId = req.params.id;

    const existingItem = await FoundItem.getById(itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Found item not found" });
    }

    if (existingItem.user_id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this item" });
    }

    const images = await FoundItemImage.getByItemId(itemId);
    for (const image of images) {
      if (image.image_url.startsWith("/uploads/")) {
        const filePath = path.join(__dirname, "..", image.image_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
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

    const deleted = await FoundItem.delete(itemId);
    if (!deleted) {
      return res.status(404).json({ message: "Found item not found" });
    }

    res.status(200).json({ message: "Found item deleted successfully" });
  } catch (error) {
    console.error(`Error deleting found item ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFoundItemsByUser = async (req, res) => {
  try {
    // console.log("Current user:", req.user);
    const userId = req.params.userId || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (userId != req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view these items" });
    }

    const items = await FoundItem.getByUser(userId, limit, offset);
    const totalItems = await FoundItem.getCount({ userId });

    const itemsWithImages = [];
    for (const item of items) {
      const images = await FoundItemImage.getByItemId(item.id);
      itemsWithImages.push({
        ...item,
        images: images,
      });
    }

    res.status(200).json({
      items: itemsWithImages,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    console.error("Error getting found items by user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFoundItemsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const category = await Category.getById(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const items = await FoundItem.getByCategory(categoryId, limit, offset);
    const totalItems = await FoundItem.getCount({ categoryId });

    const itemsWithImages = [];
    for (const item of items) {
      const images = await FoundItemImage.getByItemId(item.id);
      itemsWithImages.push({
        ...item,
        images: images,
      });
    }

    res.status(200).json({
      category,
      items: itemsWithImages,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    console.error("Error getting found items by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.searchFoundItems = async (req, res) => {
  try {
    const keywords = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!keywords) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const items = await FoundItem.search(keywords, limit, offset);

    const itemsWithImages = [];
    for (const item of items) {
      const images = await FoundItemImage.getByItemId(item.id);
      itemsWithImages.push({
        ...item,
        images: images,
      });
    }

    res.status(200).json({
      items: itemsWithImages,
      query: keywords,
      count: items.length,
    });
  } catch (error) {
    console.error("Error searching found items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllFoundItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const filters = {};

    if (
      req.query.status &&
      ["pending", "approved", "claimed", "returned", "rejected"].includes(
        req.query.status
      )
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

    const items = await FoundItem.getAll(filters, limit, offset);
    const totalItems = await FoundItem.getCount(filters);

    const itemsWithImages = [];
    for (const item of items) {
      const images = await FoundItemImage.getByItemId(item.id);
      itemsWithImages.push({
        ...item,
        images: images,
      });
    }

    res.status(200).json({
      items: itemsWithImages,
      filters,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    console.error("Error getting all found items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateFoundItemStatus = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { status } = req.body;

    if (
      !["pending", "approved", "claimed", "returned", "rejected"].includes(
        status
      )
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existingItem = await FoundItem.getById(itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Found item not found" });
    }

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update status" });
    }

    const updated = await FoundItem.updateStatus(itemId, status);
    if (!updated) {
      return res.status(404).json({ message: "Found item not found" });
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
      message: "Found item status updated successfully",
      item: { id: itemId, status },
    });
  } catch (error) {
    console.error(`Error updating found item status ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addItemImages = async (req, res) => {
  try {
    const itemId = req.params.id;

    const item = await FoundItem.getById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Found item not found" });
    }

    if (item.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const newImages = [];

    if (item.firestore_id) {
      try {
        const form = new FormData();

        req.files.forEach((file) => {
          const fileStream = fs.createReadStream(file.path);
          form.append("files", fileStream, {
            filename: file.originalname || "image.jpg",
            contentType: file.mimetype || "image/jpeg",
          });
        });

        const aiResponse = await axios.post(
          `${aiLayerBaseUrl}/image-matcher/items/${item.firestore_id}/images`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );

        if (
          aiResponse.data &&
          aiResponse.data.image_urls &&
          aiResponse.data.image_urls.length > 0
        ) {
          const existingImages = await FoundItemImage.getByItemId(itemId);
          const hasPrimary = existingImages.some((img) => img.is_primary);

          for (let i = 0; i < aiResponse.data.image_urls.length; i++) {
            const url = aiResponse.data.image_urls[i];
            const newImage = await FoundItemImage.create({
              found_item_id: itemId,
              image_url: url,
              is_primary: !hasPrimary && i === 0,
            });

            newImages.push(newImage);
          }
        }
      } catch (aiError) {
        console.error("Error adding images to AI layer:", aiError);
      }
    }

    if (newImages.length === 0) {
      const existingImages = await FoundItemImage.getByItemId(itemId);
      const hasPrimary = existingImages.some((img) => img.is_primary);

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/${path.basename(file.path)}`;

        const newImage = await FoundItemImage.create({
          found_item_id: itemId,
          image_url: imageUrl,
          is_primary: !hasPrimary && i === 0,
        });

        newImages.push(newImage);
      }
    }

    const images = await FoundItemImage.getByItemId(itemId);

    res.status(200).json({
      message: "Images added successfully",
      new_images: newImages,
      all_images: images,
    });
  } catch (error) {
    console.error("Error adding images:", error);

    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteItemImage = async (req, res) => {
  try {
    const { id: itemId, imageId } = req.params;

    const item = await FoundItem.getById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Found item not found" });
    }

    if (item.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const image = await FoundItemImage.getById(imageId);
    if (!image || image.found_item_id != itemId) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (image.image_url.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", image.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (item.firestore_id && !image.image_url.startsWith("/uploads/")) {
      try {
        await axios.delete(
          `${aiLayerBaseUrl}/image-matcher/items/${item.firestore_id}/images`,
          {
            data: {
              image_url: image.image_url,
            },
          }
        );
      } catch (aiError) {
        console.error("Error deleting image from AI layer:", aiError);
      }
    }

    await FoundItemImage.delete(imageId);

    if (image.is_primary) {
      const otherImages = await FoundItemImage.getByItemId(itemId);
      if (otherImages.length > 0) {
        await FoundItemImage.setPrimary(otherImages[0].id, itemId);
      }
    }

    const remainingImages = await FoundItemImage.getByItemId(itemId);

    res.status(200).json({
      message: "Image deleted successfully",
      remaining_images: remainingImages,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.setPrimaryImage = async (req, res) => {
  try {
    const { id: itemId, imageId } = req.params;

    const item = await FoundItem.getById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Found item not found" });
    }

    if (item.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const image = await FoundItemImage.getById(imageId);
    if (!image || image.found_item_id != itemId) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (image.is_primary) {
      return res.status(200).json({
        message: "Image is already set as primary",
        image,
      });
    }

    await FoundItemImage.setPrimary(imageId, itemId);

    if (item.firestore_id) {
      try {
        await axios.put(
          `${aiLayerBaseUrl}/image-matcher/items/${item.firestore_id}/primary-image`,
          {
            image_url: image.image_url,
          }
        );
      } catch (aiError) {
        console.error("Error updating primary image in AI layer:", aiError);
      }
    }

    const images = await FoundItemImage.getByItemId(itemId);

    res.status(200).json({
      message: "Primary image set successfully",
      images,
    });
  } catch (error) {
    console.error("Error setting primary image:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.findMatchingItems = async (req, res) => {
  try {
    const { description, image_url } = req.body;

    if (!description && !image_url) {
      return res
        .status(400)
        .json({ message: "Either description or image_url is required" });
    }

    let matches = [];

    try {
      if (image_url) {
        const response = await axios.get(
          `${aiLayerBaseUrl}/hybrid-matcher/search`,
          {
            params: {
              q: description || "",
              image_url,
              image_threshold: 0.3,
              text_threshold: 0.2,
            },
          }
        );
        matches = response.data.matches || [];
      } else if (description) {
        const response = await axios.get(
          `${aiLayerBaseUrl}/text-matcher/search`,
          {
            params: {
              q: description,
              threshold: 0.2,
            },
          }
        );
        matches = response.data.matches || [];
      }
    } catch (aiError) {
      console.error("Error communicating with AI layer:", aiError);
      return res.status(500).json({ message: "Error finding matching items" });
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
      matches: matchedItems,
      total_matches: matchedItems.length,
    });
  } catch (error) {
    console.error("Error finding matching items:", error);
    res.status(500).json({ message: "Server error" });
  }
};
