import { connectDB, disconnectDB } from '../config/database';
import config from '../config';
import User from '../models/User';
import Product from '../models/Product';
import Review from '../models/Review';
import logger from '../utils/logger';

// Sample product data matching the frontend constants
// Using reliable, copyright-free images from Unsplash (stable photo IDs)
const sampleProducts = [
  // Laptops
  {
    name: 'MacBook Pro 16" M3 Max',
    brand: 'Apple',
    category: 'Laptops',
    price: 3599.00,
    rating: 4.9,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b92e10?w=600&h=400&fit=crop&q=80',
    ],
    isRecentlyAdded: true,
    specs: ['M3 Max Chip', '36GB RAM', '1TB SSD'],
    description: "The most powerful MacBook Pro ever is here. Blasting forward with the M3 Max chip, it delivers massive performance and capabilities for extreme workflows.",
    technicalSpecs: { "Processor": "Apple M3 Max", "RAM": "36GB Unified", "Storage": "1TB SSD", "Display": "16.2 Liquid Retina XDR" },
    stock: 15,
  },
  {
    name: 'Dell XPS 15',
    brand: 'Dell',
    category: 'Laptops',
    price: 2199.00,
    originalPrice: 2399.00,
    rating: 4.7,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=400&fit=crop&q=80',
    specs: ['Intel i9', 'RTX 4060', '32GB RAM'],
    description: "Immersive display, lifelike visuals, and powerful performance in a stunning design. The Dell XPS 15 is the perfect balance of power and portability.",
    technicalSpecs: { "Processor": "Intel Core i9-13900H", "GPU": "NVIDIA RTX 4060", "RAM": "32GB DDR5", "Display": "15.6 OLED 3.5K" },
    stock: 22,
  },
  // Smartphones
  {
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    category: 'Smartphones',
    price: 1199.00,
    rating: 4.8,
    reviews: 2400,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=400&fit=crop&q=80',
    isRecentlyAdded: true,
    specs: ['A17 Pro', 'Titanium', '48MP Cam'],
    description: "iPhone 15 Pro Max. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.",
    technicalSpecs: { "Chip": "A17 Pro", "Storage": "256GB", "Display": "6.7 Super Retina XDR", "Camera": "48MP Main" },
    stock: 8,
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'Smartphones',
    price: 1249.00,
    rating: 4.7,
    reviews: 150,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop&q=80',
    isRecentlyAdded: true,
    specs: ['Snapdragon 8 Gen 3', 'AI Features', '200MP Cam'],
    description: "Unleash new levels of creativity, productivity and possibility with Galaxy S24 Ultra. Powered by Galaxy AI.",
    technicalSpecs: { "Processor": "Snapdragon 8 Gen 3", "RAM": "12GB", "Storage": "512GB", "Camera": "200MP Wide" },
    stock: 40,
  },
  // Audio
  {
    name: 'Sony WH-1000XM5',
    brand: 'Sony',
    category: 'Audio',
    price: 349.00,
    originalPrice: 380.00,
    rating: 4.8,
    reviews: 856,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop&q=80',
    specs: ['Noise Cancelling', '30hr Battery', 'LDAC'],
    description: "The WH-1000XM5 headphones rewrite the rules for distraction-free listening. Two processors control 8 microphones for unprecedented noise cancellation.",
    technicalSpecs: { "Type": "Over-ear", "Battery": "30h", "Connection": "Bluetooth 5.2", "Weight": "250g" },
    stock: 42,
  },
  {
    name: 'Apple AirPods Pro (2nd Gen)',
    brand: 'Apple',
    category: 'Audio',
    price: 229.00,
    rating: 4.9,
    reviews: 3200,
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=400&fit=crop&q=80',
    specs: ['H2 Chip', 'Active NC', 'USB-C Case'],
    description: "Rebuilt from the sound up. AirPods Pro feature up to 2x more Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio.",
    technicalSpecs: { "Chip": "Apple H2", "Battery": "6h (30h with case)", "Water Resistance": "IP54", "Charging": "MagSafe" },
    stock: 100,
  },
  // Gaming
  {
    name: 'PlayStation 5 Slim',
    brand: 'Sony',
    category: 'Gaming',
    price: 439.00,
    originalPrice: 479.00,
    rating: 4.9,
    reviews: 5402,
    image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&h=400&fit=crop&q=80',
    specs: ['1TB SSD', '4K 120Hz', 'Haptic Feedback'],
    description: "Experience lightning fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, and an all-new generation of incredible PlayStation games.",
    technicalSpecs: { "Storage": "1TB SSD", "Output": "4K 120Hz, 8K", "Audio": "Tempest 3D", "Disc Drive": "Detachable" },
    stock: 100,
  },
  {
    name: 'Nintendo Switch OLED',
    brand: 'Nintendo',
    category: 'Gaming',
    price: 309.00,
    rating: 4.8,
    reviews: 4100,
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&h=400&fit=crop&q=80',
    specs: ['7" OLED Screen', 'Handheld Mode', '64GB Storage'],
    description: "Feast your eyes on vivid colors and crisp contrast when you play on-the-go. See the difference the vibrant screen makes.",
    technicalSpecs: { "Screen": "7-inch OLED", "Storage": "64GB", "Battery": "4.5 - 9 hours", "Modes": "TV, Tabletop, Handheld" },
    stock: 55,
  },
  // Cameras
  {
    name: 'DJI Mini 4 Pro',
    brand: 'DJI',
    category: 'Cameras',
    price: 689.00,
    rating: 4.8,
    reviews: 150,
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&h=400&fit=crop&q=80',
    isRecentlyAdded: true,
    specs: ['4K/60fps HDR', 'Omni Sensing', '20km Transmission'],
    description: "Mini 4 Pro is our most advanced mini-camera drone to date. It integrates powerful imaging capabilities, omnidirectional obstacle sensing, and 4K HDR video.",
    technicalSpecs: { "Weight": "<249g", "Flight Time": "34 mins", "Camera": "48MP 1/1.3 CMOS", "Transmission": "O4 Video" },
    stock: 12,
  },
  {
    name: 'Sony Alpha 7 IV',
    brand: 'Sony',
    category: 'Cameras',
    price: 2399.00,
    rating: 4.9,
    reviews: 80,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop&q=80',
    specs: ['33MP Sensor', '4K 60p', 'Real-time Eye AF'],
    description: "An ideal hybrid, the Alpha 7 IV packs outstanding still image quality and evolved video technology with advanced autofocus.",
    technicalSpecs: { "Sensor": "33MP Full-Frame", "ISO": "100-51200", "Stabilization": "5-axis In-body", "Video": "4K 60p 10-bit" },
    stock: 5,
  },
  // Wearables
  {
    name: 'Apple Watch Ultra 2',
    brand: 'Apple',
    category: 'Wearables',
    price: 799.00,
    rating: 4.9,
    reviews: 540,
    image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&h=400&fit=crop&q=80',
    isRecentlyAdded: true,
    specs: ['Titanium Case', '100m Water Res', '36hr Battery'],
    description: "The most rugged and capable Apple Watch. Designed for outdoor adventure and supercharged workouts with a lightweight titanium case.",
    technicalSpecs: { "Case": "49mm Titanium", "Display": "Always-On Retina (3000 nits)", "Water Resistance": "100m", "Connectivity": "GPS + Cellular" },
    stock: 25,
  },
  // Smart Home
  {
    name: 'Dyson V15 Detect',
    brand: 'Dyson',
    category: 'Smart Home',
    price: 649.99,
    rating: 4.7,
    reviews: 890,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&q=80',
    specs: ['Laser Dust Detection', 'Piezo Sensor', '60min Runtime'],
    description: "The most powerful, intelligent cordless vacuum. A laser makes invisible dust visible on hard floors.",
    technicalSpecs: { "Suction Power": "240 AW", "Bin Volume": "0.77L", "Charge Time": "4.5 hrs", "Weight": "3.1 kg" },
    stock: 20,
  },
  // Accessories
  {
    name: 'Anker Prime 27,650mAh Power Bank',
    brand: 'Anker',
    category: 'Accessories',
    price: 149.99,
    rating: 4.9,
    reviews: 180,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=400&fit=crop&q=80',
    specs: ['250W Output', 'Smart Display', '3 Ports'],
    description: "The ultimate power bank for your laptop and phone. Capable of charging a MacBook Pro 16\" to 50% in 28 minutes.",
    technicalSpecs: { "Capacity": "27,650mAh", "Output": "250W Total", "Ports": "2x USB-C, 1x USB-A", "Weight": "665g" },
    stock: 60,
  },
  {
    name: 'Apple MagSafe Charger',
    brand: 'Apple',
    category: 'Accessories',
    price: 39.00,
    rating: 4.5,
    reviews: 5000,
    image: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=600&h=400&fit=crop&q=80',
    specs: ['Magnetic Alignment', '15W Fast Charge', 'USB-C'],
    description: "The MagSafe Charger makes wireless charging a snap. The perfectly aligned magnets attach to your iPhone.",
    technicalSpecs: { "Power": "Up to 15W", "Connector": "USB-C", "Cable Length": "1m", "Compatibility": "iPhone 12 and later" },
    stock: 150,
  },
  {
    name: 'Logitech MX Master 3S',
    brand: 'Logitech',
    category: 'Accessories',
    price: 119.99,
    rating: 4.9,
    reviews: 1200,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=400&fit=crop&q=80',
    specs: ['8K DPI Sensor', 'Quiet Clicks', 'MagSpeed Wheel'],
    description: "Meet MX Master 3S – an iconic mouse remastered. Feel every moment of your workflow with even more precision.",
    technicalSpecs: { "DPI": "200-8000", "Battery": "70 days", "Connectivity": "Bluetooth/Bolt", "Buttons": "7 Programmable" },
    stock: 80,
  },
];

// Sample customer reviews (matching the Review model schema)
const sampleReviews = [
  {
    userName: 'Sarah Jenkins',
    location: 'Manchester, UK',
    comment: 'Incredible service. Next day delivery to Manchester was punctual, and the VAT invoice was generated instantly.',
    rating: 5,
    isVerified: true,
  },
  {
    userName: "David O'Connor",
    location: 'London, UK',
    comment: 'Best place for tech. The GDPR compliance and data handling gives me peace of mind.',
    rating: 5,
    isVerified: true,
  },
  {
    userName: 'Priya Patel',
    location: 'Birmingham, UK',
    comment: 'Love the loyalty points system. Bought my entire office setup here.',
    rating: 4,
    isVerified: true,
  },
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    logger.info('Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'System Admin',
      email: config.adminEmail,
      password: config.adminPassword,
      role: 'admin',
      isActive: true,
    });
    logger.info(`Admin user created: ${adminUser.email}`);

    // Create sample regular user
    const regularUser = await User.create({
      name: 'John Doe',
      email: 'user@example.com',
      password: 'User123!',
      role: 'user',
      isActive: true,
    });
    logger.info(`Regular user created: ${regularUser.email}`);

    // Insert products
    const products = await Product.insertMany(sampleProducts);
    logger.info(`${products.length} products inserted`);

    // Insert reviews
    const reviews = await Review.insertMany(sampleReviews);
    logger.info(`${reviews.length} reviews inserted`);

    logger.info('Database seeded successfully!');
    logger.info('----------------------------------------');
    logger.info('Admin Credentials:');
    logger.info(`Email: ${config.adminEmail}`);
    logger.info(`Password: ${config.adminPassword}`);
    logger.info('----------------------------------------');
    logger.info('Test User Credentials:');
    logger.info('Email: user@example.com');
    logger.info('Password: User123!');
    logger.info('----------------------------------------');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
