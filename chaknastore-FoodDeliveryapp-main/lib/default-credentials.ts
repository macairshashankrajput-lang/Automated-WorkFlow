/**
 * Default Credentials for Chakna Store
 * Configured for seamless admin, vendor, and customer testing
 */

export const DEFAULT_ADMIN_CREDENTIALS = {
  name: 'Shashank Rajput (Admin)',
  username: 'admin',
  email: 'admin@example.com',
  phone: '9876543210',
  password: '143#MaaPaa',
  role: 'admin' as const,
};

export const DEFAULT_TEST_USERS = [
  {
    name: 'Shashank Rajput (Admin)',
    username: 'admin',
    email: 'admin@example.com',
    phone: '9876543210',
    password: '143#MaaPaa',
    role: 'admin' as const,
  },
  {
    name: 'Shashank Rajput (Admin Alt)',
    username: 'rajputsg',
    email: 'macair.shashankrajput@gmail.com',
    phone: '9876543210',
    password: '143#MaaPaa',
    role: 'admin' as const,
  },
  {
    name: 'Demo Admin',
    username: 'demo-admin',
    email: 'demo-admin@chakna.app',
    phone: '9876543210',
    password: 'admin123',
    role: 'admin' as const,
  },
  {
    name: 'Priya Customer',
    username: 'customer',
    email: 'customer@chakna.app',
    phone: '9876543210',
    password: 'password123',
    role: 'customer' as const,
  },
  {
    name: 'North Feast Vendor',
    username: 'vendor',
    email: 'vendor@chakna.app',
    phone: '9876543211',
    password: 'vendor123',
    businessName: 'North Feast Kitchen',
    role: 'vendor' as const,
  },
];
