const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  price: { type: Number, required: true }, // price per 100kg
  total_stock: { type: Number, required: true }, 
  images: { type: [String], required: true },
  location: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  ],
  sold_stock: { type: Number, default: 0 },
  listingId: { type: Number, required: true },
});

const Listing = mongoose.model('Listing', ListingSchema);
module.exports = Listing;
