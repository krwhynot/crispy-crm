/**
 * Tier 2 re-export of shadcn Accordion primitives.
 *
 * Use AccordionSection for simple single-item accordions (e.g., FilterChipsPanel).
 * Use these primitives for complex nested accordions (e.g., CampaignGroupedList).
 *
 * This maintains the Three-Tier Architecture by ensuring feature modules
 * import from Tier 2 (@/components/ra-wrappers/) rather than Tier 1 (@/components/ui/).
 */
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
