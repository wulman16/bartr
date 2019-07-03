const mongoose = require(`mongoose`);
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: `users`
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Item = mongoose.model(`item`, ItemSchema);
