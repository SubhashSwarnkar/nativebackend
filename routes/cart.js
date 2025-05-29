const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                           stock:
 *                             type: number
 *                       quantity:
 *                         type: number
 *                 totalAmount:
 *                   type: number
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    let cart = await Cart.findOne();

    if (!cart) {
      cart = new Cart({ items: [] });
      await cart.save();
    }

    await cart.populate('items.product', 'name price images stock');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to add
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Quantity of the product
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                           stock:
 *                             type: number
 *                       quantity:
 *                         type: number
 *       400:
 *         description: Invalid input or insufficient stock
 *       404:
 *         description: Product not found
 */
router.post('/items', async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock} items available in stock` 
      });
    }

    let cart = await Cart.findOne();
    if (!cart) {
      cart = new Cart({ items: [] });
    }

    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate('items.product', 'name price images stock');
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   patch:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: New quantity of the product
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                           stock:
 *                             type: number
 *                       quantity:
 *                         type: number
 *       400:
 *         description: Invalid input or insufficient stock
 *       404:
 *         description: Cart or item not found
 */
router.patch('/items/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne();

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(
      item => item.product.toString() === req.params.productId
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const product = await Product.findById(req.params.productId);
    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock} items available in stock` 
      });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name price images stock');
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove
 *     responses:
 *       200:
 *         description: Item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                           stock:
 *                             type: number
 *                       quantity:
 *                         type: number
 *       404:
 *         description: Cart or item not found
 */
router.delete('/items/:productId', async (req, res) => {
  try {
    const cart = await Cart.findOne();

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== req.params.productId
    );

    await cart.save();
    await cart.populate('items.product', 'name price images stock');
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                           stock:
 *                             type: number
 *                       quantity:
 *                         type: number
 *       404:
 *         description: Cart not found
 */
router.delete('/', async (req, res) => {
  try {
    const cart = await Cart.findOne();

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();
    await cart.populate('items.product', 'name price images stock');
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 