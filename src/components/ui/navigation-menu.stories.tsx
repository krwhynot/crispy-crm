import type { Meta, StoryObj } from '@storybook/react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './navigation-menu';
import { navigationMenuTriggerStyle } from './navigation-menu.constants';
import React from 'react';
import { cn } from '@/lib/utils';

const meta = {
  title: 'UI/NavigationMenu',
  component: NavigationMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex min-h-[400px] min-w-[800px] items-start justify-center pt-20">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic navigation menu
export const Basic: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4">
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Introduction</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Learn the basics and get up and running quickly
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Installation</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Step-by-step guide to install and configure
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Examples</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Browse example projects and templates
                  </p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4">
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Alert Dialog</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Modal dialog for important messages
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Hover Card</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Preview content on hover
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Progress</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Display progress and loading states
                  </p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            Documentation
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

// Two-column layout
export const TwoColumnLayout: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[600px] grid-cols-2 gap-3 p-6">
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Analytics</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Real-time data insights and reporting
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Marketing</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Campaign management and automation
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Commerce</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Online store and payment processing
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Support</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Customer service and helpdesk tools
                  </p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[600px] grid-cols-2 gap-3 p-6">
              <li className="col-span-2">
                <NavigationMenuLink>
                  <div className="mb-1 text-sm font-medium">Enterprise</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Comprehensive solution for large organizations with advanced
                    security and compliance features
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Startups</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Affordable plans for growing businesses
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Agencies</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Tools for managing multiple clients
                  </p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

// With featured content
export const WithFeaturedContent: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[700px] grid-cols-[1fr_2fr] gap-6 p-6">
              <div className="rounded-lg bg-gradient-to-b from-primary/10 to-primary/5 p-6">
                <h3 className="mb-2 text-lg font-semibold">Featured</h3>
                <p className="mb-4 text-sm text-[color:var(--text-subtle)]">
                  Check out our latest guide on building scalable applications
                </p>
                <NavigationMenuLink className="text-sm font-medium text-primary hover:underline">
                  Read more →
                </NavigationMenuLink>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Blog</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Latest news and updates
                  </p>
                </NavigationMenuLink>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Guides</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    In-depth tutorials
                  </p>
                </NavigationMenuLink>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Case Studies</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Customer success stories
                  </p>
                </NavigationMenuLink>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">API Reference</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Complete API documentation
                  </p>
                </NavigationMenuLink>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

// Complex multi-level navigation
export const ComplexNavigation: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[800px] p-6">
              <div className="mb-4">
                <h3 className="mb-1 text-lg font-semibold">Build anything</h3>
                <p className="text-sm text-[color:var(--text-subtle)]">
                  Everything you need to build modern web applications
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="mb-3 text-sm font-medium text-primary">Frontend</h4>
                  <ul className="space-y-2">
                    <li>
                      <NavigationMenuLink className="text-sm">
                        React Components
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink className="text-sm">
                        Design System
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink className="text-sm">
                        Templates
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-3 text-sm font-medium text-primary">Backend</h4>
                  <ul className="space-y-2">
                    <li>
                      <NavigationMenuLink className="text-sm">
                        API Routes
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink className="text-sm">
                        Database
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink className="text-sm">
                        Authentication
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-3 text-sm font-medium text-primary">Deployment</h4>
                  <ul className="space-y-2">
                    <li>
                      <NavigationMenuLink className="text-sm">
                        Hosting
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink className="text-sm">
                        CI/CD
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink className="text-sm">
                        Monitoring
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4">
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">About Us</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Learn about our mission and team
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Careers</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Join our growing team
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Contact</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Get in touch with us
                  </p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

// Without viewport (inline dropdowns)
export const WithoutViewport: Story = {
  render: () => (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Quick Links</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-[200px] p-2">
              <li>
                <NavigationMenuLink className="text-sm">Dashboard</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink className="text-sm">Settings</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink className="text-sm">Profile</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink className="text-sm">Logout</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>More</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-[200px] p-2">
              <li>
                <NavigationMenuLink className="text-sm">Help Center</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink className="text-sm">Community</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink className="text-sm">Updates</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

// Mixed triggers and links
export const MixedNavigation: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            Home
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Features</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4">
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Core Features</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Essential functionality for all users
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Advanced Features</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Premium capabilities for power users
                  </p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4">
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Documentation</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Comprehensive guides and API reference
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink>
                  <div className="text-sm font-medium">Tutorials</div>
                  <p className="text-sm text-[color:var(--text-subtle)]">
                    Step-by-step learning resources
                  </p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            Contact
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

// Animation states demo
const AnimationStatesComponent = () => {
  const [activeItem, setActiveItem] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-secondary/10 p-3">
        <p className="text-sm font-medium">Active Item: {activeItem || 'None'}</p>
        <p className="text-xs text-[color:var(--text-subtle)]">
          Click triggers to see animation states
        </p>
      </div>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              onPointerEnter={() => setActiveItem('item-1')}
              onPointerLeave={() => setActiveItem(null)}
            >
              Hover for Animation
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[400px] p-6">
                <p className="text-sm">
                  Watch the smooth fade-in and slide animations as this content appears.
                  The viewport animates from the trigger position.
                </p>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              onPointerEnter={() => setActiveItem('item-2')}
              onPointerLeave={() => setActiveItem(null)}
            >
              Another Animation
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[400px] p-6">
                <p className="text-sm">
                  The content smoothly transitions between different menu items.
                  Notice the chevron rotation animation in the trigger.
                </p>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export const AnimationStates: Story = {
  render: () => <AnimationStatesComponent />,
};

// Responsive behavior
export const ResponsiveMenu: Story = {
  render: () => (
    <div className="w-full">
      <p className="mb-4 text-center text-sm text-[color:var(--text-subtle)]">
        This navigation menu adapts to viewport width
      </p>
      <NavigationMenu className="mx-auto">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Responsive</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-full p-6 md:w-[500px]">
                <h3 className="mb-2 text-sm font-semibold">Responsive Design</h3>
                <p className="mb-4 text-sm text-[color:var(--text-subtle)]">
                  The navigation menu adapts to different screen sizes.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded border p-2">
                    <p className="text-xs font-medium">Mobile</p>
                    <p className="text-xs text-[color:var(--text-subtle)]">Full width dropdowns</p>
                  </div>
                  <div className="rounded border p-2">
                    <p className="text-xs font-medium">Desktop</p>
                    <p className="text-xs text-[color:var(--text-subtle)]">Fixed width dropdowns</p>
                  </div>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem className="hidden sm:block">
            <NavigationMenuTrigger>Desktop Only</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[400px] p-6">
                <p className="text-sm">
                  This menu item is only visible on larger screens.
                </p>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Link
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
};

// Semantic colors showcase
export const SemanticColors: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="rounded-lg border bg-background p-6">
        <h3 className="mb-4 font-semibold">Default Theme</h3>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Default Colors</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[400px] p-6">
                  <p className="mb-3 text-sm font-medium">Semantic Variables Used:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="size-3 rounded bg-background" />
                      --background for content areas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-3 rounded bg-accent" />
                      --accent for hover states
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-3 rounded bg-popover" />
                      --popover for dropdown background
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-3 rounded border" />
                      --border for boundaries
                    </li>
                  </ul>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "text-primary")}>
                Primary Link
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="rounded-lg border bg-secondary p-6">
        <h3 className="mb-4 font-semibold text-secondary-foreground">Secondary Background</h3>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Adaptive Styling</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[400px] p-6">
                  <p className="text-sm">
                    The navigation menu adapts to different background colors
                    while maintaining proper contrast and readability.
                  </p>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="rounded-lg border border-primary bg-primary/5 p-6">
        <h3 className="mb-4 font-semibold text-primary">Primary Accent</h3>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="hover:text-primary">
                Custom Theming
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[400px] space-y-3 p-6">
                  <NavigationMenuLink className="hover:bg-primary/10">
                    <div className="text-sm font-medium text-primary">Primary Action</div>
                    <p className="text-sm text-[color:var(--text-subtle)]">
                      Using primary color for emphasis
                    </p>
                  </NavigationMenuLink>
                  <NavigationMenuLink className="hover:bg-secondary/50">
                    <div className="text-sm font-medium">Secondary Action</div>
                    <p className="text-sm text-[color:var(--text-subtle)]">
                      Using secondary color for alternatives
                    </p>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  ),
};

// Active state example
const WithActiveStatesComponent = () => {
  const [activePath, setActivePath] = React.useState('/products');

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-[color:var(--text-subtle)]">
        Current path: <code className="font-mono">{activePath}</code>
      </div>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                activePath === '/' && 'bg-accent text-accent-foreground'
              )}
              onClick={() => setActivePath('/')}
            >
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={cn(
                activePath.startsWith('/products') && 'bg-accent text-accent-foreground'
              )}
            >
              Products
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4">
                <li>
                  <NavigationMenuLink
                    onClick={() => setActivePath('/products/analytics')}
                    data-active={activePath === '/products/analytics'}
                  >
                    <div className="text-sm font-medium">Analytics</div>
                    <p className="text-sm text-[color:var(--text-subtle)]">
                      Data insights and reporting
                    </p>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink
                    onClick={() => setActivePath('/products/commerce')}
                    data-active={activePath === '/products/commerce'}
                  >
                    <div className="text-sm font-medium">Commerce</div>
                    <p className="text-sm text-[color:var(--text-subtle)]">
                      E-commerce solutions
                    </p>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                activePath === '/about' && 'bg-accent text-accent-foreground'
              )}
              onClick={() => setActivePath('/about')}
            >
              About
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export const WithActiveStates: Story = {
  render: () => <WithActiveStatesComponent />,
};