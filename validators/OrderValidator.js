const Joi = require('joi');

// Define the Joi schema based on the Order model
const productSchema = Joi.object({
  id: Joi.string().required(), // Assuming 'id' is a string
  name: Joi.string().required(),
  image: Joi.string().required(), // URL or path to image
  price: Joi.number().required(),
  quantity: Joi.number().required(),
  category: Joi.number().required(),
  total: Joi.number().required()

});

const orderSchema = Joi.object({
  table: Joi.number().required(),
  products: Joi.array().items(productSchema).required(),
  totalPrice: Joi.number().required(),
  createdAt: Joi.date().default(Date.now) ,// Optional: defaults to current date
  comments: Joi.string().required(),
  phoneNumber: Joi.string()

});

// Validation function
exports.validateOrder = (data) => {
  return orderSchema.validate(data);
};
