// controllers/categoryController.js
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');
// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};



// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const image = req.file?.path || "";

    const { name } = req.body;

    if (!name || !image) {
      return res.status(400).json({ error: 'Name and image are required' });
    }

    const category = new Category({ name, image });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
};


exports.deleteCategory = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Fetch the category by ID to get the image path
      const category = await Category.findById(id);
  
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
  
      // Path to the uploads folder (adjust according to your setup)
      const uploadDir = path.join(process.cwd(), 'uploads'); // assuming 'uploads' folder is at the root of the project
  
      // If the category has an image, delete it from the uploads directory
      if (category.image) {
        const imagePath = path.join(uploadDir, category.image); // Construct the full path to the image
  
        // Check if the file exists and delete it
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath); // Delete the image file
          console.log(`Deleted image: ${imagePath}`);
        } else {
          console.log(`Image not found: ${imagePath}`);
        }
      }
  
      // Now delete the category from the database
      await Category.findByIdAndDelete(id);
  
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  };