import React from 'react';
import { Button } from './Button';
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline';

export const ButtonExamples: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="error">Error</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="info">Info</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Button Sizes</h2>
        <div className="flex items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Button States</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Buttons with Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Button leftIcon={<PlusIcon className="w-5 h-5" />}>
            Add Contact
          </Button>
          <Button rightIcon={<PaperAirplaneIcon className="w-5 h-5" />}>
            Send Message
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Full Width Button</h2>
        <div className="max-w-md">
          <Button fullWidth>Full Width Button</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Button Types</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <Button type="submit" variant="success">Submit</Button>
          <Button type="reset" variant="secondary">Reset</Button>
          <Button type="button">Button</Button>
        </form>
      </section>
    </div>
  );
};
