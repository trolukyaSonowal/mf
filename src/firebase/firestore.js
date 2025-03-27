// Categories Collection Functions
export const addCategory = async (categoryData) => {
  try {
    const categoryRef = await addDoc(collection(db, 'categories'), {
      name: categoryData.name,
      description: categoryData.description,
      imageUrl: categoryData.imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return categoryRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    return categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId, categoryData) => {
  try {
    await updateDoc(doc(db, 'categories', categoryId), {
      ...categoryData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Products Collection Functions
export const addProduct = async (productData) => {
  try {
    const productRef = await addDoc(collection(db, 'products'), {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      categoryId: productData.categoryId,
      imageUrl: productData.imageUrl,
      stock: productData.stock,
      vendorId: productData.vendorId,
      rating: 0,
      reviewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return productRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const getProducts = async (filters = {}) => {
  try {
    let query = collection(db, 'products');
    
    if (filters.categoryId) {
      query = query.where('categoryId', '==', filters.categoryId);
    }
    
    if (filters.vendorId) {
      query = query.where('vendorId', '==', filters.vendorId);
    }
    
    const productsSnapshot = await getDocs(query);
    return productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    await updateDoc(doc(db, 'products', productId), {
      ...productData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Orders Collection Functions
export const createOrder = async (orderData) => {
  try {
    const orderRef = await addDoc(collection(db, 'orders'), {
      userId: orderData.userId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: 'pending',
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrders = async (userId) => {
  try {
    const ordersSnapshot = await getDocs(
      query(collection(db, 'orders'), where('userId', '==', userId))
    );
    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Notifications Collection Functions
export const createNotification = async (notificationData) => {
  try {
    const notificationRef = await addDoc(collection(db, 'notifications'), {
      userId: notificationData.userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      read: false,
      createdAt: serverTimestamp()
    });
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotifications = async (userId) => {
  try {
    const notificationsSnapshot = await getDocs(
      query(collection(db, 'notifications'), where('userId', '==', userId))
    );
    return notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Vendors Collection Functions
export const addVendor = async (vendorData) => {
  try {
    const vendorRef = await addDoc(collection(db, 'vendors'), {
      name: vendorData.name,
      email: vendorData.email,
      phone: vendorData.phone,
      address: vendorData.address,
      description: vendorData.description,
      logoUrl: vendorData.logoUrl,
      rating: 0,
      reviewCount: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return vendorRef.id;
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
};

export const getVendors = async () => {
  try {
    const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
    return vendorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting vendors:', error);
    throw error;
  }
};

export const updateVendor = async (vendorId, vendorData) => {
  try {
    await updateDoc(doc(db, 'vendors', vendorId), {
      ...vendorData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }
};

export const deleteVendor = async (vendorId) => {
  try {
    await deleteDoc(doc(db, 'vendors', vendorId));
  } catch (error) {
    console.error('Error deleting vendor:', error);
    throw error;
  }
};

// Initialize sample categories
export const initializeCategories = async () => {
  const categories = [
    {
      name: "Fruits",
      description: "Fresh and organic fruits from local farms",
      imageUrl: "https://example.com/images/fruits.jpg",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: "Vegetables",
      description: "Fresh and organic vegetables from local farms",
      imageUrl: "https://example.com/images/vegetables.jpg",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: "Dairy",
      description: "Fresh dairy products from local farms",
      imageUrl: "https://example.com/images/dairy.jpg",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: "Meat",
      description: "Fresh meat products from local farms",
      imageUrl: "https://example.com/images/meat.jpg",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];

  try {
    for (const category of categories) {
      await addCategory(category);
    }
    console.log('Categories initialized successfully');
  } catch (error) {
    console.error('Error initializing categories:', error);
    throw error;
  }
};

// Initialize sample products
export const initializeProducts = async () => {
  const products = [
    {
      name: "Organic Bananas",
      description: "Fresh, ripe organic bananas from local farms",
      price: 2.99,
      categoryId: "d3TiseiZD8QuhAy3erBB", // Fruits category ID
      imageUrl: "https://example.com/images/organic-bananas.jpg",
      stock: 100,
      vendorId: "vendor12345",
      rating: 4.5,
      reviewCount: 10,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: "Fresh Tomatoes",
      description: "Organic tomatoes from local farms",
      price: 1.99,
      categoryId: "d3TiseiZD8QuhAy3erBB", // Vegetables category ID
      imageUrl: "https://example.com/images/tomatoes.jpg",
      stock: 50,
      vendorId: "vendor12345",
      rating: 4.2,
      reviewCount: 8,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];

  try {
    for (const product of products) {
      await addProduct(product);
    }
    console.log('Products initialized successfully');
  } catch (error) {
    console.error('Error initializing products:', error);
    throw error;
  }
};

// Initialize sample notifications
export const initializeNotifications = async () => {
  const notifications = [
    {
      userId: "E0VGP5T2hXGoJpdqOCaY",
      title: "Welcome to GreenMart!",
      message: "Thank you for joining our community of eco-conscious shoppers.",
      type: "welcome",
      read: false,
      createdAt: serverTimestamp()
    },
    {
      userId: "E0VGP5T2hXGoJpdqOCaY",
      title: "New Products Available",
      message: "Check out our latest organic products from local farms.",
      type: "product_update",
      read: false,
      createdAt: serverTimestamp()
    }
  ];

  try {
    for (const notification of notifications) {
      await createNotification(notification);
    }
    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing notifications:', error);
    throw error;
  }
};

// Initialize sample orders
export const initializeOrders = async () => {
  const orders = [
    {
      userId: "E0VGP5T2hXGoJpdqOCaY",
      items: [
        {
          productId: "hu70f2f3NtFxbW5JnBjt",
          quantity: 2,
          price: 2.99
        }
      ],
      totalAmount: 5.98,
      status: "pending",
      shippingAddress: "123 Main St, City, Country",
      paymentMethod: "credit_card",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];

  try {
    for (const order of orders) {
      await createOrder(order);
    }
    console.log('Orders initialized successfully');
  } catch (error) {
    console.error('Error initializing orders:', error);
    throw error;
  }
};

// Initialize sample users
export const initializeUsers = async () => {
  const users = [
    {
      userId: "E0VGP5T2hXGoJpdqOCaY",
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      addresses: [
        {
          street: "123 Main St",
          city: "City",
          state: "State",
          country: "Country",
          zipCode: "12345",
          isDefault: true
        }
      ],
      profileImage: "https://example.com/images/profile.jpg",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      userId: "user123",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1987654321",
      addresses: [
        {
          street: "456 Oak Ave",
          city: "Town",
          state: "State",
          country: "Country",
          zipCode: "67890",
          isDefault: true
        }
      ],
      profileImage: "https://example.com/images/profile2.jpg",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];

  try {
    for (const user of users) {
      await addDoc(collection(db, 'users'), user);
    }
    console.log('Users initialized successfully');
  } catch (error) {
    console.error('Error initializing users:', error);
    throw error;
  }
};

// Initialize sample carts
export const initializeCarts = async () => {
  const carts = [
    {
      userId: "E0VGP5T2hXGoJpdqOCaY",
      items: [
        {
          productId: "hu70f2f3NtFxbW5JnBjt",
          quantity: 2,
          price: 2.99
        }
      ],
      totalAmount: 5.98,
      updatedAt: serverTimestamp()
    },
    {
      userId: "user123",
      items: [
        {
          productId: "hu70f2f3NtFxbW5JnBjt",
          quantity: 1,
          price: 2.99
        }
      ],
      totalAmount: 2.99,
      updatedAt: serverTimestamp()
    }
  ];

  try {
    for (const cart of carts) {
      await addDoc(collection(db, 'carts'), cart);
    }
    console.log('Carts initialized successfully');
  } catch (error) {
    console.error('Error initializing carts:', error);
    throw error;
  }
};

// Initialize sample vendors
export const initializeVendors = async () => {
  const vendors = [
    {
      name: "Fresh Farms",
      email: "freshfarms@example.com",
      phone: "+1234567890",
      address: "123 Farm Road, Green Valley",
      description: "We provide fresh organic produce directly from our farms.",
      logoUrl: "https://images.unsplash.com/photo-1498579809087-ef1e558fd1da?auto=format&fit=crop&q=80&w=300",
      rating: 4.8,
      reviewCount: 42,
      isActive: true,
      categories: ['Fruits', 'Vegetables', 'Organic'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: "Dairy Delight",
      email: "dairydelight@example.com",
      phone: "+1234567891",
      address: "456 Milk Way, Cream County",
      description: "Premium dairy products from grass-fed cows.",
      logoUrl: "https://images.unsplash.com/photo-1634301295749-9c69478a9204?auto=format&fit=crop&q=80&w=300",
      rating: 4.6,
      reviewCount: 38,
      isActive: true,
      categories: ['Dairy', 'Organic'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: "Bake House",
      email: "bakehouse@example.com",
      phone: "+1234567892",
      address: "789 Wheat Street, Flour City",
      description: "Freshly baked breads and pastries every day.",
      logoUrl: "https://images.unsplash.com/photo-1515823662972-da6a2ab7040e?auto=format&fit=crop&q=80&w=300",
      rating: 4.5,
      reviewCount: 36,
      isActive: true,
      categories: ['Bakery', 'Bread'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: "Organic Corner",
      email: "organiccorner@example.com",
      phone: "+1234567893",
      address: "101 Green Lane, Eco Town",
      description: "Your one-stop shop for certified organic products.",
      logoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300",
      rating: 4.7,
      reviewCount: 40,
      isActive: true,
      categories: ['Organic', 'Health Foods', 'Supplements'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];

  try {
    for (const vendor of vendors) {
      await addDoc(collection(db, 'vendors'), vendor);
    }
    console.log('Vendors initialized successfully');
  } catch (error) {
    console.error('Error initializing vendors:', error);
    throw error;
  }
}; 