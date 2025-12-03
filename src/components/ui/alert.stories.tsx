import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Terminal, X } from "lucide-react";

const meta = {
  title: "UI/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
      description: "The visual style variant of the alert",
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic alerts
export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert>
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>You can add components to your app using the cli.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const Destructive: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
      </Alert>
    </div>
  ),
};

// With icons
export const WithInfoIcon: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert>
        <Info />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>This is an informational alert to keep you updated.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const WithSuccessIcon: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert className="border-success/30 text-success [&>svg]:text-success">
        <CheckCircle2 />
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>Your changes have been saved successfully.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const WithWarningIcon: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert className="border-warning/30 text-warning [&>svg]:text-warning">
        <AlertTriangle />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Your subscription will expire in 3 days. Please renew to avoid interruption.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const WithErrorIcon: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          There was a problem processing your request. Please try again.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// Different content types
export const TitleOnly: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert>
        <Terminal />
        <AlertTitle>Command executed successfully</AlertTitle>
      </Alert>
    </div>
  ),
};

export const DescriptionOnly: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert>
        <AlertDescription>This is a simple notification without a title.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert>
        <Info />
        <AlertTitle>System Maintenance Notice</AlertTitle>
        <AlertDescription>
          Our systems will undergo scheduled maintenance on Sunday, March 15th from 2:00 AM to 6:00
          AM EST. During this time, you may experience intermittent service disruptions. We
          apologize for any inconvenience and appreciate your patience.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// With actions
export const WithButton: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert>
        <Info />
        <AlertTitle>Update Available</AlertTitle>
        <AlertDescription>
          A new version of the application is available.
          <button className="mt-2 px-3 py-1 text-sm bg-primary text-primary-foreground rounded">
            Update Now
          </button>
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const WithLink: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert>
        <AlertTitle>Documentation</AlertTitle>
        <AlertDescription>
          Learn more about this feature in our{" "}
          <button className="underline font-medium">documentation</button>.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

const DismissibleAlertComponent = () => {
  const [visible, setVisible] = React.useState(true);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        Show Alert
      </button>
    );
  }

  return (
    <div className="w-[400px]">
      <Alert>
        <Info />
        <AlertTitle>Dismissible Alert</AlertTitle>
        <AlertDescription>
          This alert can be dismissed by clicking the close button.
        </AlertDescription>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-2 top-2 p-1 rounded hover:bg-accent"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
};

export const Dismissible: Story = {
  render: () => <DismissibleAlertComponent />,
};

// List in description
export const WithList: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Form Validation Errors</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Email address is required</li>
            <li>Password must be at least 8 characters</li>
            <li>Please accept the terms and conditions</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// Multiple alerts
export const MultipleAlerts: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <Alert className="border-primary/30 text-primary [&>svg]:text-primary">
        <Info />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>This is an informational message.</AlertDescription>
      </Alert>
      <Alert className="border-success/30 text-success [&>svg]:text-success">
        <CheckCircle2 />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Operation completed successfully.</AlertDescription>
      </Alert>
      <Alert className="border-warning/30 text-warning [&>svg]:text-warning">
        <AlertTriangle />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Please review before proceeding.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    </div>
  ),
};

// Code block in alert
export const WithCodeBlock: Story = {
  render: () => (
    <div className="w-[500px]">
      <Alert>
        <Terminal />
        <AlertTitle>Installation</AlertTitle>
        <AlertDescription>
          Run the following command to install:
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
            <code>npm install @radix-ui/react-alert-dialog</code>
          </pre>
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// Progress alert
export const WithProgress: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert>
        <AlertTitle>Processing...</AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading files</span>
              <span>75%</span>
            </div>
            <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-primary transition-all" />
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// Accessibility
export const WithAriaLive: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert role="alert" aria-live="polite">
        <Info />
        <AlertTitle>Live Update</AlertTitle>
        <AlertDescription>
          This alert will be announced by screen readers when it appears.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const UrgentAlert: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert variant="destructive" role="alert" aria-live="assertive">
        <AlertCircle />
        <AlertTitle>Critical Error</AlertTitle>
        <AlertDescription>
          Immediate action required. This urgent alert will interrupt screen readers.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// Custom styling
export const CustomStyled: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <Alert className="bg-gradient-to-r from-accent/20 to-accent/10 border-accent/30">
        <AlertTitle className="text-accent-foreground">Special Offer</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Get 20% off your first purchase with code WELCOME20
        </AlertDescription>
      </Alert>
      <Alert className="bg-primary text-primary-foreground border-primary">
        <Terminal className="text-success" />
        <AlertTitle>Terminal Output</AlertTitle>
        <AlertDescription className="font-mono text-sm">
          Process completed with exit code 0
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// Status examples
export const StatusExamples: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <Alert>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
          <AlertTitle>System Status: Online</AlertTitle>
        </div>
        <AlertDescription>All systems are operational.</AlertDescription>
      </Alert>
      <Alert className="border-warning/30">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-warning rounded-full animate-pulse" />
          <AlertTitle>System Status: Degraded</AlertTitle>
        </div>
        <AlertDescription>Some features may be slower than usual.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-destructive-foreground rounded-full animate-pulse" />
          <AlertTitle>System Status: Offline</AlertTitle>
        </div>
        <AlertDescription>
          We're experiencing an outage. Our team is working on it.
        </AlertDescription>
      </Alert>
    </div>
  ),
};
