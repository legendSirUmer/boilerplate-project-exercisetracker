const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0
  },
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
});

const User = mongoose.model('User', UserSchema);

module.exports = User;