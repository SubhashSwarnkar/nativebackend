const CartItem = require('../models/Cart');
const Product = require('../models/Product');

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;
        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({ message: 'Valid productId is required' });
        }
        if (!quantity || typeof quantity !== 'number' || quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be a positive number' });
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        let cartItem = await CartItem.findOne({ user: userId, product: productId });
        if (cartItem) {
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            cartItem = new CartItem({ user: userId, product: productId, quantity });
            await cartItem.save();
        }
        cartItem = await cartItem.populate('product');
        res.json({ success: true, data: cartItem, message: 'Product added to cart' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get cart
exports.getCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const cartItems = await CartItem.find({ user: userId }).populate('product');
        res.json({ success: true, data: cartItems });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { quantity } = req.body;
        const productId = req.params.productId;
        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({ message: 'Valid productId is required' });
        }
        if (!quantity || typeof quantity !== 'number' || quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be a positive number' });
        }
        const cartItem = await CartItem.findOneAndUpdate(
            { user: userId, product: productId },
            { quantity },
            { new: true }
        ).populate('product');
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }
        res.json({ success: true, data: cartItem, message: 'Cart item updated' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;
        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({ message: 'Valid productId is required' });
        }
        const cartItem = await CartItem.findOneAndDelete({ user: userId, product: productId });
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }
        res.json({ success: true, message: 'Product removed from cart' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user._id;
        await CartItem.deleteMany({ user: userId });
        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 