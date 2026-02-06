import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param } from 'express-validator';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Order from '../models/Order';

// =====================================================
// VALIDATION RULES
// =====================================================

export const createProductValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('image').trim().notEmpty().withMessage('Image URL is required'),
];

export const updateProductValidation = [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('brand').optional().trim().notEmpty().withMessage('Brand cannot be empty'),
  body('price').optional().isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

export const getProductValidation = [
  param('id').isMongoId().withMessage('Invalid product ID'),
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Sanitize and validate query parameters
 */
const sanitizeQueryParams = (req: Request) => {
  // Pagination
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 12));
  const skip = (page - 1) * limit;

  // Price range
  let minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
  let maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

  if (minPrice !== undefined && (isNaN(minPrice) || minPrice < 0)) minPrice = undefined;
  if (maxPrice !== undefined && (isNaN(maxPrice) || maxPrice < 0)) maxPrice = undefined;

  // Rating
  let minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
  if (minRating !== undefined && (isNaN(minRating) || minRating < 0 || minRating > 5)) {
    minRating = undefined;
  }

  // Sort
  const allowedSortFields = ['price', 'rating', 'name', 'createdAt'];
  const sortBy = allowedSortFields.includes(req.query.sortBy as string)
    ? (req.query.sortBy as string)
    : 'createdAt';

  const allowedOrder = ['asc', 'desc'];
  const order = allowedOrder.includes(req.query.order as string)
    ? (req.query.order as string)
    : 'desc';

  return {
    page,
    limit,
    skip,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    order,
  };
};

/**
 * Build filter object for product queries
 */
const buildProductFilter = (req: Request, sanitizedParams: any) => {
  const filter: any = {};
  const { category, brand, search, inStock } = req.query;
  const { minPrice, maxPrice, minRating } = sanitizedParams;

  // Category filter (exact match, case-insensitive)
  if (category && category !== 'All') {
    filter.category = { $regex: `^${category}$`, $options: 'i' };
  }

  // Brand filter (support multiple brands, case-insensitive exact match)
  if (brand && brand !== 'All') {
    const brands = (brand as string).split(',').map(b => b.trim());
    filter.brand = { $in: brands.map(b => new RegExp(`^${b}$`, 'i')) };
  }

  // Search filter (use text search if available, fallback to regex)
  if (search) {
    const searchTerm = (search as string).trim();
    // Try text search first, but we'll handle fallback in the query
    filter.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { brand: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  // Rating filter
  if (minRating !== undefined) {
    filter.rating = { $gte: minRating };
  }

  // Stock filter
  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  return filter;
};

/**
 * Build sort object for product queries
 */
const buildProductSort = (sortBy: string, order: string) => {
  const sortOrder = order === 'asc' ? 1 : -1;
  const sort: any = {};

  switch (sortBy) {
    case 'price':
      sort.price = sortOrder;
      break;
    case 'rating':
      sort.rating = sortOrder;
      break;
    case 'name':
      sort.name = sortOrder;
      break;
    default:
      sort.createdAt = sortOrder;
  }

  return sort;
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Standard error response
 */
const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  error?: any
) => {
  if (error) {
    console.error(`Error: ${message}`, error);
  }
  res.status(statusCode).json({
    success: false,
    message,
  });
};

// =====================================================
// CONTROLLERS
// =====================================================

/**
 * Get all products with filtering, pagination, and search
 * GET /api/products
 */
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const sanitizedParams = sanitizeQueryParams(req);
    const { page, limit, skip, sortBy, order } = sanitizedParams;

    const filter = buildProductFilter(req, sanitizedParams);
    const sort = buildProductSort(sortBy, order);

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching products', error);
  }
};

/**
 * Get single product with related products
 * GET /api/products/:id
 */
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !isValidObjectId(id)) {
      sendErrorResponse(res, 400, 'Invalid product ID format');
      return;
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      sendErrorResponse(res, 404, 'Product not found');
      return;
    }

    // Get related products
    let relatedProducts: any[] = [];
    if (product.relatedProductIds && product.relatedProductIds.length > 0) {
      relatedProducts = await Product.find({
        _id: { $in: product.relatedProductIds },
      })
        .limit(4)
        .lean();
    } else {
      // Fallback: Get products from same category
      relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
      })
        .limit(4)
        .lean();
    }

    res.status(200).json({
      success: true,
      data: {
        product,
        relatedProducts,
      },
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching product', error);
  }
};

/**
 * Get product by ID (quick view)
 * GET /api/products/quick/:id
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !isValidObjectId(id)) {
      sendErrorResponse(res, 400, 'Invalid product ID format');
      return;
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      sendErrorResponse(res, 404, 'Product not found');
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching product', error);
  }
};

/**
 * Create product (admin only)
 * POST /api/products
 */
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error: any) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Product with this information already exists',
      });
      return;
    }
    next(error);
  }
};

/**
 * Update product (admin only)
 * PUT /api/products/:id
 */
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { id } = req.params;

    // Validate ObjectId
    if (!id || !isValidObjectId(id)) {
      sendErrorResponse(res, 400, 'Invalid product ID format');
      return;
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      sendErrorResponse(res, 404, 'Product not found');
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error: any) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Product with this information already exists',
      });
      return;
    }
    next(error);
  }
};

/**
 * Delete product (admin only)
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !isValidObjectId(id)) {
      sendErrorResponse(res, 400, 'Invalid product ID format');
      return;
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      sendErrorResponse(res, 404, 'Product not found');
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error deleting product', error);
  }
};

/**
 * Get all categories with sample images
 * GET /api/products/categories
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          image: { $first: '$image' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          image: 1,
          count: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching categories', error);
  }
};

/**
 * Get featured products
 * GET /api/products/featured
 */
export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 8));

    // Try to get featured products with fallback logic in a single query
    const products = await Product.find({
      $or: [
        { isFeatured: true },
        { isRecentlyAdded: true },
        { rating: { $gte: 4.5 } },
      ],
    })
      .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // If still no products, get latest products as final fallback
    let finalProducts = products;
    if (products.length === 0) {
      finalProducts = await Product.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    res.status(200).json({
      success: true,
      data: finalProducts,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching featured products', error);
  }
};

/**
 * Get best selling products
 * GET /api/products/bestsellers
 */
export const getBestSellers = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 4));

    // Aggregate orders to find top selling products
    const bestSellersData = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);

    let products: any[] = [];

    if (bestSellersData.length > 0) {
      const productIds = bestSellersData.map((item) => item._id);
      const productsMap = await Product.find({ _id: { $in: productIds } }).lean();

      // Sort products by sales count
      const productIdToSales = new Map(
        bestSellersData.map((item) => [item._id.toString(), item.totalSold])
      );

      products = productsMap.sort((a: any, b: any) => {
        const salesA = productIdToSales.get(a._id.toString()) || 0;
        const salesB = productIdToSales.get(b._id.toString()) || 0;
        return salesB - salesA;
      });
    }

    // Fallback: If no best sellers found
    if (products.length === 0) {
      products = await Product.find({
        $or: [
          { isFeatured: true },
          { isRecentlyAdded: true },
          { rating: { $gte: 4.5 } },
        ],
      })
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit)
        .lean();
    }

    // Final fallback: If still no products
    if (products.length === 0) {
      products = await Product.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching best sellers', error);
  }
};

/**
 * Search products
 * GET /api/products/search
 */
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      sendErrorResponse(res, 400, 'Search query is required');
      return;
    }

    const sanitizedParams = sanitizeQueryParams(req);
    const { page, limit, skip } = sanitizedParams;

    const searchTerm = q.trim();

    // Use regex search for broader compatibility
    const filter = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { brand: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error searching products', error);
  }
};

/**
 * Get all brands
 * GET /api/products/brands
 */
export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const brands = await Product.aggregate([
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching brands', error);
  }
};

/**
 * Get product statistics (admin)
 * GET /api/products/stats
 */
export const getProductStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Product.aggregate([
      {
        $facet: {
          totalProducts: [{ $count: 'count' }],
          totalValue: [
            {
              $group: {
                _id: null,
                total: { $sum: { $multiply: ['$price', '$stock'] } },
              },
            },
          ],
          outOfStock: [{ $match: { stock: 0 } }, { $count: 'count' }],
          lowStock: [{ $match: { stock: { $lte: 10, $gt: 0 } } }, { $count: 'count' }],
          categoryDistribution: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          averagePrice: [
            {
              $group: {
                _id: null,
                avgPrice: { $avg: '$price' },
              },
            },
          ],
        },
      },
    ]);

    const result = {
      totalProducts: stats[0].totalProducts[0]?.count || 0,
      totalValue: stats[0].totalValue[0]?.total || 0,
      outOfStock: stats[0].outOfStock[0]?.count || 0,
      lowStock: stats[0].lowStock[0]?.count || 0,
      categoryDistribution: stats[0].categoryDistribution || [],
      averagePrice: stats[0].averagePrice[0]?.avgPrice || 0,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching product statistics', error);
  }
};