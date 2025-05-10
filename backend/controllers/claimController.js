const ItemClaim = require("../models/ItemClaim");
const FoundItem = require("../models/FoundItem");
const { validationResult } = require("express-validator");

exports.createClaim = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { item_id, description, lost_location, lost_date, additional_proof } =
      req.body;

    const userId = req.user.id;

    const item = await FoundItem.getById(item_id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.status !== "approved" && item.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Item is not available for claiming" });
    }

    const alreadyClaimed = await ItemClaim.hasUserClaimedItem(userId, item_id);
    if (alreadyClaimed) {
      return res
        .status(400)
        .json({ message: "You have already claimed this item" });
    }

    const claimData = {
      user_id: userId,
      item_id,
      description,
      lost_location,
      lost_date,
      additional_proof,
      status: "pending",
    };

    const newClaim = await ItemClaim.create(claimData);

    // Kirim notifikasi ke admin bahwa ada klaim baru (Next Sprint)

    res.status(201).json({
      message: "Claim created successfully",
      claim: newClaim,
    });
  } catch (error) {
    console.error("Error creating claim:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getClaimById = async (req, res) => {
  try {
    const claimId = req.params.id;
    const claim = await ItemClaim.getById(claimId);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.user_id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view this claim" });
    }

    res.status(200).json({ claim });
  } catch (error) {
    console.error(`Error getting claim ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateClaimStatus = async (req, res) => {
  try {
    const claimId = req.params.id;
    const { status, admin_notes } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update claim status" });
    }

    const claim = await ItemClaim.getById(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const updated = await ItemClaim.updateStatus(claimId, status, admin_notes);
    if (!updated) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (status === "approved") {
      await FoundItem.updateStatus(claim.item_id, "claimed");

      // Kirim notifikasi ke user pencari (Next Sprint)

      const otherClaims = await ItemClaim.getByItem(claim.item_id);
      for (const otherClaim of otherClaims) {
        if (
          otherClaim.id !== parseInt(claimId) &&
          otherClaim.status === "pending"
        ) {
          await ItemClaim.updateStatus(
            otherClaim.id,
            "rejected",
            "Item telah diklaim oleh orang lain"
          );

          // Kirim notifikasi ke user pencari yang lain (Next Sprint)
        }
      }
    }

    res.status(200).json({
      message: `Claim status updated to ${status}`,
      claim: { id: claimId, status, admin_notes },
    });
  } catch (error) {
    console.error(`Error updating claim status ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserClaims = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (userId != req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view these claims" });
    }

    const claims = await ItemClaim.getByUser(userId, limit, offset);
    const totalClaims = await ItemClaim.getCount({ userId });

    res.status(200).json({
      claims,
      pagination: {
        page,
        limit,
        totalClaims,
        totalPages: Math.ceil(totalClaims / limit),
      },
    });
  } catch (error) {
    console.error("Error getting user claims:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getItemClaims = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const item = await FoundItem.getById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.user_id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view claims for this item" });
    }

    const claims = await ItemClaim.getByItem(itemId, limit, offset);
    const totalClaims = await ItemClaim.getCount({ itemId });

    res.status(200).json({
      item,
      claims,
      pagination: {
        page,
        limit,
        totalClaims,
        totalPages: Math.ceil(totalClaims / limit),
      },
    });
  } catch (error) {
    console.error(`Error getting claims for item ${req.params.itemId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllClaims = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view all claims" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const filters = {};

    if (
      req.query.status &&
      ["pending", "approved", "rejected"].includes(req.query.status)
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

    const claims = await ItemClaim.getAll(filters, limit, offset);
    const totalClaims = await ItemClaim.getCount(filters);

    res.status(200).json({
      claims,
      filters,
      pagination: {
        page,
        limit,
        totalClaims,
        totalPages: Math.ceil(totalClaims / limit),
      },
    });
  } catch (error) {
    console.error("Error getting all claims:", error);
    res.status(500).json({ message: "Server error" });
  }
};
