import express from "express";
import Category from "../models/category.js";
import { uploadToCloudinary } from "../lib/cloudinary.js";

const router = express.Router();

/**
 * @desc    Get all categories with images
 * @route   GET /api/categories
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    res.json({
      success: true,
      categories: categories.map((cat) => ({
        key: cat.key,
        label: cat.label,
        image: cat.image,
        icon: cat.icon,
        description: cat.description,
      })),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

/**
 * @desc    Get single category by key
 * @route   GET /api/categories/:key
 * @access  Public
 */
router.get("/:key", async (req, res) => {
  try {
    const category = await Category.findOne({ key: req.params.key }).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
});

/**
 * @desc    Create or update category with image
 * @route   POST /api/categories
 * @access  Admin (add auth middleware in production)
 */
router.post("/", async (req, res) => {
  try {
    const { key, label, image, icon, description, displayOrder } = req.body;

    if (!key || !label) {
      return res.status(400).json({
        success: false,
        message: "Key and label are required",
      });
    }

    let imageUrl = image;
    let iconUrl = icon;

    // Upload image to Cloudinary if it's a base64 string
    if (image && image.startsWith("data:")) {
      try {
        const result = await uploadToCloudinary(
          image,
          `categories/${key}/image`
        );
        imageUrl = result.secure_url;
      } catch (uploadErr) {
        console.error("Failed to upload category image:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload category image",
          error: uploadErr.message,
        });
      }
    }

    // Upload icon to Cloudinary if it's a base64 string
    if (icon && icon.startsWith("data:")) {
      try {
        const result = await uploadToCloudinary(icon, `categories/${key}/icon`);
        iconUrl = result.secure_url;
      } catch (uploadErr) {
        console.error("Failed to upload category icon:", uploadErr);
      }
    }

    // Upsert category
    const category = await Category.findOneAndUpdate(
      { key },
      {
        key,
        label,
        image: imageUrl,
        icon: iconUrl,
        description: description || "",
        displayOrder: displayOrder || 0,
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Category saved successfully",
      category,
    });
  } catch (error) {
    console.error("Error saving category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save category",
      error: error.message,
    });
  }
});

/**
 * @desc    Update category image only
 * @route   PUT /api/categories/:key/image
 * @access  Admin (add auth middleware in production)
 */
router.put("/:key/image", async (req, res) => {
  try {
    const { key } = req.params;
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    let imageUrl = image;

    // Upload image to Cloudinary if it's a base64 string
    if (image.startsWith("data:")) {
      try {
        const result = await uploadToCloudinary(
          image,
          `categories/${key}/image`
        );
        imageUrl = result.secure_url;
      } catch (uploadErr) {
        console.error("Failed to upload category image:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload category image",
          error: uploadErr.message,
        });
      }
    }

    const category = await Category.findOneAndUpdate(
      { key },
      { image: imageUrl },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category image updated successfully",
      category,
    });
  } catch (error) {
    console.error("Error updating category image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category image",
      error: error.message,
    });
  }
});

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:key
 * @access  Admin (add auth middleware in production)
 */
router.delete("/:key", async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { key: req.params.key },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
});

/**
 * @desc    Initialize default categories (seed data)
 * @route   POST /api/categories/seed
 * @access  Admin (add auth middleware in production)
 */
router.post("/seed", async (req, res) => {
  try {
    const defaultCategories = [
      {
        key: "Car",
        label: "Car",
        description: "Four-wheeler vehicles for comfortable rides",
        displayOrder: 1,
        isActive: true,
      },
      {
        key: "Bike",
        label: "Bike",
        description: "Two-wheeler motorcycles for quick travel",
        displayOrder: 2,
        isActive: true,
      },
      {
        key: "Scooty",
        label: "Scooty",
        description: "Two-wheeler scooters for easy commuting",
        displayOrder: 3,
        isActive: true,
      },
    ];

    const promises = defaultCategories.map((cat) =>
      Category.findOneAndUpdate({ key: cat.key }, cat, {
        upsert: true,
        new: true,
      })
    );

    const categories = await Promise.all(promises);

    res.json({
      success: true,
      message: "Default categories initialized",
      categories,
    });
  } catch (error) {
    console.error("Error seeding categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed categories",
      error: error.message,
    });
  }
});

export default router;
