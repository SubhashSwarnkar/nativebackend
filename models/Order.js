const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  shippingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    }
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'upi'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  },
  orderStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  deliveryDate: {
    type: Date
  },
  trackingNumber: String,
  notes: String
}, {
  timestamps: true
});

// Calculate total amount before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order; 