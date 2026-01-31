import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import type { DataProvider } from "react-admin";
import { AdminContext, defaultDataProvider } from "react-admin";
import {
  SampleStatusBadge,
  SampleStatusStepper,
  SAMPLE_STATUS_WORKFLOW,
} from "./SampleStatusBadge";
import type { SampleStatus } from "./SampleStatusBadge";

/**
 * Mock data provider for Storybook
 * Simulates PATCH updates with artificial delay
 */
const mockDataProvider: DataProvider = {
  ...defaultDataProvider,
  update: async (resource, params) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    action(`[Mock] PATCH ${resource}/${params.id}`)({ data: params.data });
    return { data: { id: params.id, ...params.data } };
  },
};

const meta: Meta<typeof SampleStatusBadge> = {
  title: "Atomic CRM/Components/SampleStatusBadge",
  component: SampleStatusBadge,
  decorators: [
    (Story) => (
      <AdminContext dataProvider={mockDataProvider}>
        <div className="p-8 bg-background">
          <Story />
        </div>
      </AdminContext>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## SampleStatusBadge

Displays the current status of a sample activity with visual workflow progression.
Supports inline status updates via PATCH when in interactive mode.

### Workflow
\`Sent → Received → Feedback Pending → Feedback Received\`

### Badge Color Mapping (P8 Design)
- **sent**: muted/secondary - Initial state
- **received**: success/green - Confirmed receipt
- **feedback_pending**: warning/amber - Awaiting feedback
- **feedback_received**: primary/lime - Complete

### Usage
\`\`\`tsx
// Read-only badge
<SampleStatusBadge status="received" />

// Interactive with stepper
<SampleStatusBadge
  status="received"
  activityId={123}
  interactive
  showStepper
/>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: SAMPLE_STATUS_WORKFLOW,
      description: "Current sample workflow status",
    },
    interactive: {
      control: "boolean",
      description: "Enable click-to-edit popover",
    },
    showStepper: {
      control: "boolean",
      description: "Show workflow stepper in popover",
    },
    compact: {
      control: "boolean",
      description: "Compact mode without icon",
    },
    activityId: {
      control: "number",
      description: "Activity ID for PATCH updates",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SampleStatusBadge>;

// ============================================
// Badge Variants (Read-Only)
// ============================================

export const Sent: Story = {
  args: {
    status: "sent",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Initial state - sample has been dispatched to customer. Uses muted/secondary styling.",
      },
    },
  },
};

export const Received: Story = {
  args: {
    status: "received",
  },
  parameters: {
    docs: {
      description: {
        story: "Customer confirmed receipt. Uses success/green styling.",
      },
    },
  },
};

export const FeedbackPending: Story = {
  args: {
    status: "feedback_pending",
  },
  parameters: {
    docs: {
      description: {
        story: "Awaiting customer feedback. Uses warning/amber styling.",
      },
    },
  },
};

export const FeedbackReceived: Story = {
  args: {
    status: "feedback_received",
  },
  parameters: {
    docs: {
      description: {
        story: "Workflow complete with feedback collected. Uses primary/lime styling.",
      },
    },
  },
};

// ============================================
// All Statuses Comparison
// ============================================

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      {SAMPLE_STATUS_WORKFLOW.map((status) => (
        <SampleStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All four workflow statuses side-by-side for visual comparison.",
      },
    },
  },
};

// ============================================
// Compact Mode
// ============================================

export const CompactMode: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 items-center">
      {SAMPLE_STATUS_WORKFLOW.map((status) => (
        <SampleStatusBadge key={status} status={status} compact />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Compact badges without icons, using short labels. Ideal for tables.",
      },
    },
  },
};

// ============================================
// Interactive Mode
// ============================================

export const Interactive: Story = {
  args: {
    status: "received",
    activityId: 123,
    interactive: true,
    showStepper: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive badge with click-to-edit popover. Click the badge to see the workflow stepper and status controls.",
      },
    },
  },
};

export const InteractiveAtStart: Story = {
  args: {
    status: "sent",
    activityId: 456,
    interactive: true,
    showStepper: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive mode at the beginning of workflow. All forward statuses are selectable.",
      },
    },
  },
};

export const InteractiveAtEnd: Story = {
  args: {
    status: "feedback_received",
    activityId: 789,
    interactive: true,
    showStepper: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive mode at workflow completion. Shows 'Workflow Complete' indicator.",
      },
    },
  },
};

// ============================================
// Stepper Component
// ============================================

export const StepperOnly: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-32">Sent:</span>
        <SampleStatusStepper status="sent" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-32">Received:</span>
        <SampleStatusStepper status="received" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-32">Pending:</span>
        <SampleStatusStepper status="feedback_pending" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-32">Complete:</span>
        <SampleStatusStepper status="feedback_received" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Compact inline stepper showing workflow progression. Useful for list views.",
      },
    },
  },
};

// ============================================
// In Context: Activity List Row
// ============================================

interface MockActivity {
  id: number;
  subject: string;
  sample_status: SampleStatus;
  activity_date: string;
  contact_name: string;
}

const mockActivities: MockActivity[] = [
  {
    id: 1,
    subject: "McCRUM Sweet Potato Sample",
    sample_status: "sent",
    activity_date: "2024-01-15",
    contact_name: "John Smith",
  },
  {
    id: 2,
    subject: "Rapid Rasoi Naan Bread",
    sample_status: "received",
    activity_date: "2024-01-14",
    contact_name: "Jane Doe",
  },
  {
    id: 3,
    subject: "Farm Fresh Vegetables Mix",
    sample_status: "feedback_pending",
    activity_date: "2024-01-10",
    contact_name: "Bob Wilson",
  },
  {
    id: 4,
    subject: "Premium Cheese Selection",
    sample_status: "feedback_received",
    activity_date: "2024-01-05",
    contact_name: "Alice Johnson",
  },
];

export const InActivityList: Story = {
  render: () => (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-3 font-medium">Subject</th>
            <th className="text-left p-3 font-medium">Contact</th>
            <th className="text-left p-3 font-medium">Date</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-left p-3 font-medium">Progress</th>
          </tr>
        </thead>
        <tbody>
          {mockActivities.map((activity) => (
            <tr key={activity.id} className="border-t hover:bg-muted/50">
              <td className="p-3">{activity.subject}</td>
              <td className="p-3 text-muted-foreground">{activity.contact_name}</td>
              <td className="p-3 text-muted-foreground">{activity.activity_date}</td>
              <td className="p-3">
                <SampleStatusBadge
                  status={activity.sample_status}
                  activityId={activity.id}
                  interactive
                  compact
                />
              </td>
              <td className="p-3">
                <SampleStatusStepper status={activity.sample_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "Sample status badges integrated into an activity list table. Shows compact badges with inline steppers.",
      },
    },
  },
};

// ============================================
// With Callback Handler
// ============================================

export const WithCallback: Story = {
  args: {
    status: "received",
    activityId: 999,
    interactive: true,
    showStepper: true,
    onStatusChange: action("onStatusChange"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive badge with onStatusChange callback. Logs status changes to Storybook Actions panel.",
      },
    },
  },
};
