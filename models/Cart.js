const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
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
        }
    }]
}, {
    timestamps: true
});

// Calculate total amount before saving
cartSchema.pre('save', async function(next) {
    if (this.isModified('items')) {
        await this.populate('items.product', 'price');
        this.totalAmount = this.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    }
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 