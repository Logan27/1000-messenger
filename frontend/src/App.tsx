import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useWebSocket } from './hooks/useWebSocket';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ChatLayout } from './components/chat/ChatLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuthStore();

  // Initialize WebSocket connection when authenticated
  useWebSocket();

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Public routes - redirect to home if already authenticated */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
          />

          {/* Protected routes - require authentication */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ChatLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
