# GreenMart - Multivendor Marketplace App

GreenMart is a mobile application for a multivendor marketplace, allowing vendors to register, sell products, and users to purchase from different vendors.

## Features

### Vendor Registration and Management

- **Dual Registration System**: Users can register as regular users or vendors
- **Vendor Verification**: Admin approval required for vendor accounts
- **Vendor Dashboard**: Vendors can manage their products and view orders
- **Vendor Store**: Each vendor has their own store page showing their products

### User Features

- **Product Browsing**: Users can browse products from different vendors
- **Search and Filters**: Filter products by category, vendor, price, etc.
- **Shopping Cart**: Add items from multiple vendors to a single cart
- **Checkout**: Process orders with various payment methods

### Admin Panel

- **Vendor Approval**: Review and approve/reject vendor applications
- **Product Management**: Manage all products in the marketplace
- **Order Management**: Track and manage orders across all vendors
- **Dashboard**: View marketplace statistics and performance metrics

## Technical Implementation

### Authentication System

- **Firebase Authentication**: Email/password and phone number (OTP) authentication
- **User Management**: User accounts stored in Firebase Authentication
- **Vendor Authentication**: Same credentials as user account, but with vendor role
- **Admin Authentication**: Separate admin credentials

### Data Storage

- Uses Firebase for user authentication
- Uses AsyncStorage for application data persistence (can be replaced with Firestore)
- Firebase Phone Authentication for OTP verification

### Firebase Configuration

The app uses Firebase for authentication. To set up Firebase:

1. Create a Firebase project in the Firebase Console
2. Add a web app to the project
3. Copy the Firebase configuration to the `firebase.ts` file:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
4. Enable Authentication methods in the Firebase Console:
   - Email/Password
   - Phone Number
5. For Phone Authentication:
   - Add your app's SHA-1 certificate fingerprint in Firebase Console
   - Configure reCAPTCHA verification

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Update the Firebase configuration in `firebase.ts` with your project credentials
4. Start the development server:
   ```
   npm start
   ```

## Authentication Flow

### User Registration
1. User enters name, email, phone, and password
2. Account is created in Firebase Authentication
3. User data is saved to AsyncStorage for app use

### Vendor Registration
1. User provides basic information and vendor-specific details
2. Account is created in Firebase Authentication
3. Vendor application is stored with pending verification status
4. Admin is notified of new vendor application
5. Once approved, vendor can log in with vendor access

### Login Methods
1. **Email/Password**: Standard Firebase email authentication
2. **Phone OTP**: Firebase Phone Authentication with SMS verification

## Demo Credentials

### User Account
- Email: user@example.com
- Password: password

### Vendor Accounts
- Email: vendor1@vendor.com (Fresh Farms)
- Email: vendor2@vendor.com (Dairy Delight)
- Email: vendor3@vendor.com (Bake House)
- Password: vendor123

### Admin Account
- Email: admin@example.com
- Password: admin123

## License

This project is licensed under the MIT License. 