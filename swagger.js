const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FarmBros E-commerce API',
      version: '1.0.0',
      description: 'API documentation for FarmBros E-commerce platform',
      contact: {
        name: 'API Support',
        email: 'support@farmbros.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://nativebackend.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'uuid' },
            sender_id: { type: 'string', format: 'uuid', nullable: true },
            receiver_id: { type: 'string', format: 'uuid', nullable: true },
            sender_type: { type: 'string', enum: ['user', 'admin'] },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            is_read: { type: 'boolean' }
          }
        },
        MessageResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' }
          }
        },
        UserMessage: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            senderType: { type: 'string', enum: ['user', 'admin'] }
          }
        },
        AdminMessage: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' }
              }
            },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
            addresses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  country: { type: 'string' },
                  zipCode: { type: 'string' },
                  location: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['Point'] },
                      coordinates: {
                        type: 'array',
                        items: { type: 'number' },
                        description: '[longitude, latitude]'
                      }
                    }
                  },
                  isDefault: { type: 'boolean' }
                }
              }
            },
            phone: { type: 'string' },
            profilePicture: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            preferences: {
              type: 'object',
              properties: {
                notifications: {
                  type: 'object',
                  properties: {
                    email: { type: 'boolean' },
                    sms: { type: 'boolean' }
                  }
                }
              }
            }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { 
              type: 'string',
              description: 'User ID reference'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  product: { 
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      name: { type: 'string' },
                      price: { type: 'number' },
                      images: { 
                        type: 'array',
                        items: { type: 'string' }
                      },
                      stock: { type: 'number' },
                      category: { 
                        type: 'string',
                        enum: ['vegetables', 'fruits', 'grains', 'dairy', 'livestock', 'equipment']
                      },
                      unit: {
                        type: 'string',
                        enum: ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'box']
                      },
                      minOrderQuantity: { type: 'number' },
                      maxOrderQuantity: { type: 'number' },
                      seller: { type: 'string' },
                      farmLocation: { type: 'string' },
                      organic: { type: 'boolean' }
                    }
                  },
                  quantity: { 
                    type: 'number',
                    minimum: 1
                  },
                  price: { 
                    type: 'number',
                    minimum: 0
                  }
                },
                required: ['product', 'quantity', 'price']
              }
            },
            totalAmount: { 
              type: 'number',
              minimum: 0,
              description: 'Total amount of all items in cart'
            },
            itemCount: { 
              type: 'number',
              minimum: 0,
              description: 'Total number of items (sum of quantities)'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['user', 'items', 'totalAmount', 'itemCount']
        },
        CartItem: {
          type: 'object',
          properties: {
            productId: { 
              type: 'string',
              description: 'The ID of the product to add/update'
            },
            quantity: { 
              type: 'number',
              minimum: 1,
              description: 'The quantity to add/update'
            }
          },
          required: ['productId', 'quantity']
        },
        CartSummary: {
          type: 'object',
          properties: {
            itemCount: { 
              type: 'number',
              description: 'Total number of items in cart'
            },
            totalAmount: { 
              type: 'number',
              description: 'Total amount of cart'
            },
            items: { 
              type: 'number',
              description: 'Number of unique products'
            }
          }
        },
        CartValidation: {
          type: 'object',
          properties: {
            isValid: { 
              type: 'boolean',
              description: 'Whether the cart is valid'
            },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  productName: { type: 'string' },
                  type: { 
                    type: 'string',
                    enum: ['insufficient_stock', 'below_minimum', 'above_maximum', 'price_changed', 'product_not_found']
                  },
                  message: { type: 'string' },
                  requested: { type: 'number' },
                  available: { type: 'number' },
                  minimum: { type: 'number' },
                  maximum: { type: 'number' },
                  oldPrice: { type: 'number' },
                  newPrice: { type: 'number' }
                }
              }
            },
            totalAmount: { type: 'number' },
            itemCount: { type: 'number' }
          }
        },
        Address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            zipCode: { type: 'string' },
            coordinates: {
              type: 'array',
              items: { type: 'number' },
              description: '[longitude, latitude]'
            },
            isDefault: { type: 'boolean' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            category: { 
              type: 'string',
              enum: ['vegetables', 'fruits', 'grains', 'dairy', 'livestock', 'equipment']
            },
            stock: { type: 'number' },
            unit: {
              type: 'string',
              enum: ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'box']
            },
            minOrderQuantity: { type: 'number' },
            maxOrderQuantity: { type: 'number' },
            images: { 
              type: 'array',
              items: { type: 'string' }
            },
            rating: { type: 'number' },
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user: { type: 'string' },
                  rating: { type: 'number' },
                  comment: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            seller: { type: 'string' },
            farmLocation: { type: 'string' },
            organic: { type: 'boolean' },
            harvestDate: { type: 'string', format: 'date' },
            expiryDate: { type: 'string', format: 'date' },
            quantityHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['added', 'removed', 'sold', 'returned']
                  },
                  quantity: { type: 'number' },
                  date: { type: 'string', format: 'date-time' },
                  reason: { type: 'string' }
                }
              }
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string' },
                  quantity: { type: 'number' },
                  price: { type: 'number' }
                }
              }
            },
            totalAmount: { type: 'number' },
            shippingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                country: { type: 'string' },
                zipCode: { type: 'string' }
              }
            },
            paymentMethod: { 
              type: 'string',
              enum: ['card', 'cash', 'upi']
            },
            paymentStatus: { 
              type: 'string',
              enum: ['pending', 'completed', 'failed']
            },
            orderStatus: {
              type: 'string',
              enum: ['processing', 'shipped', 'delivered', 'cancelled']
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);
module.exports = specs; 