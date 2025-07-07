// models/PrinterSetting.js
const mongoose = require('mongoose');

const PrinterSettingSchema = new mongoose.Schema({
  interface: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

const PrinterSetting = mongoose.model('PrinterSetting', PrinterSettingSchema);

module.exports = PrinterSetting;

