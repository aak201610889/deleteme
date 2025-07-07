const Joi = require('joi'); // Ensure Joi is imported

// Convert model schema to Joi schema
function convertModelSchemaToJoi(schema) {
  const joiSchema = {};



  for (const [key, value] of Object.entries(schema)) {
    if (value === 'String') {
      joiSchema[key] = Joi.string().required();
    } else if (value === 'Number') {
      joiSchema[key] = Joi.number().required();
    } else if (value === 'Boolean') {
      joiSchema[key] = Joi.boolean().required();
    } else if (value === 'Date') {
      joiSchema[key] = Joi.date().required();
    } else if (Array.isArray(value)) {
      // Handle arrays with a well-defined item schema
      if (value.length > 0 && typeof value[0] === 'object') {
        joiSchema[key] = Joi.array().items(convertModelSchemaToJoi(value[0])).required();
      } else {
        // Handle case where array schema is not well defined or contains primitive types
        joiSchema[key] = Joi.array().items(Joi.any()).required();
      }
    } else if (typeof value === 'object') {
      joiSchema[key] = Joi.object(convertModelSchemaToJoi(value)).required();
    } else {
      throw new Error('Unsupported schema type for key: ' + key);
    }
  }



  return joiSchema;
}

// Define schema based on your modelSchema
const modelSchema = {
    "Image": "String",
    "Name": "String",
    "Desc": "String",
    "Price": "Number",
     "Category":"String",


};
const ProductSchema = Joi.object(convertModelSchemaToJoi(modelSchema));


exports.validateProduct = (data) => {
  return ProductSchema.validate(data);
};