import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Customers from './pages/Customers';
import CustomerVehicles from './pages/CustomerVehicles';
import VehicleWorkOrders from './pages/VehicleWorkOrders';
import WorkOrderDetail from './pages/WorkOrderDetail';
import WorkOrders from './pages/WorkOrders';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

const queryClient = new QueryClient();

// Wrapper para skipear SettingsProvider en rutas públicas
function AppRoutes() {
  const location = useLocation();
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div>
      {!isPublicRoute ? (
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      ) : (
        <AppContent />
      )}
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/customers/:id/vehicles" element={<ProtectedRoute><CustomerVehicles /></ProtectedRoute>} />
      <Route path="/work-orders" element={<ProtectedRoute><WorkOrders /></ProtectedRoute>} />
      <Route path="/vehicles/:vehicleId/work-orders" element={<ProtectedRoute><VehicleWorkOrders /></ProtectedRoute>} />
      <Route path="/vehicles/:vehicleId/work-orders/:workOrderId" element={<ProtectedRoute><WorkOrderDetail /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
