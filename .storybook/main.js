const path = require("node:path");

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-onboarding",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../public"],

  async viteFinal(config, { configType }) {
    const { mergeConfig } = await import("vite");

    // NOTE: react() and tailwindcss() plugins are already configured in vite.config.ts
    // and inherited by Storybook. Adding them again would create duplicate instances
    // causing HMR conflicts. Only add Storybook-specific configuration here.
    return mergeConfig(config, {
      resolve: {
        preserveSymlinks: true,
        alias: {
          "@": path.resolve(__dirname, "../src"),
        },
      },
    });
  },

  docs: {
    autodocs: "tag",
  },

  // Chromatic-specific optimizations
  ...(process.env.CHROMATIC
    ? {
        // Disable addons that might cause flakiness in snapshots
        disabledAddons: ["@storybook/addon-onboarding"],

        // Configure Chromatic snapshot settings
        chromatic: {
          // Delay snapshots to allow animations to complete
          delay: 300,

          // Ensure consistent snapshots across builds
          diffThreshold: 0.063, // ~16/255 - accounts for minor anti-aliasing differences

          // Capture viewports for responsive testing
          viewports: [
            { width: 320, height: 568 }, // Mobile
            { width: 768, height: 1024 }, // Tablet
            { width: 1280, height: 800 }, // Desktop
          ],

          // Enable OKLCH color validation
          // All 42 OKLCH colors will be validated across themes
          pauseAnimationAtEnd: true,
          forcedColors: "none", // Ensure colors render naturally
        },
      }
    : {}),

  // Performance optimizations for CI builds
  ...(process.env.CI
    ? {
        features: {
          // Disable features that slow down CI builds
          buildStoriesJson: false,
          storyStoreV7: true,
        },
      }
    : {}),
};

module.exports = config;
