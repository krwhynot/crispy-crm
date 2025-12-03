import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./progress";
import React, { useEffect, useState } from "react";

const meta = {
  title: "UI/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "The progress value (0-100)",
    },
    max: {
      control: { type: "number", min: 1 },
      description: "The maximum progress value",
    },
    getValueLabel: {
      description: "Function to get the value label for screen readers",
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic states
export const Default: Story = {
  args: {
    value: 50,
  },
  render: (args) => (
    <div className="w-[300px]">
      <Progress {...args} />
    </div>
  ),
};

export const Empty: Story = {
  args: {
    value: 0,
  },
  render: (args) => (
    <div className="w-[300px]">
      <Progress {...args} />
    </div>
  ),
};

export const Complete: Story = {
  args: {
    value: 100,
  },
  render: (args) => (
    <div className="w-[300px]">
      <Progress {...args} />
    </div>
  ),
};

// Various progress values
export const TwentyFivePercent: Story = {
  args: {
    value: 25,
  },
  render: (args) => (
    <div className="w-[300px]">
      <Progress {...args} />
    </div>
  ),
};

export const FiftyPercent: Story = {
  args: {
    value: 50,
  },
  render: (args) => (
    <div className="w-[300px]">
      <Progress {...args} />
    </div>
  ),
};

export const SeventyFivePercent: Story = {
  args: {
    value: 75,
  },
  render: (args) => (
    <div className="w-[300px]">
      <Progress {...args} />
    </div>
  ),
};

// Animated progress
export const Animated: Story = {
  render: () => {
    const AnimatedProgress = () => {
      const [progress, setProgress] = useState(0);

      useEffect(() => {
        const timer = setInterval(() => {
          setProgress((oldProgress) => {
            const newProgress = oldProgress + 1;
            if (newProgress === 100) {
              clearInterval(timer);
            }
            return newProgress;
          });
        }, 50);

        return () => {
          clearInterval(timer);
        };
      }, []);

      return (
        <div className="w-[300px] space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">{progress}%</p>
        </div>
      );
    };
    return <AnimatedProgress />;
  },
};

// Loop animation
export const LoopAnimation: Story = {
  render: () => {
    const LoopProgress = () => {
      const [progress, setProgress] = useState(0);

      useEffect(() => {
        const timer = setInterval(() => {
          setProgress((oldProgress) => {
            if (oldProgress === 100) {
              return 0;
            }
            return oldProgress + 2;
          });
        }, 50);

        return () => {
          clearInterval(timer);
        };
      }, []);

      return (
        <div className="w-[300px] space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">Loading... {progress}%</p>
        </div>
      );
    };
    return <LoopProgress />;
  },
};

// With label
export const WithLabel: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <div className="flex justify-between text-sm">
        <span>Uploading file...</span>
        <span>60%</span>
      </div>
      <Progress value={60} />
    </div>
  ),
};

// File upload example
export const FileUpload: Story = {
  render: () => {
    const FileUploadProgress = () => {
      const [progress, setProgress] = useState(0);
      const [status, setStatus] = useState("Preparing...");

      useEffect(() => {
        const timer = setInterval(() => {
          setProgress((oldProgress) => {
            const newProgress = Math.min(oldProgress + Math.random() * 10, 100);

            if (newProgress < 30) {
              setStatus("Connecting...");
            } else if (newProgress < 60) {
              setStatus("Uploading...");
            } else if (newProgress < 90) {
              setStatus("Processing...");
            } else if (newProgress < 100) {
              setStatus("Finalizing...");
            } else {
              setStatus("Complete!");
              clearInterval(timer);
            }

            return newProgress;
          });
        }, 500);

        return () => {
          clearInterval(timer);
        };
      }, []);

      return (
        <div className="w-[300px] space-y-2">
          <div className="flex justify-between text-sm">
            <span>{status}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">document.pdf (2.4 MB)</p>
        </div>
      );
    };
    return <FileUploadProgress />;
  },
};

// Multiple progress bars
export const MultipleProgress: Story = {
  render: () => (
    <div className="w-[300px] space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>CPU Usage</span>
          <span>45%</span>
        </div>
        <Progress value={45} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Memory</span>
          <span>72%</span>
        </div>
        <Progress value={72} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Storage</span>
          <span>89%</span>
        </div>
        <Progress value={89} />
      </div>
    </div>
  ),
};

// Different sizes
export const Small: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <p className="text-sm text-muted-foreground">Small (h-1)</p>
      <Progress value={60} className="h-1" />
    </div>
  ),
};

export const Medium: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <p className="text-sm text-muted-foreground">Medium (default h-2)</p>
      <Progress value={60} />
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <p className="text-sm text-muted-foreground">Large (h-4)</p>
      <Progress value={60} className="h-4" />
    </div>
  ),
};

// Custom colors (using semantic CSS variables)
export const CustomColor: Story = {
  render: () => (
    <div className="w-[300px] space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Success</p>
        <Progress value={75} className="[&>div]:bg-success" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Warning</p>
        <Progress value={50} className="[&>div]:bg-warning" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Error</p>
        <Progress value={25} className="[&>div]:bg-destructive" />
      </div>
    </div>
  ),
};

// Indeterminate state (simulated with animation)
export const Indeterminate: Story = {
  render: () => {
    const IndeterminateProgress = () => {
      const [position, setPosition] = useState(0);

      useEffect(() => {
        const timer = setInterval(() => {
          setPosition((oldPosition) => (oldPosition + 1) % 100);
        }, 20);

        return () => {
          clearInterval(timer);
        };
      }, []);

      return (
        <div className="w-[300px] space-y-2">
          <p className="text-sm text-muted-foreground">Loading...</p>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full w-1/3 bg-primary rounded-full absolute transition-transform duration-300"
              style={{ transform: `translateX(${position * 3}%)` }}
            />
          </div>
        </div>
      );
    };
    return <IndeterminateProgress />;
  },
};

// Accessibility
export const WithAriaLabel: Story = {
  args: {
    value: 66,
    "aria-label": "Loading progress",
  },
  render: (args) => (
    <div className="w-[300px]">
      <Progress {...args} />
    </div>
  ),
};

export const WithAriaValueText: Story = {
  args: {
    value: 33,
    "aria-valuetext": "33 percent complete",
  },
  render: (args) => (
    <div className="w-[300px] space-y-2">
      <Progress {...args} />
      <p className="text-sm text-muted-foreground">
        Screen readers will announce: "33 percent complete"
      </p>
    </div>
  ),
};

// Steps progress
export const StepsProgress: Story = {
  render: () => {
    const steps = [
      { name: "Account", complete: true },
      { name: "Profile", complete: true },
      { name: "Settings", complete: false },
      { name: "Review", complete: false },
    ];

    const completedSteps = steps.filter((s) => s.complete).length;
    const progress = (completedSteps / steps.length) * 100;

    return (
      <div className="w-[400px] space-y-4">
        <div className="flex justify-between text-sm">
          {steps.map((step, index) => (
            <span key={index} className={step.complete ? "text-primary" : "text-muted-foreground"}>
              {step.name}
            </span>
          ))}
        </div>
        <Progress value={progress} />
        <p className="text-sm text-center text-muted-foreground">
          Step {completedSteps} of {steps.length}
        </p>
      </div>
    );
  },
};
