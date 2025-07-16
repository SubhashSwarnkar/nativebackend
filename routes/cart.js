const express = require('express');
const { auth } = require('../middleware/auth');
const cartController = require('../controllers/cartController');
const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Clear the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.get('/', auth, cartController.getCart);
router.delete('/', auth, cartController.clearCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add item to the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
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
 *               quantity:
 *                 type: number
 *           example:
 *             productId: "64a1b2c3d4e5f6a7b8c9d0e1"
 *             quantity: 2
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CartItem'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or insufficient stock
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/items', auth, cartController.addToCart);

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   patch:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
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
 *           example:
 *             quantity: 3
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CartItem'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or insufficient stock
 *       404:
 *         description: Cart or item not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Cart or item not found
 *       500:
 *         description: Server error
 */
router.patch('/items/:productId', auth, cartController.updateCartItem);
router.delete('/items/:productId', auth, cartController.removeFromCart);

module.exports = router; 