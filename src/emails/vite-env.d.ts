/// <reference types="vite/client" />

/**
 * Type declarations for Vite raw file imports.
 * Allows importing HTML templates as raw strings.
 */
declare module "*.html?raw" {
  const content: string;
  export default content;
}

declare module "*.html" {
  const content: string;
  export default content;
}
