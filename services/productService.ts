import { Product } from '../types';
import { api } from './api';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'price' | 'rating' | 'name' | 'createdAt';
  order?: 'asc' | 'desc';
  inStock?: boolean;
}

interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface CategoryWithImage {
  name: string;
  image: string;
  count?: number;
}

interface BrandInfo {
  name: string;
  count: number;
}

interface ProductStats {
  totalProducts: number;
  totalValue: number;
  outOfStock: number;
  lowStock: number;
  categoryDistribution: Array<{ _id: string; count: number }>;
  averagePrice: number;
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Ensure every product has a stable `id` field, even when the backend
 * only returns MongoDB `_id` (which happens when using `.lean()`).
 */
const normalizeProduct = (product: any): Product => {
  if (!product) return product;

  const id =
    (typeof product.id === 'string' && product.id) ||
    (typeof product._id === 'string' && product._id) ||
    (product._id && product._id.toString && product._id.toString()) ||
    product.id ||
    product._id;

  return {
    ...product,
    id,
  };
};

const normalizeProductsArray = (products: any[] | undefined | null): Product[] => {
  if (!Array.isArray(products)) return [];
  return products.map(normalizeProduct);
};

// =====================================================
// PRODUCT SERVICE
// =====================================================

export const productService = {
  /**
   * Get all products with filters and pagination
   * @param params - Filter and pagination parameters
   * @returns Products with pagination info
   */
  getProducts: async (params: GetProductsParams = {}): Promise<ProductsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // Add filter params
      if (params.category && params.category !== 'All') {
        queryParams.append('category', params.category);
      }
      if (params.brand && params.brand !== 'All') {
        queryParams.append('brand', params.brand);
      }
      if (params.search) {
        queryParams.append('search', params.search.trim());
      }
      
      // Add price range
      if (params.minPrice !== undefined && params.minPrice >= 0) {
        queryParams.append('minPrice', params.minPrice.toString());
      }
      if (params.maxPrice !== undefined && params.maxPrice >= 0) {
        queryParams.append('maxPrice', params.maxPrice.toString());
      }
      
      // Add rating filter
      if (params.minRating !== undefined && params.minRating >= 0) {
        queryParams.append('minRating', params.minRating.toString());
      }
      
      // Add sorting
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.order) queryParams.append('order', params.order);
      
      // Add stock filter
      if (params.inStock) queryParams.append('inStock', 'true');

      const query = queryParams.toString();
      const url = query ? `/products?${query}` : '/products';
      const response = await api.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch products');
      }
      
      // Ensure each product has a proper `id` derived from Mongo `_id`
      return {
        ...response,
        data: normalizeProductsArray(response.data),
      };
    } catch (error: any) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Get single product with related products
   * @param id - Product ID (supports both _id and id)
   * @returns Product details and related products
   */
  getProduct: async (id: string): Promise<{ product: Product; relatedProducts: Product[] }> => {
    try {
      if (!id || id.trim() === '') {
        throw new Error('Product ID is required');
      }

      const response = await api.get(`/products/${id.trim()}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch product');
      }
      
      const rawData = response.data || {};
      const product = normalizeProduct(rawData.product);
      const relatedProducts = normalizeProductsArray(rawData.relatedProducts);

      return { product, relatedProducts };
    } catch (error: any) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  /**
   * Get product by ID (quick view - no related products)
   * @param id - Product ID
   * @returns Product details only
   */
  getProductById: async (id: string): Promise<Product> => {
    try {
      if (!id || id.trim() === '') {
        throw new Error('Product ID is required');
      }

      const response = await api.get(`/products/quick/${id.trim()}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch product');
      }
      
      return normalizeProduct(response.data);
    } catch (error: any) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  },

  /**
   * Get featured products
   * @param limit - Maximum number of products to return
   * @returns Array of featured products
   */
  getFeaturedProducts: async (limit: number = 8): Promise<Product[]> => {
    try {
      const safeLimit = Math.min(Math.max(1, limit), 50); // Limit between 1-50
      const response = await api.get(`/products/featured?limit=${safeLimit}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch featured products');
      }
      
      return normalizeProductsArray(response.data);
    } catch (error: any) {
      console.error('Error fetching featured products:', error);
      // Return empty array on error to prevent UI breaking
      return [];
    }
  },

  /**
   * Get best selling products
   * @param limit - Maximum number of products to return
   * @returns Array of best selling products
   */
  getBestSellers: async (limit: number = 4): Promise<Product[]> => {
    try {
      const safeLimit = Math.min(Math.max(1, limit), 50); // Limit between 1-50
      const response = await api.get(`/products/bestsellers?limit=${safeLimit}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch best sellers');
      }
      
      return normalizeProductsArray(response.data);
    } catch (error: any) {
      console.error('Error fetching best sellers:', error);
      // Return empty array on error to prevent UI breaking
      return [];
    }
  },

  /**
   * Get all categories with images
   * @returns Array of categories with sample images
   */
  getCategories: async (): Promise<CategoryWithImage[]> => {
    try {
      const response = await api.get('/products/categories');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch categories');
      }
      
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  /**
   * Get all brands
   * @returns Array of brands with product counts
   */
  getBrands: async (): Promise<BrandInfo[]> => {
    try {
      const response = await api.get('/products/brands');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch brands');
      }
      
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      return [];
    }
  },

  /**
   * Search products
   * @param query - Search query string
   * @param page - Page number
   * @param limit - Results per page
   * @returns Search results with pagination
   */
  searchProducts: async (
    query: string, 
    page: number = 1, 
    limit: number = 12
  ): Promise<ProductsResponse> => {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }

      const safePage = Math.max(1, page);
      const safeLimit = Math.min(Math.max(1, limit), 100);
      
      const response = await api.get(
        `/products/search?q=${encodeURIComponent(query.trim())}&page=${safePage}&limit=${safeLimit}`
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to search products');
      }
      
      return response;
    } catch (error: any) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  /**
   * Create product (admin only)
   * @param productData - Product data to create
   * @returns Created product
   */
  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    try {
      // Validate required fields
      if (!productData.name || !productData.name.trim()) {
        throw new Error('Product name is required');
      }
      if (!productData.category || !productData.category.trim()) {
        throw new Error('Product category is required');
      }
      if (!productData.price || productData.price <= 0) {
        throw new Error('Valid product price is required');
      }

      const response = await api.post('/products', productData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create product');
      }
      
      return normalizeProduct(response.data);
    } catch (error: any) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Update product (admin only)
   * @param id - Product ID to update
   * @param productData - Updated product data
   * @returns Updated product
   */
  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      if (!id || id.trim() === '') {
        throw new Error('Product ID is required');
      }

      // Validate data if provided
      if (productData.name !== undefined && !productData.name.trim()) {
        throw new Error('Product name cannot be empty');
      }
      if (productData.price !== undefined && productData.price <= 0) {
        throw new Error('Product price must be greater than 0');
      }
      if (productData.stock !== undefined && productData.stock < 0) {
        throw new Error('Product stock cannot be negative');
      }

      const response = await api.put(`/products/${id.trim()}`, productData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update product');
      }
      
      return normalizeProduct(response.data);
    } catch (error: any) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  /**
   * Delete product (admin only)
   * @param id - Product ID to delete
   */
  deleteProduct: async (id: string): Promise<void> => {
    try {
      if (!id || id.trim() === '') {
        throw new Error('Product ID is required');
      }

      const response = await api.delete(`/products/${id.trim()}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete product');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Get product statistics (admin only)
   * @returns Product statistics
   */
  getProductStats: async (): Promise<ProductStats> => {
    try {
      const response = await api.get('/products/stats');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch product statistics');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching product stats:', error);
      throw error;
    }
  },

  /**
   * Upload image
   * @param file - Image file to upload
   * @returns Image URL
   */
  uploadImage: async (file: File): Promise<string> => {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.upload('/upload/image', formData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to upload image');
      }
      
      if (!response.data?.url) {
        throw new Error('No image URL returned from server');
      }
      
      return response.data.url;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  /**
   * Bulk delete products (admin only)
   * @param ids - Array of product IDs to delete
   * @returns Result of bulk delete operation
   */
  bulkDeleteProducts: async (ids: string[]): Promise<{ deleted: number; failed: number }> => {
    try {
      if (!ids || ids.length === 0) {
        throw new Error('No product IDs provided');
      }

      // Filter out empty IDs
      const validIds = ids.filter(id => id && id.trim() !== '');
      
      if (validIds.length === 0) {
        throw new Error('No valid product IDs provided');
      }

      const response = await api.post('/products/bulk-delete', { ids: validIds });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete products');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error bulk deleting products:', error);
      throw error;
    }
  },

  /**
   * Update product stock (admin only)
   * @param id - Product ID
   * @param stock - New stock value
   * @returns Updated product
   */
  updateStock: async (id: string, stock: number): Promise<Product> => {
    try {
      if (!id || id.trim() === '') {
        throw new Error('Product ID is required');
      }

      if (stock < 0) {
        throw new Error('Stock cannot be negative');
      }

      const response = await api.patch(`/products/${id.trim()}/stock`, { stock });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update stock');
      }
      
      return normalizeProduct(response.data);
    } catch (error: any) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  /**
   * Validate product data before submission
   * @param productData - Product data to validate
   * @returns Object with validation result and errors
   */
  validateProductData: (productData: Partial<Product>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Name validation
    if (!productData.name || productData.name.trim().length < 3) {
      errors.push('Product name must be at least 3 characters long');
    }

    // Category validation
    if (!productData.category || productData.category.trim().length === 0) {
      errors.push('Product category is required');
    }

    // Brand validation
    if (!productData.brand || productData.brand.trim().length === 0) {
      errors.push('Product brand is required');
    }

    // Price validation
    if (!productData.price || productData.price <= 0) {
      errors.push('Product price must be greater than 0');
    }

    // Stock validation
    if (productData.stock !== undefined && productData.stock < 0) {
      errors.push('Product stock cannot be negative');
    }

    // Image validation
    if (!productData.image || productData.image.trim().length === 0) {
      errors.push('Product image is required');
    } else {
      // Basic URL validation
      try {
        new URL(productData.image);
      } catch {
        errors.push('Product image must be a valid URL');
      }
    }

    // Description validation
    if (!productData.description || productData.description.trim().length < 10) {
      errors.push('Product description must be at least 10 characters long');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default productService;