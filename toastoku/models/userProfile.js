const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  anonymous: { type: Boolean, default: false },
  anonymousName: { type: String, default: null },
  rank: {
    level: { type: String, default: "0" },
    exp: { type: String, default: "0" },
  },
  balance: {
    currentToasts: { type: String, default: "0" },
    spentToasts: { type: String, default: "0" },
  },
  misc: {
    votes: { type: String, default: "0" },
    hints: { type: String, default: "0" },
    dailyHints: { type: String, default: "5" },
    boosters: { type: String, default: "0" },
    gamesPlayed: { type: String, default: "0" },
  },
  achieve: {
    badges: { type: [String], default: [] },
  },
  pendingVotes: { type: Number, default: 0 }
});

module.exports = mongoose.model('userProfile', UserProfileSchema, 'userprofiles');
