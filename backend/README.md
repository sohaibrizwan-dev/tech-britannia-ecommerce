# Tech Britannia - E-Commerce Backend API

A comprehensive Node.js/Express.js/MongoDB backend for the Tech Britannia e-commerce platform.

## 🚀 Features

### Core Features
- **Authentication & Authorization**
  - JWT-based authentication with access & refresh tokens
  - Role-based access control (User & Admin)
  - Password hashing with bcrypt
  - Secure token management

- **Product Management**
  - Full CRUD operations for products
  - Advanced filtering (category, price range, search)
  - Pagination & sorting
  - Text search with MongoDB
  - Stock management with low stock alerts

- **Shopping Cart**
  - Persistent cart for authenticated users
  - Add/remove/update cart items
  - Stock validation
  - Cart merging for guest users

- **Order Management**
  - Order creation from cart
  - Order tracking & status updates
  - Payment status management
  - Order history

- **Admin Dashboard**
  - Sales analytics & reporting
  - User management
  - Product inventory management
  - Order fulfillment
  - Dashboard statistics

### Security Features
- Helmet.js for security headers
- CORS configuration
- Rate limiting (general & auth-specific)
- Input validation with express-validator
- XSS protection
- MongoDB injection protection

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.ts          # Environment configuration
│   │   └── database.ts       # MongoDB connection
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── productController.ts
│   │   ├── cartController.ts
│   │   ├── orderController.ts
│   │   └── adminController.ts
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication middleware
│   │   └── error.ts          # Error handling middleware
│   ├── models/
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Cart.ts
│   │   ├── Order.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── productRoutes.ts
│   │   ├── cartRoutes.ts
│   │   ├── orderRoutes.ts
│   │   └── adminRoutes.ts
│   ├── scripts/
│   │   └── seed.ts           # Database seeding script
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── utils/
│   │   ├── jwt.ts            # JWT utilities
│   │   └── logger.ts         # Winston logger
│   └── index.ts              # Application entry point
├── logs/                     # Log files
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Tech Stack

- **Runtime**: Node.js (18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: express-validator, Zod
- **Logging**: Winston
- **Password Hashing**: bcryptjs

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Navigate to the backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tech_britannia
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@techbritannia.co.uk
ADMIN_PASSWORD=Admin123!
```

4. **Seed the database:**
```bash
npm run seed
```

5. **Start the development server:**
```bash
npm run dev
```

The server will start at `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| GET | `/auth/me` | Get current user | Yes |
| POST | `/auth/logout` | Logout user | Yes |

**Register/Login Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products (with filters) | No |
| GET | `/products/featured` | Get featured products | No |
| GET | `/products/categories` | Get all categories | No |
| GET | `/products/search?q=laptop` | Search products | No |
| GET | `/products/:id` | Get single product | No |
| POST | `/products` | Create product | Admin |
| PUT | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Delete product | Admin |

**Product Filters:**
- `?category=Laptops` - Filter by category
- `?minPrice=100&maxPrice=500` - Price range
- `?search=laptop` - Text search
- `?page=1&limit=12` - Pagination
- `?sortBy=price&order=asc` - Sorting
- `?inStock=true` - In stock only

### Cart Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get user's cart | Yes |
| POST | `/cart` | Add item to cart | Yes |
| PUT | `/cart/:productId` | Update item quantity | Yes |
| DELETE | `/cart/:productId` | Remove item from cart | Yes |
| DELETE | `/cart` | Clear cart | Yes |
| POST | `/cart/merge` | Merge guest cart | Yes |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/orders` | Create order from cart | Yes |
| GET | `/orders/my-orders` | Get user's orders | Yes |
| GET | `/orders/:id` | Get single order | Yes |
| GET | `/orders` | Get all orders (admin) | Admin |
| GET | `/orders/stats/overview` | Order statistics | Admin |
| PUT | `/orders/:id/status` | Update order status | Admin |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/profile` | Get user profile | Yes |
| PUT | `/users/profile` | Update profile | Yes |
| PUT | `/users/change-password` | Change password | Yes |
| GET | `/users` | Get all users | Admin |
| PUT | `/users/:id/status` | Update user status | Admin |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/dashboard` | Dashboard statistics | Admin |
| GET | `/admin/sales` | Sales data | Admin |
| GET | `/admin/top-products` | Top selling products | Admin |
| GET | `/admin/low-stock` | Low stock alerts | Admin |

## 🔒 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 🧪 Testing

### Default Credentials

**Admin Account:**
- Email: `admin@techbritannia.co.uk`
- Password: `Admin123!`

**Test User Account:**
- Email: `user@example.com`
- Password: `User123!`

### API Testing with cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techbritannia.co.uk",
    "password": "Admin123!"
  }'
```

**Get Products:**
```bash
curl http://localhost:5000/api/products
```

**Add to Cart (requires auth):**
```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "productId": "...",
    "quantity": 2
  }'
```

## 📦 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/tech_britannia |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | 30d |
| `NODE_ENV` | Environment mode | development |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `ADMIN_EMAIL` | Default admin email | admin@techbritannia.co.uk |
| `ADMIN_PASSWORD` | Default admin password | Admin123! |

## 🐛 Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

## 📈 Logging

Logs are stored in:
- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs
- Console - Development mode only

## 🔐 Security Best Practices

1. **Always use HTTPS in production**
2. **Keep JWT secrets secure and rotate them regularly**
3. **Use strong passwords for admin accounts**
4. **Enable MongoDB authentication**
5. **Set up proper firewall rules**
6. **Regularly update dependencies**

## 📝 License

MIT License

## 🤝 Support

For support, email support@techbritannia.co.uk or create an issue in the repository.
