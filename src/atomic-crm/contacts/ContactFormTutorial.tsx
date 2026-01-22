import { useRef, useCallback } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Tutorial steps for the Contact Create form.
 * Highlights required fields and guides users through form completion.
 */
const FORM_TUTORIAL_STEPS: DriveStep[] = [
  {
    popover: {
      title: "📝 Create a Contact",
      description: "Let's walk through adding a new contact. Fields marked with * are required.",
    },
  },
  {
    element: '[data-tutorial="contact-first-name"]',
    popover: {
      title: "First Name *",
      description: "Enter the contact's first name. This field is required for all contacts.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="contact-last-name"]',
    popover: {
      title: "Last Name *",
      description:
        "Enter the contact's last name. Together with first name, this identifies the person.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="contact-organization"]',
    popover: {
      title: "Organization *",
      description:
        "Select which organization this contact belongs to. Start typing to search existing organizations.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="contact-account-manager"]',
    popover: {
      title: "Account Manager *",
      description:
        "Choose who will own this contact. This determines who sees it in their pipeline.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="contact-email"]',
    popover: {
      title: "Email Address *",
      description:
        "Add at least one email address. You can add multiple with different types (Work, Home, Other). Pro tip: paste an email to auto-fill names!",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="contact-phone"]',
    popover: {
      title: "Phone Numbers",
      description:
        "Optional: Add phone numbers with different types. You can add multiple phone numbers.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="contact-save-btn"]',
    popover: {
      title: "Save Your Contact",
      description:
        'Click "Save & Close" to create the contact, or "Save & Add Another" to continue adding more contacts.',
      side: "top",
      align: "end",
    },
  },
  {
    popover: {
      title: "✅ Ready to Go!",
      description:
        "You now know how to create a contact. Fill in the required fields and click Save when you're ready.",
    },
  },
];

/**
 * Standalone tutorial component for the Contact Create form.
 * Displays a floating help button that triggers a Driver.js tutorial
 * walking users through all form fields.
 *
 * Only renders on the /contacts/create page (where ContactCreate mounts this).
 */
export function ContactFormTutorial() {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const startTutorial = useCallback(() => {
    // Clean up any existing instance
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    // Create new Driver.js instance
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      overlayOpacity: 0.75,
      popoverClass: "tutorial-popover",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done ✓",
      steps: FORM_TUTORIAL_STEPS,
      onDestroyStarted: () => {
        // Cleanup on close
        driverRef.current?.destroy();
        driverRef.current = null;
      },
    });

    driverRef.current.drive();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <AdminButton
            variant="default"
            size="icon"
            onClick={startTutorial}
            className="h-11 w-11 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform"
            aria-label="Start contact form tutorial"
          >
            <HelpCircle className="h-5 w-5" />
          </AdminButton>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Learn how to add a contact</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
