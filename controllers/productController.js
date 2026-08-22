// ============================================
// PRODUCT CONTROLLER
// ============================================

const Product = require('../models/Product');

// @desc    Get all products (with Search, Filter by Category, Tag, Price)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, search, tag, minPrice, maxPrice, sort } = req.query;

    let query = {};

    // Filter by Category
    if (category) {
      query.category = category;
    }

    // Filter by Tag (popular, sale, new)
    if (tag) {
      query.tag = tag;
    }

    // Search by Name or Brand
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by Price Range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting options
    let sortOptions = {};
    if (sort === 'low-high') {
      sortOptions.price = 1;
    } else if (sort === 'high-low') {
      sortOptions.price = -1;
    } else if (sort === 'rating') {
      sortOptions.rating = -1;
    } else {
      sortOptions.createdAt = -1; // Default: newest first
    }

    const products = await Product.find(query).sort(sortOptions);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get Products Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json({
        success: true,
        product
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Invalid product ID or Server Error',
      error: error.message
    });
  }
};

// @desc    Create new product (Seller or Admin only)
// @route   POST /api/products
// @access  Private (Seller/Admin)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      description,
      price,
      originalPrice,
      stock,
      emoji,
      tag,
      deliveryEstimate,
      storeName
    } = req.body;

    const product = new Product({
      name,
      brand,
      category,
      description,
      price,
      originalPrice: originalPrice || price,
      stock: stock || 10,
      emoji: emoji || '📦',
      tag: tag || '',
      deliveryEstimate: deliveryEstimate || 'Delivery in 45 min',
      storeName: storeName || req.user.storeName || 'Sharma Hardware Store',
      seller: req.user._id
    });

    const createdProduct = await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully 🎉',
      product: createdProduct
    });
  } catch (error) {
    console.error('Create Product Error:', error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Seller/Admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership or admin privilege
    if (product.seller && product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    Object.assign(product, req.body);
    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully ✅',
      product: updatedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Seller/Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.seller && product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully 🗑️'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// @desc    Seed sample products into database
// @route   POST /api/products/seed
// @access  Public (Development tool)
const seedProducts = async (req, res) => {
  try {
    await Product.deleteMany({}); // Clear existing sample items

    const sampleData = [
      {
        name: 'Bosch GSB 500W Impact Drill Machine',
        brand: 'BOSCH',
        category: 'Power Tools',
        description: 'Powerful 500W impact drill machine with 100 piece accessory kit for masonry, wood, and metal.',
        price: 3299,
        originalPrice: 4999,
        stock: 25,
        emoji: '🔩',
        tag: 'popular',
        rating: 4.5,
        reviewsCount: 2456,
        deliveryEstimate: 'Delivery by Today',
        storeName: 'Sharma Hardware Store'
      },
      {
        name: 'Stanley STHT51391 Steel Claw Hammer 450g',
        brand: 'STANLEY',
        category: 'Hand Tools',
        description: 'High quality forged steel claw hammer with anti-vibration rubber grip.',
        price: 549,
        originalPrice: 799,
        stock: 50,
        emoji: '🔨',
        tag: 'sale',
        rating: 4.3,
        reviewsCount: 1890,
        deliveryEstimate: 'Delivery in 45 min',
        storeName: 'Gupta Tools & Hardware'
      },
      {
        name: 'Havells 9W LED Bulb Pack of 10 Cool White',
        brand: 'HAVELLS',
        category: 'Electrical',
        description: 'Energy efficient B22 LED bulbs with surge protection and 2 years warranty.',
        price: 899,
        originalPrice: 1500,
        stock: 100,
        emoji: '💡',
        tag: 'sale',
        rating: 4.6,
        reviewsCount: 3420,
        deliveryEstimate: 'Free delivery',
        storeName: 'Sharma Hardware Store'
      },
      {
        name: 'Taparia 1172-6 Combination Plier 6 Inch',
        brand: 'TAPARIA',
        category: 'Hand Tools',
        description: 'Insulated high grade alloy steel combination plier for wire cutting and gripping.',
        price: 285,
        originalPrice: 450,
        stock: 30,
        emoji: '🔧',
        tag: 'popular',
        rating: 4.4,
        reviewsCount: 987,
        deliveryEstimate: 'Delivery in 30 min',
        storeName: 'Gupta Tools & Hardware'
      },
      {
        name: 'Asian Paints Apcolite Premium Emulsion 4L',
        brand: 'ASIAN PAINTS',
        category: 'Paint',
        description: 'Rich matte finish interior wall paint with stain resistance and low VOC.',
        price: 1899,
        originalPrice: 2400,
        stock: 15,
        emoji: '🎨',
        tag: 'new',
        rating: 4.7,
        reviewsCount: 1560,
        deliveryEstimate: 'Delivery by Tomorrow',
        storeName: 'Sharma Hardware Store'
      },
      {
        name: 'Supreme CPVC Pipe 1 Inch - 3 Meter',
        brand: 'SUPREME',
        category: 'Plumbing',
        description: 'Heavy duty hot and cold water plumbing pipe with high pressure resistance.',
        price: 320,
        originalPrice: 450,
        stock: 80,
        emoji: '🚰',
        tag: '',
        rating: 4.2,
        reviewsCount: 678,
        deliveryEstimate: 'Delivery in 60 min',
        storeName: 'Build Right Supplies'
      },
      {
        name: 'Karam Safety Helmet ISI Marked',
        brand: 'KARAM',
        category: 'Safety',
        description: 'Industrial safety helmet with 4-point textile suspension and adjustable chin strap.',
        price: 245,
        originalPrice: 400,
        stock: 60,
        emoji: '🦺',
        tag: 'sale',
        rating: 4.5,
        reviewsCount: 890,
        deliveryEstimate: 'Free delivery',
        storeName: 'Gupta Tools & Hardware'
      },
      {
        name: 'Makita 4 Inch Angle Grinder 720W',
        brand: 'MAKITA',
        category: 'Power Tools',
        description: 'Compact 720W motor angle grinder with lababyrinth structure to seal motor from dust.',
        price: 2899,
        originalPrice: 3999,
        stock: 20,
        emoji: '⚙️',
        tag: 'popular',
        rating: 4.6,
        reviewsCount: 1234,
        deliveryEstimate: 'Delivery by Today',
        storeName: 'Gupta Tools & Hardware'
      }
    ];

    const inserted = await Product.insertMany(sampleData);

    res.status(201).json({
      success: true,
      message: 'Sample products seeded successfully into MongoDB Atlas! 🌱',
      count: inserted.length,
      products: inserted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed products',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts
};