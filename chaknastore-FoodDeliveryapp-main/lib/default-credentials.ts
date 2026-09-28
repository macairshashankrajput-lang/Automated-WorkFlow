/**
 * Default Admin Credentials
 * These are used for seeding the database with an admin user for testing
 */

export const DEFAULT_ADMIN_CREDENTIALS = {
  name: 'Demo Admin',
  username: 'demo-admin',
  email: 'admin@example.com',
  phone: '0000000000',
  password: 'REPLACE_WITH_LOCAL_SECRET',
  role: 'admin' as const,
};

export const DEFAULT_TEST_USERS = [
  {
    name: 'Demo Admin',
    username: 'demo-admin',
    email: 'admin@example.com',
    phone: '0000000000',
    password: 'REPLACE_WITH_LOCAL_SECRET',
    role: 'admin' as const,
  },
];
