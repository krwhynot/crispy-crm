/**
 * Types for the decomposed data provider services
 */

export type DataProviderMethod =
  | "getList"
  | "getOne"
  | "create"
  | "update"
  | "delete"
  | "deleteMany"
  | "getMany"
  | "getManyReference"
  | "updateMany";

export interface LogContext {
  method: string;
  resource: string;
  params?: Record<string, unknown>;
  timestamp: string;
}

export interface ErrorLogContext extends LogContext {
  error: {
    message: string;
    stack?: string;
  };
}
