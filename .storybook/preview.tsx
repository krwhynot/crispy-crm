import type { Preview } from "@storybook/react-vite";
import React from "react";

// Import Tailwind CSS with all OKLCH semantic color variables
import "../src/index.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Configure Chromatic for automatic light/dark theme snapshots
    chromatic: {
      modes: {
        light: {
          theme: "light",
        },
        dark: {
          theme: "dark",
          globals: {
            theme: "dark",
          },
        },
      },
    },
    // Configure viewport addon for responsive testing
    viewport: {
      viewports: {
        mobile: {
          name: "Mobile",
          styles: {
            width: "375px",
            height: "667px",
          },
        },
        tablet: {
          name: "Tablet",
          styles: {
            width: "768px",
            height: "1024px",
          },
        },
        desktop: {
          name: "Desktop",
          styles: {
            width: "1440px",
            height: "900px",
          },
        },
      },
    },
  },

  // Global decorators
  decorators: [
    (Story, context) => {
      // Apply dark theme class if dark mode is active
      const isDark = context.globals.theme === "dark";

      return (
        <div
          className={isDark ? "dark" : ""}
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
            padding: "2rem",
            minHeight: "100vh",
          }}
        >
          <Story />
        </div>
      );
    },
  ],

  // Global types for theme switcher
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
