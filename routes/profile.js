// All profile-related APIs and Swagger docs removed.

const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/profile/{_id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/:_id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/profile/{_id}:
 *   put:
 *     summary: Update user basic profile information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid input data
 */
router.put('/:_id', auth, async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the authenticated user is updating their own profile
    if (req.user._id.toString() !== req.params._id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { name, email, phone, profilePicture } = req.body;
    const updates = {};

    // Validate and update name
    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters long' });
      }
      updates.name = name.trim();
    }

    // Validate and update email
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.params._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updates.email = email.toLowerCase().trim();
    }

    // Validate and update phone
    if (phone) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }
      updates.phone = phone.trim();
    }

    // Update profile picture
    if (profilePicture) {
      updates.profilePicture = profilePicture;
    }

    // If no updates provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    // Update the user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.params._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      message: 'Error updating profile',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/profile/{_id}/addresses:
 *   post:
 *     summary: Add a new address to user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - street
 *               - city
 *               - state
 *               - country
 *               - zipCode
 *               - longitude
 *               - latitude
 *             properties:
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               longitude:
 *                 type: number
 *               latitude:
 *                 type: number
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address added successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid input data
 */
router.post('/:_id/addresses', auth, async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the authenticated user is updating their own profile
    if (req.user._id.toString() !== req.params._id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { street, city, state, country, zipCode, longitude, latitude, isDefault } = req.body;

    // Validate required fields
    if (!street || !city || !state || !country || !zipCode || longitude === undefined || latitude === undefined) {
      return res.status(400).json({
        message: 'All fields (street, city, state, country, zipCode, longitude, latitude) are required'
      });
    }

    // Validate coordinates
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      return res.status(400).json({
        message: 'Longitude and latitude must be numbers'
      });
    }

    // Validate coordinate ranges
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        message: 'Invalid coordinate ranges. Longitude must be between -180 and 180, latitude between -90 and 90'
      });
    }

    // Create new address object
    const newAddress = {
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      zipCode: zipCode.trim(),
      longitude,
      latitude,
      isDefault: isDefault || false
    };

    // If this is the first address or marked as default, update other addresses
    if (isDefault || user.addresses.length === 0) {
      await User.updateMany(
        { _id: req.params._id },
        { $set: { 'addresses.$[].isDefault': false } }
      );
      newAddress.isDefault = true;
    }

    // Add the new address
    const updatedUser = await User.findByIdAndUpdate(
      req.params._id,
      { $push: { addresses: newAddress } },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Address added successfully',
      address: newAddress,
      user: updatedUser
    });
  } catch (error) {
    console.error('Address update error:', error);
    res.status(500).json({ 
      message: 'Error adding address',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/profile/{_id}/addresses/{addressId}:
 *   delete:
 *     summary: Delete an address from user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: The address ID to delete
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or address not found
 */
router.delete('/:_id/addresses/:addressId', auth, async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the authenticated user is updating their own profile
    if (req.user._id.toString() !== req.params._id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    // Find the address to delete
    const addressToDelete = user.addresses.id(req.params.addressId);
    if (!addressToDelete) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If deleting the default address and there are other addresses, set the first one as default
    if (addressToDelete.isDefault && user.addresses.length > 1) {
      const remainingAddresses = user.addresses.filter(addr => addr._id.toString() !== req.params.addressId);
      if (remainingAddresses.length > 0) {
        remainingAddresses[0].isDefault = true;
      }
    }

    // Remove the address
    await User.findByIdAndUpdate(
      req.params._id,
      { $pull: { addresses: { _id: req.params.addressId } } }
    );

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 