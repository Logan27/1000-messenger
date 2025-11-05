import { useState, FormEvent } from 'react';
import { Input, Button } from '../common';

export interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  error?: string;
  isLoading?: boolean;
}

/**
 * LoginForm component - Reusable login form with Telegram-inspired design
 *
 * @example
 * ```tsx
 * <LoginForm
 *   onSubmit={handleLogin}
 *   error={errorMessage}
 *   isLoading={isAuthenticating}
 * />
 * ```
 */
export const LoginForm = ({ onSubmit, error, isLoading = false }: LoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(username, password);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-error-50 border border-error-200 text-error-700 rounded-xl text-sm animate-slide-down" role="alert">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <Input
        id="username"
        label="Username"
        type="text"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          if (validationErrors.username) {
            setValidationErrors((prev) => ({ ...prev, username: undefined }));
          }
        }}
        error={validationErrors.username}
        placeholder="Enter your username"
        required
        fullWidth
        disabled={isLoading}
        autoComplete="username"
      />

      <Input
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (validationErrors.password) {
            setValidationErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        error={validationErrors.password}
        placeholder="Enter your password"
        required
        fullWidth
        disabled={isLoading}
        autoComplete="current-password"
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={isLoading}
        className="mt-6"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="spinner-sm"></div>
            <span>Logging in...</span>
          </div>
        ) : (
          'Login'
        )}
      </Button>
    </form>
  );
};
