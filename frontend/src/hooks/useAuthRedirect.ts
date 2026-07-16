import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Redirects to /login when auth token is cleared
 * (e.g., after a 401 response)
 */
export function useAuthRedirect() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    // If no token but Auth context thinks we're authenticated, something went wrong
    // This can happen after a 401 response cleared localStorage
    if (!token && isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);
}
