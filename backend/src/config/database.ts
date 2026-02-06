import mongoose from 'mongoose';
import config from '../config';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error connecting to MongoDB: ${error.message}`);
    } else {
      logger.error('Error connecting to MongoDB: Unknown error');
    }
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected');
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error disconnecting from MongoDB: ${error.message}`);
    } else {
      logger.error('Error disconnecting from MongoDB: Unknown error');
    }
  }
};
