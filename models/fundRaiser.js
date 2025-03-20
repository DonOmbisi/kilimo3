const mongoose = require('mongoose');

const FundraiserSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  target_funds: { type: Number, required: true },
  deadline: { type: Date, required: true },
  images: { type: [String], required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  projectId: { type: Number, required: true },
  amt_collected: { type: Number, default: 0 },
  donators: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      amount_donated: { type: Number, required: true },
      donated_at: { type: Date, default: Date.now }
    }
  ]
});
FundraiserSchema.virtual('donatorsCount').get(function () {
  return this.donators?.length;
});
FundraiserSchema.set('toObject', { virtuals: true });
FundraiserSchema.set('toJSON', { virtuals: true });
  
const Fundraiser = mongoose.model('Fundraiser', FundraiserSchema);
module.exports = Fundraiser;
