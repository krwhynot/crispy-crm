import { useRef, useCallback } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Tutorial steps for the Product Create form.
 * Guides users through all 3 tabs and highlights required fields.
 */
const FORM_TUTORIAL_STEPS: DriveStep[] = [
  {
    popover: {
      title: "📦 Create a Product",
      description:
        "Let's add a new product. Required fields are marked with *. We'll go through each tab.",
    },
  },
  {
    element: '[data-tutorial="product-tab-general"]',
    popover: {
      title: "General Information",
      description: "This tab contains basic product details. Let's start here.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="product-name"]',
    popover: {
      title: "Product Name *",
      description: "Enter the product name. This is how it will appear in searches and reports.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="product-sku"]',
    popover: {
      title: "SKU (Optional)",
      description: "Add a Stock Keeping Unit code if you have one. Useful for inventory tracking.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="product-tab-relationships"]',
    popover: {
      title: "Relationships",
      description: "Click this tab to link the product to organizations.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="product-principal"]',
    popover: {
      title: "Principal/Supplier *",
      description: "Select which principal manufactures this product. Start typing to search.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="product-tab-classification"]',
    popover: {
      title: "Classification",
      description: "Click this tab to categorize the product.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="product-category"]',
    popover: {
      title: "Category *",
      description: "Choose an F&B category or type to create a custom one.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="product-status"]',
    popover: {
      title: "Status",
      description: "Set product availability: Active, Coming Soon, or Discontinued.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="product-save-btn"]',
    popover: {
      title: "Create Product",
      description: "Click to save the product. You'll be taken to the product detail page.",
      side: "top",
      align: "end",
    },
  },
  {
    popover: {
      title: "✅ Ready to Go!",
      description:
        "You now know how to create a product. Fill in the required fields across all tabs and click Create Product.",
    },
  },
];

/**
 * Standalone tutorial component for the Product Create form.
 * Displays a floating help button that triggers a Driver.js tutorial
 * walking users through all form tabs and fields.
 *
 * Only renders on the /products/create page (where ProductCreate mounts this).
 */
export function ProductFormTutorial() {
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
          <Button
            variant="default"
            size="icon"
            onClick={startTutorial}
            className="h-11 w-11 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform"
            aria-label="Start product form tutorial"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Learn how to create a product</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
