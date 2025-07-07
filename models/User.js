const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String },
    email: {
      type: String,
      sparse: true, // Allows multiple null values without enforcing uniqueness
      validate: {
        validator: function (v) {
          return this.role !== "***" || (v && v.length > 0);
        },
        message: "Email is required for 'Admin' role.",
      },
    },

    phoneNumber: {
      type: String,
      validate: [
        {
          validator(v) {
            return this.role !== "Customer" || Boolean(v);
          },
          message: "Phone number is required for 'Customer' role.",
        },
        {
          validator(v) {
            return !v || /^\d{10}$/.test(v);
          },
          message: "Phone number must be exactly 10 digits.",
        },
      ],
    },
    socketId: { type: String, default: null },
    role: {
      type: String,
      enum: ["Customer", "***"],
      default: "Customer",
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    isReserved: { type: Boolean, default: false },
    tableNumber: {
      type: String,
      validate: {
        validator: function (v) {
          return this.role !== "Customer" || (v && v.length > 0);
        },
        message: "Table number is required for 'Customer' role.",
      },
    },
  },
  {
    toJSON: { versionKey: false },
    toObject: { versionKey: false },
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
