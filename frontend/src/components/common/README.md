# Common UI Components

This directory contains reusable UI components that are used throughout the application.

## Button Component

A versatile button component with multiple variants, sizes, and states.

### Features

- **Multiple Variants**: primary, secondary, success, error, warning, info, ghost, outline
- **Three Sizes**: sm, md, lg
- **Icon Support**: Left and right icon slots
- **Loading State**: Built-in loading spinner
- **Full Width**: Option to span full container width
- **Accessibility**: Proper disabled states and focus management

### Usage

```tsx
import { Button } from './components/common';

function MyComponent() {
  return (
    <Button variant="primary" size="md" onClick={handleClick}>
      Click Me
    </Button>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning' \| 'info' \| 'ghost' \| 'outline'` | `'primary'` | Button visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `fullWidth` | `boolean` | `false` | Make button full width |
| `loading` | `boolean` | `false` | Show loading spinner |
| `leftIcon` | `ReactNode` | `undefined` | Icon to display on the left |
| `rightIcon` | `ReactNode` | `undefined` | Icon to display on the right |
| `disabled` | `boolean` | `false` | Disable button |
| `children` | `ReactNode` | Required | Button content |

### Examples

See `Button.example.tsx` for comprehensive usage examples.

---

## Input Component

A flexible, accessible input component with label, error states, icons, and size variants.

### Features

- **Label Support**: Optional label with required indicator
- **Error & Helper Text**: Display validation errors or helpful hints
- **Icon Slots**: Left and right icon support for enhanced UX
- **Size Variants**: Three sizes (sm, md, lg) for different contexts
- **Full Width**: Option to span full container width
- **States**: Disabled and read-only states with appropriate styling
- **Accessibility**: Proper ARIA attributes linking inputs to labels and error messages
- **Design Tokens**: Uses shared `input-field` and `input-error` classes from global styles

### Usage

```tsx
import { Input } from './components/common';

function MyComponent() {
  return (
    <Input
      label="Email Address"
      type="email"
      placeholder="Enter your email"
      helperText="We'll never share your email"
      error={errors.email}
      leftIcon={<EnvelopeIcon className="w-5 h-5" />}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | `undefined` | Input label text |
| `error` | `string` | `undefined` | Error message to display |
| `helperText` | `string` | `undefined` | Helper text below input (hidden when error present) |
| `fullWidth` | `boolean` | `false` | Make input full width |
| `leftIcon` | `ReactNode` | `undefined` | Icon to display on the left inside input |
| `rightIcon` | `ReactNode` | `undefined` | Icon to display on the right inside input |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `disabled` | `boolean` | `false` | Disable input |
| `readOnly` | `boolean` | `false` | Make input read-only |
| `required` | `boolean` | `false` | Mark field as required (adds asterisk) |
| ...rest | `InputHTMLAttributes` | - | All standard HTML input attributes |

### Size Reference

- `sm`: Compact size for dense layouts (px-2.5 py-1.5, text-sm)
- `md`: Default size for most forms (px-3 py-2, text-base)
- `lg`: Large size for prominent inputs (px-4 py-3, text-lg)

### Examples

See `Input.example.tsx` for comprehensive usage examples including:
- Different sizes (sm, md, lg)
- Input states (default, disabled, read-only, required, error)
- Helper text and error messages
- Left and right icons
- Password toggle functionality
- Full-width inputs for forms
- Different input types (email, password, number, date, etc.)

### Use Cases in Messenger App

The Input component can be used for:
- **Authentication forms**: Login, registration, password reset
- **User profile**: Edit name, bio, status message
- **Search functionality**: Search contacts, messages, or groups
- **Message composition**: Text input with send button
- **Group management**: Group name, description fields
- **Settings**: Configuration fields for app preferences
- **Contact management**: Add contact, edit contact details

### Accessibility

The Input component follows accessibility best practices:
- Associates label with input using `htmlFor` and `id`
- Required fields marked with visual asterisk
- Error messages linked via `aria-describedby` and `aria-invalid`
- Helper text linked via `aria-describedby`
- Unique IDs auto-generated if not provided
- Error messages use `role="alert"` for screen readers
- Icons use `pointer-events-none` on left icon to prevent interference
- Focus states from global `input-field` class (focus ring with primary color)

### Styling

The Input uses design tokens from `index.css`:
- Base styling from `.input-field` class (consistent border, padding, focus states)
- Error styling from `.input-error` class (error color, error focus ring)
- Read-only state uses `bg-secondary-50` for visual distinction
- Colors use semantic tokens (primary-*, secondary-*, error-*)
- Smooth transitions on focus and state changes
- Proper disabled styling with opacity and cursor changes

### Best Practices

1. **Always provide labels**: Use the `label` prop for better accessibility and UX
2. **Use appropriate sizes**: Match input size to context (forms use md, dense UIs use sm)
3. **Show helpful errors**: Provide clear, actionable error messages
4. **Helper text for guidance**: Use `helperText` to explain format or requirements
5. **Icon sizing**: Match icon size to input size (w-4 h-4 for sm, w-5 h-5 for md, w-6 h-6 for lg)
6. **Full width in forms**: Use `fullWidth` in form layouts for consistent appearance
7. **Appropriate input types**: Use specific types (email, tel, url) for better mobile keyboards
8. **Required fields**: Mark required fields with the `required` prop
9. **Consistent validation**: Show errors only after user interaction (onBlur or onSubmit)
10. **Password visibility**: Implement password toggle with rightIcon (see example)

---

## Modal Component

A flexible, accessible modal dialog component with support for various configurations.

### Features

- **Backdrop Overlay**: Semi-transparent black background
- **Click Outside to Close**: Configurable overlay click behavior
- **Keyboard Navigation**: 
  - ESC key to close (configurable)
  - Focus trap for accessibility
- **Responsive Sizing**: Four size variants (sm, md, lg, xl)
- **Prevent Body Scroll**: Automatically prevents scrolling when open
- **Customizable Footer**: Optional footer for action buttons
- **Close Button**: Optional X button in the header
- **Smooth Animations**: Fade in/out transitions
- **Accessibility**: Proper ARIA attributes and roles

### Usage

```tsx
import { Modal } from './components/common/Modal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="My Modal"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={handleSubmit}>Submit</button>
          </div>
        }
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | Required | Controls modal visibility |
| `onClose` | `() => void` | Required | Callback when modal should close |
| `title` | `string` | `undefined` | Optional modal title |
| `children` | `ReactNode` | Required | Modal content |
| `footer` | `ReactNode` | `undefined` | Optional footer content (usually buttons) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal width |
| `closeOnOverlayClick` | `boolean` | `true` | Close when clicking backdrop |
| `closeOnEsc` | `boolean` | `true` | Close when pressing Escape key |
| `showCloseButton` | `boolean` | `true` | Show X button in header |

### Size Reference

- `sm`: max-w-md (28rem / 448px)
- `md`: max-w-lg (32rem / 512px)
- `lg`: max-w-2xl (42rem / 672px)
- `xl`: max-w-4xl (56rem / 896px)

### Examples

See `Modal.example.tsx` for comprehensive usage examples including:
- Simple modal with just title and content
- Confirmation dialog with action buttons
- Form modal with input fields
- Large modal with scrollable content

### Use Cases in Messenger App

The Modal component can be used for:
- **Confirmation dialogs**: Delete message, leave group, remove contact
- **Group management**: Create/edit group, add/remove participants
- **User profile**: View user details, shared chats
- **Settings panels**: App settings, notification preferences
- **Contact requests**: Accept/reject contact requests
- **Image viewer**: Full-size image display (alternative to inline viewer)

### Accessibility

The Modal component follows accessibility best practices:
- Uses `role="dialog"` and `aria-modal="true"`
- Properly labels with `aria-labelledby` when title is provided
- Closes on Escape key (configurable)
- Prevents body scroll when open
- Focuses modal on open for keyboard navigation
- Close button has `aria-label` for screen readers

### Styling

The Modal uses Tailwind CSS classes for styling:
- Responsive design with proper padding on mobile
- Maximum height of 90vh to prevent overflow
- Smooth transitions for fade in/out
- Hover states on close button
- Proper z-index (z-50) for stacking context

### Best Practices

1. **Always provide `onClose`**: Even if close behaviors are disabled, provide a way to close
2. **Use appropriate size**: Choose the smallest size that fits your content
3. **Footer for actions**: Put primary actions in the footer for consistency
4. **Keep content focused**: Modals should have a single, clear purpose
5. **Avoid nested modals**: Don't open modals from within other modals
6. **Test keyboard navigation**: Ensure Tab, Escape, and Enter keys work as expected
