const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: function() {
            return this._id;
        }
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String
    },
    address: {
        type: String
    },
    profilePicture: {
        type: String
    },
    preferences: {
        notifications: {
            type: Boolean,
            default: true
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        }
    },
    addresses: [{
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
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        longitude: {
            type: Number,
            required: true
        },
        latitude: {
            type: Number,
            required: true
        }
    }]
}, {
    timestamps: true
});

// Hash password before saving and set isAdmin based on role
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    // Set isAdmin based on role
    user.isAdmin = user.role === 'admin';
    next();
});

// Find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 