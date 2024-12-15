const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },

        count: { type: Number, required: true },
      },
    ],
  },
  role: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

userSchema.methods.addToCart = function (product, count) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === product._id.toString();
  });
  let newCount = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newCount = this.cart.items[cartProductIndex].count + +count;
    updatedCartItems[cartProductIndex].count = newCount;
  } else {
    updatedCartItems.push({
      productId: product._id,
      count: count,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item.productId.toString() !== productId.toString();
  });
  // this.cart.items = updatedCartItems;
  return this.model('User')
    .updateOne({ _id: this._id }, { $set: { 'cart.items': updatedCartItems } })
    .exec();
};

userSchema.methods.updateCount = function (productId, count) {
  const cart = this.cart.items;

  const cartIndex = cart.findIndex(p => p.productId.toString() === productId);
  this.cart.items[cartIndex].count = count;
  return this.model('User')
    .updateOne({ _id: this._id }, { $set: { 'cart.items': this.cart.items } })
    .exec();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
