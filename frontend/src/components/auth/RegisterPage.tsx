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
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-telegram p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white shadow-telegram">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2 text-center text-secondary-900">
          Create Account
        </h2>
        <p className="text-center text-secondary-600 mb-6">Join us and start messaging</p>

        <RegisterForm
          onSubmit={handleRegister}
          error={error}
          isLoading={isLoading}
        />

        <p className="mt-6 text-center text-sm text-secondary-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
