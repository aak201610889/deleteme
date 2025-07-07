const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
  ],
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    required: true,
    default: "Pending",
  },
  totalPrice: { type: Number, required: true },
  reason: {
    type: String,
    validate: {
      validator: function (value) {
        // Only require `reason` if the status is 'Failed'
        return this.status !== "Failed" || (this.status === "Failed" && value);
      },
      message: "Reason is required if the status is Failed",
    },
  },
});

const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;
