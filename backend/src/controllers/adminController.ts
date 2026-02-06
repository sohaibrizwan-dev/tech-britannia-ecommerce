import { Request, Response } from 'express';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // User stats
    const totalUsers = await User.countDocuments({ role: 'user' });
    const newUsersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: new Date(new Date().setDate(1)) },
    });

    // Product stats
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stock: { $lte: 10, $gt: 0 } });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Order stats
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Processing' });
    const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });

    // Revenue stats
    const revenueStats = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
        },
      },
    ]);

    const monthlyRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent activity
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-password');

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
        },
        revenue: {
          total: revenueStats[0]?.totalRevenue || 0,
          averageOrderValue: revenueStats[0]?.avgOrderValue || 0,
          monthly: monthlyRevenue,
        },
        categories: categoryDistribution,
        recentActivity: {
          orders: recentOrders,
          users: recentUsers,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
    });
  }
};

// Get sales data for charts
export const getSalesData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year

    let groupBy: any;
    let sortDirection: 1 | -1 = -1;

    switch (period) {
      case 'day':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
        break;
      case 'week':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' },
        };
        break;
      case 'year':
        groupBy = {
          year: { $year: '$createdAt' },
        };
        sortDirection = 1;
        break;
      case 'month':
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
        break;
    }

    const salesData = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          items: { $sum: { $sum: '$items.quantity' } },
        },
      },
      { $sort: { '_id': sortDirection } },
      { $limit: period === 'day' ? 30 : period === 'week' ? 12 : period === 'year' ? 5 : 12 },
    ]);

    res.status(200).json({
      success: true,
      data: salesData,
    });
  } catch (error) {
    console.error('Get sales data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales data',
    });
  }
};

// Get top products
export const getTopProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);

    res.status(200).json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top products',
    });
  }
};

// Get low stock alerts
export const getLowStockAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 10;

    const lowStockProducts = await Product.find({
      stock: { $lte: threshold, $gt: 0 },
    }).sort({ stock: 1 });

    const outOfStockProducts = await Product.find({
      stock: 0,
    });

    res.status(200).json({
      success: true,
      data: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        totalAlerts: lowStockProducts.length + outOfStockProducts.length,
      },
    });
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock alerts',
    });
  }
};
