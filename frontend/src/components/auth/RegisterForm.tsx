import { useState, FormEvent } from 'react';
import { Input, Button } from '../common';

export interface RegisterFormProps {
  onSubmit: (username: string, password: string, confirmPassword: string) => Promise<void>;
  error?: string;
  isLoading?: boolean;
}

/**
 * RegisterForm component - Reusable registration form with validation
 * 
 * @example
 * ```tsx
 * <RegisterForm
 *   onSubmit={handleRegister}
 *   error={errorMessage}
 *   isLoading={isRegistering}
 * />
 * ```
 */
export const RegisterForm = ({ onSubmit, error, isLoading = false }: RegisterFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: {
      username?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Username validation
    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (username.length > 30) {
      errors.username = 'Username must not exceed 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await onSubmit(username, password, confirmPassword);
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
        placeholder="Choose a username"
        helperText="3-30 characters, letters, numbers, and underscores only"
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
        placeholder="Create a strong password"
        helperText="At least 8 characters with uppercase, lowercase, and number"
        required
        fullWidth
        disabled={isLoading}
        autoComplete="new-password"
      />

      <Input
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          if (validationErrors.confirmPassword) {
            setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }
        }}
        error={validationErrors.confirmPassword}
        placeholder="Re-enter your password"
        required
        fullWidth
        disabled={isLoading}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={isLoading}
        className="mt-6"
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
};
