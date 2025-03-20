const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  orderId: { type: Number, required: true },
  quantity: { type: Number, required: true },
  price : { type: Number, required: true },
  status: { type: String, default: 'pending' , enum : ['pending', 'delivered'] }
} , { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
