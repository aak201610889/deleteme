const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  Image: {
    type: String,
    required: true,
  },
  Name: {
    type: String,
    required: [true, "اسم المنتج مطلوب"],
    minlength: [3, "يجب أن يتكون الاسم من 3 أحرف على الأقل"],
    maxlength: [50, "لا يمكن أن يتجاوز الاسم 50 حرفًا"],
  },
  Desc: {
    type: String,
    required: [true, "الوصف مطلوب"],
    maxlength: [500, "لا يمكن أن يتجاوز الوصف 500 حرف"],
  },
  Price: {
    type: Number,
    required: [true, "السعر مطلوب"],
    min: [0, "لا يمكن أن يكون السعر سالبًا"],
  },
  Category: {
    type: String,
    required: [true, "التصنيف مطلوب"],
    enum: {
      values: [
        "فطور",
        "ساندويش",
        "وجبات",
        "معجنات",
        "شرقي",
        "مشروبات",
        "حلويات",
        "عروض",
      ],
      message: "التصنيف يجب أن يكون معرفًا في قاعدة البيانات",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    required:true,
    default: true,
  },
  Discount: {
    type: String,
    match: [/^\d{1,2}%$/, "يجب أن تكون النسبة المئوية للتخفيض صحيحة (مثل 10%)"],
    default: "0%",
  },
});

module.exports = mongoose.model("Product", ProductSchema);
