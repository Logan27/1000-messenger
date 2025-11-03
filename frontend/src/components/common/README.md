# Common UI Components

This directory contains reusable UI components that are used across the application.

## Button

A flexible button component with multiple variants, sizes, and states.

### Import

```tsx
import { Button } from '@/components/common/Button';
// or
import { Button } from '@/components/common';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning' \| 'info' \| 'ghost' \| 'outline'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `fullWidth` | `boolean` | `false` | Whether button should take full width |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `leftIcon` | `React.ReactNode` | - | Icon to display on the left |
| `rightIcon` | `React.ReactNode` | - | Icon to display on the right |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button HTML type |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `React.ReactNode` | - | Button content (required) |

All standard HTML button attributes are also supported via spreading.

### Usage Examples

#### Basic Usage

```tsx
<Button>Click me</Button>
```

#### Different Variants

```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="success">Success</Button>
<Button variant="error">Delete</Button>
<Button variant="warning">Warning</Button>
<Button variant="info">Info</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
```

#### Different Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

#### Button States

```tsx
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>
```

#### With Icons

```tsx
import { PlusIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

<Button leftIcon={<PlusIcon className="w-5 h-5" />}>
  Add Contact
</Button>

<Button rightIcon={<PaperAirplaneIcon className="w-5 h-5" />}>
  Send
</Button>
```

#### Full Width

```tsx
<Button fullWidth>Full Width Button</Button>
```

#### Form Submit

```tsx
<form onSubmit={handleSubmit}>
  <Button type="submit" variant="success">
    Submit Form
  </Button>
</form>
```

#### Custom Styling

```tsx
<Button className="shadow-lg">Custom Styled Button</Button>
```

#### With Click Handler

```tsx
<Button onClick={() => console.log('Clicked!')}>
  Click Handler
</Button>
```

## Design Tokens

The Button component uses the application's Tailwind color palette:

- **Primary**: Blue - Main action buttons
- **Secondary**: Gray - Secondary actions
- **Success**: Green - Success actions (e.g., submit, confirm)
- **Error**: Red - Destructive actions (e.g., delete, cancel)
- **Warning**: Yellow - Warning actions
- **Info**: Cyan - Informational actions
- **Ghost**: Transparent - Subtle actions
- **Outline**: Bordered - Alternative style

## Accessibility

- Proper focus states with visible focus ring
- Disabled state properly communicated to screen readers
- Loading state automatically disables button
- Supports all ARIA attributes via prop spreading
