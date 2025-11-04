import React, { useState } from 'react';
import { Input } from './Input';
import {
  EnvelopeIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

export const InputExamples: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <section>
        <h2 className="text-2xl font-bold mb-4">Input Sizes</h2>
        <div className="space-y-4">
          <Input
            size="sm"
            placeholder="Small input"
            label="Small Size"
          />
          <Input
            size="md"
            placeholder="Medium input (default)"
            label="Medium Size"
          />
          <Input
            size="lg"
            placeholder="Large input"
            label="Large Size"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Input States</h2>
        <div className="space-y-4">
          <Input
            placeholder="Default state"
            label="Default"
          />
          <Input
            placeholder="Disabled input"
            label="Disabled"
            disabled
            value="Cannot edit this"
          />
          <Input
            placeholder="Read-only input"
            label="Read Only"
            readOnly
            value="Read-only value"
          />
          <Input
            placeholder="Required field"
            label="Required Field"
            required
          />
          <Input
            placeholder="Input with error"
            label="With Error"
            error="This field is required"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Input with Helper Text</h2>
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            label="Email Address"
            helperText="We'll never share your email with anyone else."
            leftIcon={<EnvelopeIcon className="w-5 h-5" />}
          />
          <Input
            type="text"
            placeholder="Enter username"
            label="Username"
            helperText="Username must be 3-20 characters"
            error="Username is already taken"
            leftIcon={<UserIcon className="w-5 h-5" />}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Input with Icons</h2>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Search..."
            label="Search"
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <Input
            type="email"
            placeholder="your@email.com"
            label="Email"
            leftIcon={<EnvelopeIcon className="w-5 h-5" />}
          />
          <Input
            type="tel"
            placeholder="+1 (555) 000-0000"
            label="Phone Number"
            leftIcon={<PhoneIcon className="w-5 h-5" />}
          />
          <Input
            type="text"
            placeholder="1234 5678 9012 3456"
            label="Credit Card"
            leftIcon={<CreditCardIcon className="w-5 h-5" />}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Password Toggle Example</h2>
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter password"
          label="Password"
          leftIcon={<LockClosedIcon className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          }
          helperText="Password must be at least 8 characters"
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Full Width Input</h2>
        <Input
          fullWidth
          placeholder="This input takes full width"
          label="Full Width"
          helperText="Perfect for forms and modals"
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Form Example</h2>
        <form className="space-y-4">
          <Input
            fullWidth
            type="text"
            placeholder="John Doe"
            label="Full Name"
            required
            leftIcon={<UserIcon className="w-5 h-5" />}
          />
          <Input
            fullWidth
            type="email"
            placeholder="john@example.com"
            label="Email Address"
            required
            leftIcon={<EnvelopeIcon className="w-5 h-5" />}
            helperText="We'll send a confirmation email to this address"
          />
          <Input
            fullWidth
            type="password"
            placeholder="••••••••"
            label="Password"
            required
            leftIcon={<LockClosedIcon className="w-5 h-5" />}
            helperText="Must be at least 8 characters"
          />
          <Input
            fullWidth
            type="password"
            placeholder="••••••••"
            label="Confirm Password"
            required
            leftIcon={<LockClosedIcon className="w-5 h-5" />}
          />
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Different Input Types</h2>
        <div className="space-y-4">
          <Input
            fullWidth
            type="text"
            placeholder="Text input"
            label="Text"
          />
          <Input
            fullWidth
            type="number"
            placeholder="123"
            label="Number"
          />
          <Input
            fullWidth
            type="date"
            label="Date"
          />
          <Input
            fullWidth
            type="time"
            label="Time"
          />
          <Input
            fullWidth
            type="url"
            placeholder="https://example.com"
            label="URL"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Size Variants with Icons</h2>
        <div className="space-y-4">
          <Input
            size="sm"
            placeholder="Small with icon"
            label="Small"
            leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
          />
          <Input
            size="md"
            placeholder="Medium with icon"
            label="Medium"
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
          />
          <Input
            size="lg"
            placeholder="Large with icon"
            label="Large"
            leftIcon={<MagnifyingGlassIcon className="w-6 h-6" />}
          />
        </div>
      </section>
    </div>
  );
};
