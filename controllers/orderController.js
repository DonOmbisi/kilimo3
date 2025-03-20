const User = require('../models/user');
const Listing = require('../models/listing');
const Order = require('../models/order');

// Create order
// req.body: { listing_id, amount, quantity, delivery_location }
// res: order
exports.createOrder = async (req, res) => {
  const { listing_id, amount, quantity } = req.body;

  try {
    const listing = await Listing.findById(listing_id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    listing.sold_stock += quantity;
    const user = await User.findById(req.user._id);
    const order = new Order({
      listing: listing_id,
      quantity,
      price: amount,
      buyer: req.user._id,
      seller: listing.owner
    });

    await order.save();
    
    listing.orders.push(order._id);
    await listing.save();
    user.my_order.push(order._id);
    await user.save();

    res.json(order);
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: 'Server error', error });
  }
};

// Confirm order delivery
// req.body: { order_id }
// res: order
exports.confirmDelivery = async (req, res) => {
  const { order_id } = req.body;

  try {
    const user = await User.findById(req.user._id);
    const order = user.my_order.id(order_id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = true;
    await user.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get a single order by ID with listing details
// req.params: { id }
// res: order
exports.getOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('my_order.listing', 'title price location')
      .exec();

    const order = user.my_order.id(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json({ totalOrders: orders.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
