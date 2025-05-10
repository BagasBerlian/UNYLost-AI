const Category = require("../models/Category");
const { validationResult } = require("express-validator");

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.getById(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const foundItemCount = await Category.getFoundItemCount(categoryId);
    const lostItemCount = await Category.getLostItemCount(categoryId);

    res.status(200).json({
      category: {
        ...category,
        foundItemCount,
        lostItemCount,
      },
    });
  } catch (error) {
    console.error(`Error getting category ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, icon, priority } = req.body;
    const categoryData = {
      name,
      description,
      icon,
      priority: priority || 0,
    };

    const newCategory = await Category.create(categoryData);
    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryId = req.params.id;
    const { name, description, icon, priority } = req.body;
    const categoryData = {};

    if (name) categoryData.name = name;
    if (description !== undefined) categoryData.description = description;
    if (icon) categoryData.icon = icon;
    if (priority !== undefined) categoryData.priority = priority;

    const existingCategory = await Category.getById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updated = await Category.update(categoryId, categoryData);
    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category updated successfully",
      category: { id: categoryId, ...categoryData },
    });
  } catch (error) {
    console.error(`Error updating category ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const existingCategory = await Category.getById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const foundItemCount = await Category.getFoundItemCount(categoryId);
    const lostItemCount = await Category.getLostItemCount(categoryId);

    if (foundItemCount > 0 || lostItemCount > 0) {
      return res.status(400).json({
        message: "Cannot delete category with associated items",
        foundItemCount,
        lostItemCount,
      });
    }

    const deleted = await Category.delete(categoryId);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(`Error deleting category ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};
