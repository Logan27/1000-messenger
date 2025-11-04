import { useState, FormEvent } from 'react';
import { Input, Button } from '../common';

export interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  error?: string;
  isLoading?: boolean;
}

/**
 * LoginForm component - Reusable login form with validation
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" role="alert">
          {error}
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
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};
