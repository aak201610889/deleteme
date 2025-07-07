const ProductService = require("../services/ProductService");
const { validateProduct } = require("../validators/ProductValidator");
const fs = require("fs");
const path = require("path");
const logger = require('../middlewares/logger');
exports.createProduct = async (req, res) => {
  try {
    const image = req.file?.path || "";

    const { Name, Desc, Category, Price, Discount = null } = req.body;

    const newProduct = { Name, Desc, Category, Price, Discount, Image: image };

    logger.info("Creating a new product", { newProduct });
    const product = await ProductService.createProduct(newProduct);
    logger.info("Product created successfully", { product });
    res.status(201).json(product);
  } catch (error) {
    logger.error("Error in createProduct", { error });

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({ error: errorMessages.join(", ") });
    }

    res.status(500).json({ error: "Internal Server Error" }); // Catch other errors
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    if (!product){
      logger.warn("Product not found", { id: req.params.id });
       return res.status(404).json({ error: "Product not found" });}
    else {
      res.status(201).json(product);
      logger.info("Product fetched successfully", { product });
    }
  } catch (error) {
    logger.error("Error in getProductById", { error });
    res.status(400).json({ error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: req.query.sort || null,
      search: req.query.search || null,
    };
    logger.info("Fetching all products with options", { options });
    const products = await ProductService.getAllProducts(req.query, options);
    logger.info("Products fetched successfully", { productsCount: products.length });
    res.status(200).json(products);
  } catch (error) {
    logger.error("Error in getAllProducts", { error });
    res.status(400).json({ error: error.message });
  }
};
exports.getAllProductsWithoutFilter = async (req, res) => {
  try {
    logger.info("Fetching all products without filter");
    const products = await ProductService.getAllProductsWithoutFilter();
    logger.info("Products fetched successfully", { productsCount: products.length });
    res.status(200).json(products);
  } catch (error) {
    logger.error("Error in getAllProductsWithoutFilter", { error });
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    // Validate request data
    const { error } = validateProduct(req.body);
    logger.warn("Validation error in updateProduct", { error: error.details[0].message });
    if (error) return res.status(400).json({ error: error.details[0].message });
    logger.info("Updating product", { id: req.params.id, updateData: req.body });
    const updatedProduct = await ProductService.updateProduct(
      req.params.id,
      req.body
    );
    if (!updatedProduct)
      {
        logger.warn("Product not found for update", { id: req.params.id });
        return res.status(404).json({ error: "Product not found" })};
        logger.info("Product updated successfully", { updatedProduct });
    res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error("Error in updateProduct", { error });
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    logger.info("Deleting product by ID", { id: req.params.id });
    const product = await ProductService.getProductById(req.params.id);
    if (!product) {logger.warn("Product not found for deletion", { id: req.params.id });
    return res.status(404).json({ error: "Product not found" });}

    // console.log("Current working directory: ", process.cwd());

    // const uploadDir = process.cwd();

    // if (product.Image) {
    //   const imagePath = path.join(uploadDir, product.Image);

    //   if (fs.existsSync(imagePath)) {
    //     fs.unlinkSync(imagePath);
    //     logger.info("Deleted product image", { imagePath });
    //     console.log(`Deleted image: ${imagePath}`);
    //   } else {
    //     logger.warn("Image not found for deletion", { imagePath });
    //     console.log(`Image not found: ${imagePath}`);
    //   }
    // }

    // Now delete the product from the database
    const result = await ProductService.deleteProduct(req.params.id);
    if (!result)
      return res
        .status(404)
        .json({ error: "Product not found in the database" });

        logger.info("Product deleted successfully", { id: req.params.id });
    res.status(204).send();
  } catch (error) {
    logger.error("Error in deleteProduct", { error });
    res.status(400).json({ error: error.message });
  }
};
