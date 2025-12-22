export interface FilterElementProps {
  alwaysOn?: boolean;
  context?: string;

  defaultValue?: unknown;
  resource?: string;
  record?: object;
  source: string;

  [key: string]: unknown;
}
