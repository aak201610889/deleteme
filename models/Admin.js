const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
 
});

const Admin = mongoose.model('Admin', AdminSchema);
module.exports = Admin;
