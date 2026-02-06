import { Schema, HydratedDocument, model, Types } from 'mongoose';

export interface IReview {
  // Core fields for the reviews feature section
  userId?: Types.ObjectId;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  productImage?: string;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Legacy fields kept for backward compatibility with existing UI
  name?: string;
  location?: string;
  text?: string;
}

export type ReviewDocument = HydratedDocument<IReview>;

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userName: {
      type: String,
      required: [true, 'Reviewer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    userAvatar: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Review cannot be more than 1000 characters'],
    },
    productImage: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Legacy fields for existing front-end usage (HomePage/ProductDetailPage)
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot be more than 100 characters'],
    },
    text: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review cannot be more than 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

export const Review = model<IReview>('Review', ReviewSchema);
export default Review;

