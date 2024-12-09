const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  category: {
    type: String,
    required: true,
  },
  img1: {
    type: String,
    // required: true,
    default: '',
  },
  img2: {
    type: String,
    // required: true,
    default: '',
  },
  img3: {
    type: String,
    // required: true,
    default: '',
  },
  long_desc: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  short_desc: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Product', productSchema);
