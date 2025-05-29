const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'grains', 'dairy', 'livestock', 'equipment']
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'box'],
    default: 'piece'
  },
  minOrderQuantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  maxOrderQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  images: [{
    type: String,
    required: true
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmLocation: {
    type: String,
    required: true
  },
  organic: {
    type: Boolean,
    default: false
  },
  harvestDate: Date,
  expiryDate: Date,
  quantityHistory: [{
    type: {
      type: String,
      enum: ['added', 'removed', 'sold', 'returned'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true
});

// Calculate average rating when a review is added
productSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating = sum / this.reviews.length;
  }
  return this.rating;
};

// Method to update stock with history
productSchema.methods.updateStock = async function(quantity, type, reason = '') {
  if (type === 'removed' || type === 'sold') {
    if (this.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.stock -= quantity;
  } else if (type === 'added' || type === 'returned') {
    this.stock += quantity;
  }

  this.quantityHistory.push({
    type,
    quantity,
    reason
  });

  await this.save();
  return this;
};

// Method to check if quantity is available
productSchema.methods.isQuantityAvailable = function(quantity) {
  return this.stock >= quantity && 
         quantity >= this.minOrderQuantity && 
         quantity <= this.maxOrderQuantity;
};

// Pre-save middleware to validate maxOrderQuantity
productSchema.pre('save', function(next) {
  if (this.maxOrderQuantity < this.minOrderQuantity) {
    this.maxOrderQuantity = this.minOrderQuantity;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product; 