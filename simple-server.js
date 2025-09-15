const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3003;

// Get allowed origins from environment or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Auth endpoints
app.post('/api/v1/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    console.log('Register request:', { name, email, password: '***' });
    
    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: '1',
        name: name,
        email: email,
        role: 'consumer'
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/v1/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    console.log('Login request:', { email, password: '***' });
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: '1',
        name: 'Test User',
        email: email,
        role: 'consumer'
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/v1/auth/me', (req, res) => {
  res.json({
    success: true,
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'consumer'
    }
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Fanpit Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me',
        logout: 'POST /api/v1/auth/logout'
      }
    }
  });
});

// Payment endpoints
app.post('/api/v1/payments/create-order', (req, res) => {
  try {
    const { bookingId, amount, currency = 'INR', customerDetails } = req.body;
    
    // Simulate Razorpay order creation
    const order = {
      orderId: `order_demo_${Date.now()}`,
      amount: amount * 100, // Convert to paise
      currency,
      key: process.env.RAZORPAY_KEY || 'rzp_test_RHCtm0tnz9yjuE'
    };
    
    console.log('Demo order created:', order);
    
    res.json({
      success: true,
      data: order,
      message: 'Order created successfully (demo mode)'
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

app.post('/api/v1/payments/verify', (req, res) => {
  try {
    const { orderId, paymentId, signature, bookingId } = req.body;
    
    // Always verify as successful in demo mode
    const verificationResult = {
      verified: true,
      booking: {
        id: bookingId,
        bookingCode: `FP${Date.now().toString().slice(-6)}`
      }
    };
    
    console.log('Demo payment verified:', paymentId);
    
    res.json({
      success: true,
      data: verificationResult,
      message: 'Payment verified successfully (demo mode)'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Fanpit Backend API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Allowed origins: ${allowedOrigins.join(', ')}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
