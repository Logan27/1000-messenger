# Common UI Components

This directory contains reusable UI components used throughout the application.

## Avatar

A flexible avatar component for displaying user profile pictures or initials.

### Usage

```tsx
import { Avatar } from '@/components/common';

// Basic usage with initials fallback
<Avatar name="John Doe" />

// With avatar image
<Avatar name="John Doe" avatarUrl="https://example.com/avatar.jpg" />

// Different sizes
<Avatar name="John Doe" size="xs" />
<Avatar name="John Doe" size="sm" />
<Avatar name="John Doe" size="md" /> // default
<Avatar name="John Doe" size="lg" />
<Avatar name="John Doe" size="xl" />

// With online status indicator
<Avatar name="John Doe" status="online" />
<Avatar name="John Doe" status="away" />
<Avatar name="John Doe" status="offline" />

// With custom className
<Avatar name="John Doe" className="mr-4" />
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | - | User's name (used for initials fallback) |
| `avatarUrl` | `string` | No | `undefined` | URL of the user's avatar image |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | No | `'md'` | Size of the avatar |
| `status` | `'online' \| 'offline' \| 'away'` | No | `undefined` | Online status indicator |
| `className` | `string` | No | `''` | Additional CSS classes |

### Features

- **Automatic Initials**: If no avatar image is provided, displays user's initials (first letter of first and last name, or just first letter)
- **Multiple Sizes**: Five predefined sizes from extra small to extra large
- **Status Indicators**: Optional colored badge showing online/away/offline status
- **Responsive Images**: Avatar images use `object-cover` to maintain aspect ratio
- **Fallback Styling**: Consistent gray background with dark gray text for initials
- **Accessible**: Includes proper `alt` attributes for images

### Size Reference

- `xs`: 24×24px (6 Tailwind units)
- `sm`: 32×32px (8 Tailwind units)
- `md`: 40×40px (10 Tailwind units) - Default
- `lg`: 48×48px (12 Tailwind units)
- `xl`: 64×64px (16 Tailwind units)

### Status Colors

- `online`: Green indicator
- `away`: Yellow indicator
- `offline`: Gray indicator
