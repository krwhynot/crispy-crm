import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from './sonner';
import React from 'react';
import { toast } from 'sonner';
import { Button } from './button';
import { CheckCircle2, AlertCircle, Info as InfoIcon, AlertTriangle, Loader2 } from 'lucide-react';

const meta = {
  title: 'UI/Sonner (Toast)',
  component: Toaster,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic toasts
export const Default: Story = {
  render: () => (
    <Button onClick={() => toast('This is a default toast notification')}>
      Show Default Toast
    </Button>
  ),
};

export const Success: Story = {
  render: () => (
    <Button
      onClick={() => toast.success('Your changes have been saved successfully!')}
      className="bg-green-600 hover:bg-green-700"
    >
      Show Success Toast
    </Button>
  ),
};

export const Error: Story = {
  render: () => (
    <Button
      variant="destructive"
      onClick={() => toast.error('Something went wrong. Please try again.')}
    >
      Show Error Toast
    </Button>
  ),
};

export const Warning: Story = {
  render: () => (
    <Button
      onClick={() => toast.warning('Your session will expire in 5 minutes')}
      className="bg-yellow-600 hover:bg-yellow-700"
    >
      Show Warning Toast
    </Button>
  ),
};

export const Info: Story = {
  render: () => (
    <Button
      onClick={() => toast.info('New features are available. Check them out!')}
      className="bg-blue-600 hover:bg-blue-700"
    >
      Show Info Toast
    </Button>
  ),
};

// With descriptions
export const WithDescription: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast('Event Created', {
          description: 'Monday, October 7th at 4:00pm',
        })
      }
    >
      Toast with Description
    </Button>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast('System Update', {
          description:
            'A new version of the application is available. This update includes bug fixes, performance improvements, and new features that will enhance your experience.',
        })
      }
    >
      Long Content Toast
    </Button>
  ),
};

// With actions
export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast('File deleted', {
          action: {
            label: 'Undo',
            onClick: () => toast.success('File restored'),
          },
        })
      }
    >
      Toast with Undo Action
    </Button>
  ),
};

export const WithMultipleActions: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast.message('Meeting Invitation', {
          description: 'You have been invited to a meeting at 2:00 PM',
          action: {
            label: 'Accept',
            onClick: () => toast.success('Meeting accepted'),
          },
          cancel: {
            label: 'Decline',
            onClick: () => toast.error('Meeting declined'),
          },
        })
      }
    >
      Toast with Multiple Actions
    </Button>
  ),
};

// Custom icons
export const WithCustomIcon: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button
        onClick={() =>
          toast('Download complete', {
            icon: <CheckCircle2 className="text-green-500" />,
          })
        }
      >
        Custom Success Icon
      </Button>
      <Button
        onClick={() =>
          toast('Upload failed', {
            icon: <AlertCircle className="text-red-500" />,
          })
        }
      >
        Custom Error Icon
      </Button>
    </div>
  ),
};

// Loading states
export const LoadingToast: Story = {
  render: () => (
    <Button
      onClick={() => {
        const id = toast.loading('Processing your request...');
        setTimeout(() => {
          toast.success('Request completed!', { id });
        }, 3000);
      }}
    >
      Show Loading Toast
    </Button>
  ),
};

export const PromiseToast: Story = {
  render: () => (
    <Button
      onClick={() => {
        const promise = () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ name: 'Document.pdf' });
            }, 3000);
          });

        toast.promise(promise(), {
          loading: 'Uploading file...',
          success: (data) => `${data.name} uploaded successfully`,
          error: 'Failed to upload file',
        });
      }}
    >
      Promise-based Toast
    </Button>
  ),
};

// Positioning
export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-2">
      <Button onClick={() => toast('Top Left', { position: 'top-left' })}>
        Top Left
      </Button>
      <Button onClick={() => toast('Top Center', { position: 'top-center' })}>
        Top Center
      </Button>
      <Button onClick={() => toast('Top Right', { position: 'top-right' })}>
        Top Right
      </Button>
      <Button onClick={() => toast('Bottom Left', { position: 'bottom-left' })}>
        Bottom Left
      </Button>
      <Button onClick={() => toast('Bottom Center', { position: 'bottom-center' })}>
        Bottom Center
      </Button>
      <Button onClick={() => toast('Bottom Right', { position: 'bottom-right' })}>
        Bottom Right
      </Button>
    </div>
  ),
};

// Duration
export const CustomDuration: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button
        onClick={() =>
          toast('Quick notification', {
            duration: 1000,
          })
        }
      >
        1 Second
      </Button>
      <Button
        onClick={() =>
          toast('Standard notification', {
            duration: 4000,
          })
        }
      >
        4 Seconds
      </Button>
      <Button
        onClick={() =>
          toast('Long notification', {
            duration: 10000,
          })
        }
      >
        10 Seconds
      </Button>
      <Button
        onClick={() =>
          toast('Persistent notification', {
            duration: Infinity,
            action: {
              label: 'Dismiss',
              onClick: () => {},
            },
          })
        }
      >
        Persistent
      </Button>
    </div>
  ),
};

// Dismissible
export const Dismissible: Story = {
  render: () => (
    <Button
      onClick={() => {
        toast('Click the X to dismiss', {
          dismissible: true,
          duration: Infinity,
        });
      }}
    >
      Dismissible Toast
    </Button>
  ),
};

// Multiple toasts
export const MultipleToasts: Story = {
  render: () => (
    <Button
      onClick={() => {
        toast('First notification');
        setTimeout(() => toast.success('Second notification'), 100);
        setTimeout(() => toast.error('Third notification'), 200);
        setTimeout(() => toast.info('Fourth notification'), 300);
      }}
    >
      Show Multiple Toasts
    </Button>
  ),
};

// Update existing toast
export const UpdateToast: Story = {
  render: () => (
    <Button
      onClick={() => {
        const id = toast.loading('Preparing...');
        setTimeout(() => {
          toast.loading('Processing...', { id });
        }, 1000);
        setTimeout(() => {
          toast.loading('Almost done...', { id });
        }, 2000);
        setTimeout(() => {
          toast.success('Complete!', { id });
        }, 3000);
      }}
    >
      Update Toast Progress
    </Button>
  ),
};

// Custom styling
export const CustomStyling: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button
        onClick={() =>
          toast.custom((t) => (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg shadow-lg">
              <p className="font-bold">Special Announcement</p>
              <p className="text-sm">This is a custom styled toast!</p>
            </div>
          ))
        }
      >
        Gradient Toast
      </Button>
      <Button
        onClick={() =>
          toast('Dark themed toast', {
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #333',
            },
          })
        }
      >
        Dark Toast
      </Button>
    </div>
  ),
};

// Rich content
export const RichContent: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast.custom((t) => (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md">
            <div className="flex items-start gap-3">
              <img
                src="https://via.placeholder.com/40"
                alt="User"
                className="rounded-full"
              />
              <div className="flex-1">
                <p className="font-semibold">New message from John</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hey! Are you available for a quick call?
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      toast.dismiss(t);
                      toast.success('Replied!');
                    }}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => toast.dismiss(t)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      }
    >
      Rich Content Toast
    </Button>
  ),
};

// Form in toast
export const FormInToast: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast.custom((t) => (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <p className="font-semibold mb-2">Quick Feedback</p>
            <input
              type="text"
              placeholder="Enter your feedback..."
              className="w-full px-3 py-2 border rounded mb-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  toast.dismiss(t);
                  toast.success('Feedback submitted!');
                }
              }}
            />
            <button
              onClick={() => {
                toast.dismiss(t);
                toast.success('Feedback submitted!');
              }}
              className="w-full px-3 py-2 bg-primary text-primary-foreground rounded"
            >
              Submit
            </button>
          </div>
        ))
      }
    >
      Form Toast
    </Button>
  ),
};

// Close all toasts
export const CloseAll: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button
        onClick={() => {
          toast('Toast 1');
          toast.success('Toast 2');
          toast.error('Toast 3');
          toast.info('Toast 4');
        }}
      >
        Show Multiple
      </Button>
      <Button variant="destructive" onClick={() => toast.dismiss()}>
        Dismiss All
      </Button>
    </div>
  ),
};

// Accessibility
export const WithAriaProps: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast.success('Accessible notification', {
          ariaProps: {
            role: 'status',
            'aria-live': 'polite',
          },
        })
      }
    >
      Accessible Toast
    </Button>
  ),
};

// Important/Urgent
export const ImportantToast: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast.error('Critical System Error', {
          important: true,
          description: 'Immediate action required',
          duration: Infinity,
          action: {
            label: 'Fix Now',
            onClick: () => toast.success('Issue resolved'),
          },
        })
      }
      variant="destructive"
    >
      Important Toast
    </Button>
  ),
};