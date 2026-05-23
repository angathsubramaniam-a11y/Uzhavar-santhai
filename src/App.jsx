import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import { GiSprout } from 'react-icons/gi';
import { OrdersProvider } from './context/OrdersContext';

// Lazy load all pages for better performance
const CustomerLanding = lazy(() => import('./pages/customer/CustomerLanding'));
const CustomerAuth = lazy(() => import('./pages/customer/CustomerAuth'));
const FarmerAuth = lazy(() => import('./pages/farmer/FarmerAuth'));
const AdminAuth = lazy(() => import('./pages/admin/AdminAuth'));
const CustomerHome = lazy(() => import('./pages/customer/CustomerHome'));
const Cart = lazy(() => import('./pages/customer/Cart'));
const ProductListingPage = lazy(() => import('./pages/ProductListingPage'));
const FarmerProfilePublic = lazy(() => import('./pages/FarmerProfilePublic'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const CustomerOrders = lazy(() => import('./pages/customer/CustomerOrders'));
const CustomerProfile = lazy(() => import('./pages/customer/CustomerProfile'));
const CustomerSupport = lazy(() => import('./pages/customer/CustomerSupport'));
const FarmerDashboard = lazy(() => import('./pages/farmer/FarmerDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/delivery/DeliveryDashboard'));
const DeliveryAuth = lazy(() => import('./pages/delivery/DeliveryAuth'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream">
    <motion.div 
      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="text-4xl text-primary"
    >
      <GiSprout />
    </motion.div>
  </div>
);

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Optimized loading time for better UX
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen font-sans text-earth bg-cream transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-6 text-primary"
            >
              <GiSprout />
            </motion.div>
            <h1 className="text-4xl font-black text-gradient tracking-tighter mb-2">Uzhavar Sandhai</h1>
            <p className="text-gray-400 font-medium animate-pulse">Growing freshness for you...</p>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
          >
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<CustomerLanding />} />
                <Route path="/products" element={<ProductListingPage />} />
                <Route path="/farmer-profile/:id" element={<FarmerProfilePublic />} />
                
                {/* CUSTOMER ROUTES */}
                <Route path="/customer/login" element={<CustomerAuth type="login" />} />
                <Route path="/customer/signup" element={<CustomerAuth type="signup" />} />
                <Route path="/customer/home" element={<ProtectedRoute role="customer"><CustomerHome /></ProtectedRoute>} />
                <Route path="/customer/market" element={<ProtectedRoute role="customer"><CustomerHome /></ProtectedRoute>} />
                <Route path="/customer/cart" element={<ProtectedRoute role="customer"><Cart /></ProtectedRoute>} />
                <Route path="/customer/checkout" element={<ProtectedRoute role="customer"><CheckoutPage /></ProtectedRoute>} />
                <Route path="/customer/orders" element={<ProtectedRoute role="customer"><CustomerOrders /></ProtectedRoute>} />
                <Route path="/customer/profile" element={<ProtectedRoute role="customer"><CustomerProfile /></ProtectedRoute>} />
                <Route path="/customer/support" element={<ProtectedRoute role="customer"><CustomerSupport /></ProtectedRoute>} />

                {/* FARMER ROUTES */}
                <Route path="/farmer/login" element={<FarmerAuth type="login" />} />
                <Route path="/farmer/signup" element={<FarmerAuth type="signup" />} />
                <Route path="/farmer/*" element={<ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>} />

                {/* ADMIN ROUTES */}
                <Route path="/admin/login" element={<AdminAuth />} />
                <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

                {/* DELIVERY ROUTES */}
                <Route path="/delivery/login" element={<DeliveryAuth type="login" />} />
                <Route path="/delivery/signup" element={<DeliveryAuth type="signup" />} />
                <Route path="/delivery/dashboard" element={<ProtectedRoute role="delivery"><DeliveryDashboard /></ProtectedRoute>} />

                {/* CATCH ALL */}
                <Route path="*" element={<CustomerLanding />} />
              </Routes>
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const AppWrapper = () => (
  <OrdersProvider>
    <App />
  </OrdersProvider>
);

export default AppWrapper;
