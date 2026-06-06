import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AxiosInterceptor } from './useAxiosInterceptor';
import ContainersPage from '../containers/pages/ContainersPage';
import ProductsPage from '../products/pages/ProductsPage';
import MyProductsPage from '../products/pages/MyProductsPage';
import ImportRequestsPage from '../importRequests/pages/ImportRequestsPage';
import Header from '../components/Header';
import Trackingpage from '../tracking/pages/Trackingpage'
import Sidebar from '../components/Sidebar';
import CostCalculationsPage from '../costCalculations/pages/CostCalculationsPage';
import PaymentSuccessPage from '../payments/PaymentSuccessPage';
import Footer from '../components/Footer';
import '../components/Layout.css';

// Pages without Layout (login / register / payment-success)
const NO_LAYOUT_ROUTES = ['/login', '/register', '/payment-success'];

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const noLayout = NO_LAYOUT_ROUTES.includes(location.pathname);

  if (noLayout || !isAuthenticated) {
    return <>{children}</>;
  }

  const handleCloseSidebar = () => {
    setIsOpen(false);
  };

  const handleToggleSidebar = () => {
    setCollapsed((c) => !c);
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={`app-shell${collapsed ? ' app-shell--collapsed' : ''}`}>
      <Header onToggleSidebar={handleToggleSidebar} />

      <Sidebar
        collapsed={collapsed}
        isOpen={isOpen}
        onClose={handleCloseSidebar}
        isMobile={isMobile}
      />

      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
};

const AppRouter: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AxiosInterceptor />
        <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/products" element={<ProductsPage />} />

            {/* Payment Success — No Layout */}
            <Route path="/payment-success" element={<PaymentSuccessPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div style={{ padding: '32px' }}>
                    <h1 style={{ color: '#14532d', fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
                    <p style={{ color: '#6b7280', marginTop: 8 }}>
                      Welcome to your dashboard!
                    </p>
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-products"
              element={
                <ProtectedRoute requiredRoles={['ImportOffice']}>
                  <MyProductsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/shipments"
              element={
                <ProtectedRoute requiredRoles={['Customer', 'ImportOffice', 'Admin', 'Support']}>
                  <ImportRequestsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div style={{ padding: '32px' }}>
                    <h1 style={{ color: '#14532d', fontSize: 24, fontWeight: 700 }}>Profile</h1>
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/containers"
              element={
                <ProtectedRoute requiredRoles={['ImportOffice', 'Admin', 'Support']}>
                  <ContainersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cost-calculations"
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Support', 'ImportOffice', 'Customer']}>
                  <CostCalculationsPage />
                </ProtectedRoute>
              }
            />

              <Route
              path="/tracking"
              element={
<ProtectedRoute requiredRoles={['Admin', 'Support', 'ImportOffice', 'Customer']}>
                  <Trackingpage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </Router>
  );
};

export default AppRouter;