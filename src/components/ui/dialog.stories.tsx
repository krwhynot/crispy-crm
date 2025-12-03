import type { Meta, StoryObj } from "@storybook/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import React from "react";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic modal
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Dialog with form content
export const WithForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" defaultValue="@peduarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              defaultValue="pedro@example.com"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Confirmation dialog
export const Confirmation: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            Are you absolutely sure you want to delete your account? This action is permanent and
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">This will:</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Delete all your data</li>
            <li>• Cancel your subscription</li>
            <li>• Remove your profile</li>
            <li>• Delete all your content</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Yes, delete my account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Scrollable content dialog
export const ScrollableContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>View Terms</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>Please read our terms of service carefully</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[50vh] pr-2">
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using this service, you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to abide by the above, please
                do not use this service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Use License</h3>
              <p className="text-muted-foreground">
                Permission is granted to temporarily download one copy of the materials (information
                or software) on our service for personal, non-commercial transitory viewing only.
                This is the grant of a license, not a transfer of title.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Disclaimer</h3>
              <p className="text-muted-foreground">
                The materials on our service are provided on an 'as is' basis. We make no
                warranties, expressed or implied, and hereby disclaim and negate all other
                warranties including, without limitation, implied warranties or conditions of
                merchantability, fitness for a particular purpose, or non-infringement of
                intellectual property or other violation of rights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4. Limitations</h3>
              <p className="text-muted-foreground">
                In no event shall our company or its suppliers be liable for any damages (including,
                without limitation, damages for loss of data or profit, or due to business
                interruption) arising out of the use or inability to use the materials on our
                service, even if we or our authorized representative has been notified orally or in
                writing of the possibility of such damage.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">5. Privacy Policy</h3>
              <p className="text-muted-foreground">
                Your privacy is important to us. Our privacy policy explains how we collect, use,
                and protect your information when you use our service. By using our service, you
                agree to the collection and use of information in accordance with our privacy
                policy.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">6. Modifications</h3>
              <p className="text-muted-foreground">
                We may revise these terms of service at any time without notice. By using this
                service, you are agreeing to be bound by the then current version of these terms of
                service.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Decline</Button>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Simple informational dialog
export const Informational: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Show Info</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome!</DialogTitle>
          <DialogDescription>Thank you for signing up for our service.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">
            Your account has been successfully created. You can now access all features of our
            platform.
          </p>
        </div>
        <DialogFooter>
          <Button className="w-full">Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Dialog without description
export const WithoutDescription: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Quick Action</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Action</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">This is a dialog without a description in the header.</p>
        </div>
        <DialogFooter>
          <Button>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Dialog with custom trigger
export const CustomTrigger: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer p-4 border rounded-lg hover:bg-accent">
          <h3 className="font-semibold">Click this card</h3>
          <p className="text-sm text-muted-foreground">Opens a dialog when clicked</p>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom Trigger</DialogTitle>
          <DialogDescription>
            This dialog was opened by clicking a custom trigger element.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Loading state dialog
export const LoadingState: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Process Data</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Processing...</DialogTitle>
          <DialogDescription>Please wait while we process your request.</DialogDescription>
        </DialogHeader>
        <div className="py-8 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DialogContent>
    </Dialog>
  ),
};

// Success dialog
export const Success: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Show Success</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Success!</DialogTitle>
          <DialogDescription>Your action was completed successfully.</DialogDescription>
        </DialogHeader>
        <div className="py-4 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-success"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full">Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
