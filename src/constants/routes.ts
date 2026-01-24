/**
 * Centralized route path constants
 *
 * Separating path constants from components enables lazy loading
 * while maintaining DRY principle and type safety.
 */
export const ROUTES = {
  SETTINGS: "/settings",
  SET_PASSWORD: "set-password",
  FORGOT_PASSWORD: "forgot-password",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
