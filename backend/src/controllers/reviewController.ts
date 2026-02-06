import { Request, Response } from 'express';
import Review from '../models/Review';

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

/**
 * Get latest customer reviews
 * GET /api/reviews
 */
export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 12));

    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching reviews', error);
  }
};

/**
 * Get featured high-rated reviews for homepage
 * GET /api/reviews/featured
 */
export const getFeaturedReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(9, Math.max(1, parseInt(req.query.limit as string, 10) || 6));
    const minRating = Math.min(5, Math.max(1, parseFloat(req.query.minRating as string) || 4));

    const reviews = await Review.find({
      rating: { $gte: minRating },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching featured reviews', error);
  }
};

