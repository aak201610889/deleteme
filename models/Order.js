const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid"); // Import UUID library
const Schema = mongoose.Schema;

// Define the schema for an Order
const OrderSchema = new Schema({
  _id: {
    type: String, // Use String instead of ObjectId for custom IDs
    default: () => `ord-${uuidv4().replace(/-/g, "").substring(0, 8)}`, // Custom ID with prefix
  },
  table: {
    type: String,
    required: true,
  },
  products: [
    {
      id: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      category: {
        type: String,
      },
      image: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    default: 0, // Default tax to 0 if not specified
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  phoneNumber: { type: String },
  username: { type: String },
  reason: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  comments: { type: String, default: "" },
});

// Create the Order model
const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
