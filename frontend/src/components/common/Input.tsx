import React, { forwardRef } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: InputSize;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-3 text-lg',
};

const iconSizeClasses: Record<InputSize, string> = {
  sm: 'left-2.5',
  md: 'left-3',
  lg: 'left-4',
};

const iconSizeClassesRight: Record<InputSize, string> = {
  sm: 'right-2.5',
  md: 'right-3',
  lg: 'right-4',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      size = 'md',
      className = '',
      disabled = false,
      readOnly = false,
      required = false,
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const baseClasses = 'input-field';
    const errorClasses = error ? 'input-error' : '';
    const readOnlyClasses = readOnly ? 'bg-secondary-50 cursor-default' : '';
    const widthClass = fullWidth ? 'w-full' : '';
    const iconPaddingLeft = leftIcon ? (size === 'sm' ? 'pl-9' : size === 'lg' ? 'pl-12' : 'pl-10') : '';
    const iconPaddingRight = rightIcon ? (size === 'sm' ? 'pr-9' : size === 'lg' ? 'pr-12' : 'pr-10') : '';

    const inputClasses = [
      baseClasses,
      sizeClasses[size],
      errorClasses,
      readOnlyClasses,
      widthClass,
      iconPaddingLeft,
      iconPaddingRight,
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={widthClass}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-secondary-700 mb-1.5"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className={`absolute ${iconSizeClasses[size]} top-1/2 transform -translate-y-1/2 text-secondary-400 pointer-events-none`}>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            {...rest}
          />

          {rightIcon && (
            <div className={`absolute ${iconSizeClassesRight[size]} top-1/2 transform -translate-y-1/2 text-secondary-400`}>
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-error-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1.5 text-sm text-secondary-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
