# E-Commerce Website

A full-stack e-commerce application with product pages, shopping cart, and admin panel for product management.

## Features

- **Product Catalog**: Browse and view product details
- **Shopping Cart**: Add, update, and remove items from cart
- **Admin Panel**: Create, edit, and delete products
- **Validation**: Input validation on both frontend and backend
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Session-based Cart**: Cart persists using session IDs

## Tech Stack

### Backend
- Node.js with Express
- SQLite database
- Joi for validation
- CORS for cross-origin requests

### Frontend
- React 18
- React Router for navigation
- Vite for build tooling
- Tailwind CSS for styling
- Axios for API calls

## Project Structure

```
ecommerce-app/
├── server/
│   ├── database.js          # SQLite database setup
│   ├── server.js            # Express server entry point
│   ├── routes/
│   │   ├── products.js      # Product CRUD endpoints
│   │   └── cart.js          # Cart management endpoints
│   └── package.json
├── client/                  # Main store frontend (port 3000)
│   ├── src/
│   │   ├── api/
│   │   │   └── products.js  # API service functions
│   │   ├── components/
│   │   │   └── Navbar.jsx   # Navigation component
│   │   ├── context/
│   │   │   ├── CartContext.jsx  # Cart state management
│   │   │   └── AuthContext.jsx   # User authentication
│   │   ├── pages/
│   │   │   ├── Home.jsx     # Product listing page
│   │   │   ├── ProductDetail.jsx  # Product detail page
│   │   │   ├── Cart.jsx     # Shopping cart page
│   │   │   └── Login.jsx    # User login page
│   │   ├── utils/
│   │   │   └── session.js   # Session ID generation
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── admin-client/            # Admin panel frontend (port 3001)
│   ├── src/
│   │   ├── api/
│   │   │   └── products.js  # API service functions
│   │   ├── context/
│   │   │   └── AdminAuthContext.jsx  # Admin authentication
│   │   ├── pages/
│   │   │   ├── AdminLogin.jsx    # Admin login page
│   │   │   └── AdminDashboard.jsx  # Product management
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
```bash
cd d:\windsurf-test
```

2. Install all dependencies:
```bash
npm run install:all
```

This will install dependencies for the root, server, client, and admin-client directories.

### Running the Application

#### Option 1: Run all servers simultaneously (recommended)
```bash
npm run dev
```

This will start:
- Backend server (port 5000)
- Store frontend (port 3000)
- Admin panel (port 3001)

#### Option 2: Run separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Store Frontend:**
```bash
cd client
npm run dev
```

**Terminal 3 - Admin Panel:**
```bash
cd admin-client
npm run dev
```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Cart
- `GET /api/cart/:sessionId` - Get cart items for session
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart/session/:sessionId` - Clear cart

## Sample Data

The application automatically populates the database with 6 sample products on first run:
- Wireless Headphones ($99.99)
- Smart Watch ($199.99)
- Running Shoes ($79.99)
- Backpack ($49.99)
- Sunglasses ($59.99)
- Laptop Stand ($39.99)

## Usage

### Browsing Products
1. Navigate to the home page to see all products
2. Click on any product to view details
3. Add products to cart from the detail page

### Managing Cart
1. Click the Cart icon in the navigation bar
2. Adjust quantities using + and - buttons
3. Remove items individually or clear the entire cart
4. View order summary with total

### Admin Panel
1. Navigate to http://localhost:3001
2. Login with admin credentials (admin@example.com / admin123)
3. Click "Add Product" to create new products
4. Edit existing products by clicking "Edit"
5. Delete products by clicking "Delete"
6. All fields except description and image URL are required

## Validation

### Backend Validation (Joi)
- Product name: 1-200 characters, required
- Description: max 1000 characters, optional
- Price: positive number, required
- Stock: non-negative integer, required
- Image URL: valid URL format, optional
- Category: max 100 characters, optional

### Frontend Validation
- Required field checks
- Price and stock validation
- Stock availability checks before adding to cart

## Database

The application uses SQLite with the following tables:

**Products Table:**
- id (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- name (TEXT, NOT NULL)
- description (TEXT)
- price (REAL, NOT NULL)
- stock (INTEGER, NOT NULL, DEFAULT 0)
- image_url (TEXT)
- category (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

**Cart Table:**
- id (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- session_id (TEXT, NOT NULL)
- product_id (INTEGER, NOT NULL, FOREIGN KEY)
- quantity (INTEGER, NOT NULL, DEFAULT 1)
- created_at (DATETIME)

The database file (`ecommerce.db`) is created automatically in the `server` directory.

## Troubleshooting

### Port Already in Use
If port 5000, 3000, or 3001 is already in use, you can:
1. Change the port in `server/server.js` (PORT variable)
2. Change the port in `client/vite.config.js` (server.port)
3. Change the port in `admin-client/vite.config.js` (server.port)

### Database Errors
If you encounter database errors:
1. Delete `server/ecommerce.db` to reset the database
2. Restart the server to recreate the database with sample data

### CORS Errors
If you see CORS errors, ensure:
1. The backend server is running on port 5000
2. The frontend proxy is configured correctly in `vite.config.js`

## Development

### Adding New Features
- Backend routes go in `server/routes/`
- Store frontend pages go in `client/src/pages/`
- Admin panel pages go in `admin-client/src/pages/`
- Reusable components go in `client/src/components/`
- API services go in `client/src/api/` or `admin-client/src/api/`

### Building for Production
```bash
# Build store frontend
cd client
npm run build

# Build admin panel
cd admin-client
npm run build
```

The built files will be in `client/dist/` and `admin-client/dist/`.

## License

ISC
