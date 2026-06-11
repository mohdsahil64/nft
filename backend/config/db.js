const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected Successfully');

    // Initialize NFT config if not exists
    const NFTConfig = require('../models/NFTConfig');
    const existing = await NFTConfig.findOne();
    if (!existing) {
      await NFTConfig.create({
        totalMinted: 0,
        currentPrice: 0.01,
        priceRanges: [
          { from: 0,       to: 50000,  price: 0.01 },
          { from: 50001,   to: 100000, price: 0.02 },
          { from: 100001,  to: 150000, price: 0.04 },
          { from: 150001,  to: 200000, price: 0.08 },
          { from: 200001,  to: 250000, price: 0.16 },
          { from: 250001,  to: 300000, price: 0.32 },
          { from: 300001,  to: 350000, price: 0.64 },
          { from: 350001,  to: 400000, price: 1.28 },
          { from: 400001,  to: 450000, price: 2.56 },
          { from: 450001,  to: 500000, price: 5.12 },
          { from: 500001,  to: 2100000, price: 10.24 },
        ],
        signupBonusAmount: 100,
      });
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
