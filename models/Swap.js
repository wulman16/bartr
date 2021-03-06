const mongoose = require(`mongoose`);
const Schema = mongoose.Schema;

const SwapSchema = new Schema({
  item1: {
    type: Schema.Types.ObjectId,
    ref: `items`
  },
  item2: {
    type: Schema.Types.ObjectId,
    ref: `items`
  },
  item1User: {
    type: Schema.Types.ObjectId,
    ref: `users`
  },
  item2User: {
    type: Schema.Types.ObjectId,
    ref: `users`
  },
  pending: {
    type: Boolean,
    default: true
  },
  approved: {
    type: Boolean,
    default: false
  },
  rejected: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Swap = mongoose.model(`swap`, SwapSchema);
