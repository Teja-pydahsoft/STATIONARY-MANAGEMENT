const mongoose = require('mongoose');
const { getCourseConnection } = require('../config/db');

// Define the schema for a product
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      enum: ['Notebooks', 'Pens', 'Art Supplies', 'Electronics', 'Other'],
    },
    // Which course this product belongs to (e.g., b.tech, diploma, degree). If blank, it's global
    forCourse: {
      type: String,
      trim: true,
      default: '',
    },
    // Which year this product applies to (1,2,3,4). If blank (0), applies to all years
    // Allow 0 as a special value meaning "applies to all years" so min must be 0
    year: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    // Optional branch applicability (e.g., CSE, ECE)
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    imageUrl: {
      type: String,
    },
  },
  {
    // Automatically add 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);

// Factory function to get Product model for a specific course
const getProductModel = async (course) => {
  try {
    // Sanitize course name and await the connection
    const connection = await getCourseConnection(course.replace(/\./g, ''));
    return connection.model('Product', productSchema);
  } catch (error) {
    console.error(`Error getting Product model for course ${course}:`, error);
    throw error;
  }
};

// Default model for main database (backward compatibility)
const Product = mongoose.model('Product', productSchema);

module.exports = { Product, getProductModel };