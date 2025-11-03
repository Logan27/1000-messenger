# Common UI Components

This directory contains reusable UI components that are used throughout the application.

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
