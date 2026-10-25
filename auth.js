/**
 * CleanRide Authentication Handler
 * Supports Signin, Signup, and Session persistence
 */

const AUTH_STORAGE_KEY = 'cleanride_session';
const USERS_STORAGE_KEY = 'cleanride_registered_users';

// Seed default users if not set
function initAuthSystem() {
  const users = localStorage.getItem(USERS_STORAGE_KEY);
  if (!users) {
    const defaultUsers = [
      {
        id: 'CUST-8801',
        email: 'customer@cleanride.com',
        password: 'password123',
        fullName: 'Sarah Jenkins',
        phone: '+60 12-889 4432',
        role: 'customer'
      },
      {
        id: 'MGR-1001',
        email: 'owner@cleanride.com',
        password: 'admin123',
        fullName: 'HQ Operations Manager',
        phone: '+60 12-345 6789',
        role: 'owner'
      }
    ];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  }
}

function getRegisteredUsers() {
  initAuthSystem();
  return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
}

function getCurrentSession() {
  const session = localStorage.getItem(AUTH_STORAGE_KEY);
  return session ? JSON.parse(session) : null;
}

function setCurrentSession(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function clearCurrentSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function loginUser(email, password) {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  
  // Find matching user
  const foundUser = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
  
  if (foundUser) {
    setCurrentSession(foundUser);
    return { success: true, user: foundUser };
  }

  // Allow flexible demo login if email contains 'owner' vs standard customer
  if (normalizedEmail.includes('owner') || normalizedEmail.includes('admin')) {
    const ownerUser = {
      id: 'MGR-1001',
      email: normalizedEmail,
      fullName: 'Operations Manager',
      phone: '+60 12-345 6789',
      role: 'owner'
    };
    setCurrentSession(ownerUser);
    return { success: true, user: ownerUser };
  } else {
    // Treat any valid login as a customer
    const custUser = {
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      email: normalizedEmail,
      fullName: normalizedEmail.split('@')[0].replace('.', ' ').toUpperCase(),
      phone: '+60 12-889 4432',
      role: 'customer'
    };
    setCurrentSession(custUser);
    return { success: true, user: custUser };
  }
}

function registerUser(fullName, email, password, role = 'customer') {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const newUser = {
    id: role === 'owner' ? `MGR-${Math.floor(1000 + Math.random() * 9000)}` : `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    email: normalizedEmail,
    password: password,
    fullName: fullName.trim() || 'New Customer',
    phone: '+60 12-000 0000',
    role: role
  };

  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  setCurrentSession(newUser);
  return { success: true, user: newUser };
}

function logoutUser() {
  clearCurrentSession();
  window.location.href = 'login.html';
}

// Auto check session when on customer.html
function checkCustomerAuth() {
  const session = getCurrentSession();
  if (!session) {
    // Pre-seed Sarah Jenkins for immediate testing if opened directly
    const defaultCust = {
      id: 'CUST-8801',
      email: 'customer@cleanride.com',
      fullName: 'Sarah Jenkins',
      phone: '+60 12-889 4432',
      role: 'customer'
    };
    setCurrentSession(defaultCust);
    return defaultCust;
  }
  return session;
}

initAuthSystem();
