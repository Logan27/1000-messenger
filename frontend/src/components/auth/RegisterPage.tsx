import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { RegisterForm } from './RegisterForm';

export const RegisterPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const register = useAuthStore(state => state.register);

  const handleRegister = async (username: string, password: string, confirmPassword: string) => {
    setError('');
    setIsLoading(true);
    try {
      await register(username, password, confirmPassword);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Username might already exist.');
      throw err; // Re-throw to let RegisterForm handle it
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Create Account
        </h2>
        
        <RegisterForm 
          onSubmit={handleRegister} 
          error={error} 
          isLoading={isLoading}
        />
        
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
