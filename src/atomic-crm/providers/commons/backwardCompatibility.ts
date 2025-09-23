import type {
  DataProvider,
  GetListParams,
  CreateParams,
  UpdateParams,
  DeleteParams,
  DeleteManyParams,
  GetOneParams,
  Identifier,
  RaRecord
} from "ra-core";
import type { Deal, Opportunity } from "../../types";

// Grace period configuration (1 month from deployment)
const GRACE_PERIOD_DAYS = 30;
const DEPLOYMENT_DATE = new Date('2025-01-22'); // Adjust this to actual deployment date
const GRACE_PERIOD_END = new Date(DEPLOYMENT_DATE.getTime() + (GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000));

// Logger for deprecated endpoint usage
interface DeprecationLog {
  endpoint: string;
  method: string;
  timestamp: string;
  userAgent?: string;
  stackTrace?: string;
}

const deprecationLogs: DeprecationLog[] = [];

/**
 * Log usage of deprecated endpoints for analytics and monitoring
 */
function logDeprecatedUsage(endpoint: string, method: string, stackTrace?: string): void {
  const log: DeprecationLog = {
    endpoint,
    method,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    stackTrace,
  };

  deprecationLogs.push(log);

  // Keep only last 1000 logs to prevent memory issues
  if (deprecationLogs.length > 1000) {
    deprecationLogs.shift();
  }

  // Send to analytics endpoint if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'deprecated_api_usage', {
      custom_parameter_endpoint: endpoint,
      custom_parameter_method: method,
    });
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.warn(
      `🚨 DEPRECATED API USAGE: ${method} ${endpoint}\n` +
      `This endpoint will be removed on ${GRACE_PERIOD_END.toDateString()}.\n` +
      `Please migrate to the new 'opportunities' endpoint.\n` +
      `Stack trace: ${stackTrace || 'Not available'}`
    );
  }
}

/**
 * Show deprecation warning in development mode
 */
function showDeprecationWarning(resource: string, method: string): void {
  if (import.meta.env.DEV) {
    const daysRemaining = Math.max(0, Math.ceil((GRACE_PERIOD_END.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

    console.group(`🚨 DEPRECATED: ${resource} endpoint`);
    console.warn(`Method: ${method}`);
    console.warn(`Grace period ends: ${GRACE_PERIOD_END.toDateString()}`);
    console.warn(`Days remaining: ${daysRemaining}`);
    console.warn(`Migration: Replace '${resource}' with 'opportunities'`);
    console.warn(`Documentation: See migration guide at /docs/migration-guide.md`);
    console.groupEnd();
  }
}

/**
 * Check if we're still within the grace period
 */
function isWithinGracePeriod(): boolean {
  return Date.now() < GRACE_PERIOD_END.getTime();
}

/**
 * Transform Opportunity to Deal format for backward compatibility
 */
export function transformOpportunityToDeal(opportunity: Opportunity): Deal {
  return {
    id: opportunity.id,
    name: opportunity.name,
    company_id: opportunity.customer_organization_id || opportunity.company_id!,
    contact_ids: opportunity.contact_ids || [],
    category: opportunity.category,
    stage: opportunity.stage,
    description: opportunity.description || '',
    amount: opportunity.amount || 0,
    created_at: opportunity.created_at,
    updated_at: opportunity.updated_at,
    archived_at: opportunity.deleted_at || opportunity.archived_at,
    expected_closing_date: opportunity.estimated_close_date || opportunity.expected_closing_date,
    sales_id: opportunity.sales_id,
    index: opportunity.index || 0,
  };
}

/**
 * Transform Deal to Opportunity format for forward compatibility
 */
export function transformDealToOpportunity(deal: Deal): Opportunity {
  return {
    id: deal.id,
    name: deal.name,
    customer_organization_id: deal.company_id,
    company_id: deal.company_id, // backward compatibility
    contact_ids: deal.contact_ids || [],
    category: deal.category,
    stage: deal.stage as Opportunity['stage'] || 'lead',
    status: 'active' as Opportunity['status'],
    priority: 'medium' as Opportunity['priority'],
    description: deal.description || '',
    amount: deal.amount || 0,
    probability: getDefaultProbabilityForStage(deal.stage),
    estimated_close_date: deal.expected_closing_date,
    expected_closing_date: deal.expected_closing_date, // backward compatibility
    created_at: deal.created_at,
    updated_at: deal.updated_at,
    deleted_at: deal.archived_at,
    archived_at: deal.archived_at, // backward compatibility
    sales_id: deal.sales_id,
    index: deal.index || 0,
    stage_manual: false,
    status_manual: false,
  };
}

/**
 * Get default probability based on opportunity stage
 */
function getDefaultProbabilityForStage(stage: string): number {
  switch (stage) {
    case 'lead': return 10;
    case 'qualified': return 25;
    case 'needs_analysis': return 40;
    case 'proposal': return 60;
    case 'negotiation': return 80;
    case 'closed_won': return 100;
    case 'closed_lost': return 0;
    case 'nurturing': return 15;
    default: return 0;
  }
}

/**
 * URL redirect handler for /deals/* to /opportunities/*
 */
export function handleDealUrlRedirect(): void {
  if (typeof window !== 'undefined' && window.location.pathname.includes('/deals')) {
    const newPath = window.location.pathname.replace('/deals', '/opportunities');
    const newUrl = window.location.origin + newPath + window.location.search + window.location.hash;

    logDeprecatedUsage(window.location.pathname, 'URL_REDIRECT');
    showDeprecationWarning('deals', 'URL_REDIRECT');

    // Replace the current history entry to avoid back button issues
    window.history.replaceState(null, '', newUrl);
  }
}

/**
 * Backward compatibility wrapper for data providers
 */
export function withBackwardCompatibility<T extends DataProvider>(dataProvider: T): T {
  const compatibleProvider = {
    ...dataProvider,

    async getList<RecordType extends RaRecord = any>(
      resource: string,
      params: GetListParams
    ): Promise<any> {
      if (resource === "deals") {
        if (!isWithinGracePeriod()) {
          throw new Error(
            `The 'deals' endpoint has been deprecated and is no longer available. ` +
            `Please use 'opportunities' instead. Grace period ended on ${GRACE_PERIOD_END.toDateString()}.`
          );
        }

        const stackTrace = new Error().stack;
        logDeprecatedUsage('/deals', 'getList', stackTrace);
        showDeprecationWarning('deals', 'getList');

        // Forward to opportunities endpoint
        const result = await dataProvider.getList("opportunities", params);

        // Transform opportunities back to deals format
        return {
          ...result,
          data: result.data.map((item: any) => transformOpportunityToDeal(item as Opportunity))
        };
      }

      return dataProvider.getList(resource, params);
    },

    async getOne<RecordType extends RaRecord = any>(
      resource: string,
      params: GetOneParams
    ): Promise<any> {
      if (resource === "deals") {
        if (!isWithinGracePeriod()) {
          throw new Error(
            `The 'deals' endpoint has been deprecated and is no longer available. ` +
            `Please use 'opportunities' instead. Grace period ended on ${GRACE_PERIOD_END.toDateString()}.`
          );
        }

        const stackTrace = new Error().stack;
        logDeprecatedUsage('/deals', 'getOne', stackTrace);
        showDeprecationWarning('deals', 'getOne');

        // Forward to opportunities endpoint
        const result = await dataProvider.getOne("opportunities", params);

        return {
          ...result,
          data: transformOpportunityToDeal(result.data as Opportunity)
        };
      }

      return dataProvider.getOne(resource, params);
    },

    async create<RecordType extends Omit<RaRecord, "id"> = any>(
      resource: string,
      params: CreateParams<RecordType>
    ): Promise<any> {
      if (resource === "deals") {
        if (!isWithinGracePeriod()) {
          throw new Error(
            `The 'deals' endpoint has been deprecated and is no longer available. ` +
            `Please use 'opportunities' instead. Grace period ended on ${GRACE_PERIOD_END.toDateString()}.`
          );
        }

        const stackTrace = new Error().stack;
        logDeprecatedUsage('/deals', 'create', stackTrace);
        showDeprecationWarning('deals', 'create');

        // Transform deal data to opportunity format
        const transformedParams = {
          ...params,
          data: transformDealToOpportunity(params.data as any as Deal)
        };

        const result = await dataProvider.create("opportunities", transformedParams);

        return {
          ...result,
          data: transformOpportunityToDeal(result.data as Opportunity)
        };
      }

      return dataProvider.create(resource, params);
    },

    async update<RecordType extends RaRecord = any>(
      resource: string,
      params: UpdateParams<RecordType>
    ): Promise<any> {
      if (resource === "deals") {
        if (!isWithinGracePeriod()) {
          throw new Error(
            `The 'deals' endpoint has been deprecated and is no longer available. ` +
            `Please use 'opportunities' instead. Grace period ended on ${GRACE_PERIOD_END.toDateString()}.`
          );
        }

        const stackTrace = new Error().stack;
        logDeprecatedUsage('/deals', 'update', stackTrace);
        showDeprecationWarning('deals', 'update');

        // Transform deal data to opportunity format
        const transformedParams = {
          ...params,
          data: transformDealToOpportunity(params.data as any as Deal)
        };

        const result = await dataProvider.update("opportunities", transformedParams);

        return {
          ...result,
          data: transformOpportunityToDeal(result.data as Opportunity)
        };
      }

      return dataProvider.update(resource, params);
    },

    async delete(resource: string, params: DeleteParams): Promise<any> {
      if (resource === "deals") {
        if (!isWithinGracePeriod()) {
          throw new Error(
            `The 'deals' endpoint has been deprecated and is no longer available. ` +
            `Please use 'opportunities' instead. Grace period ended on ${GRACE_PERIOD_END.toDateString()}.`
          );
        }

        const stackTrace = new Error().stack;
        logDeprecatedUsage('/deals', 'delete', stackTrace);
        showDeprecationWarning('deals', 'delete');

        return dataProvider.delete("opportunities", params);
      }

      return dataProvider.delete(resource, params);
    },

    async deleteMany(resource: string, params: DeleteManyParams): Promise<any> {
      if (resource === "deals") {
        if (!isWithinGracePeriod()) {
          throw new Error(
            `The 'deals' endpoint has been deprecated and is no longer available. ` +
            `Please use 'opportunities' instead. Grace period ended on ${GRACE_PERIOD_END.toDateString()}.`
          );
        }

        const stackTrace = new Error().stack;
        logDeprecatedUsage('/deals', 'deleteMany', stackTrace);
        showDeprecationWarning('deals', 'deleteMany');

        return dataProvider.deleteMany("opportunities", params);
      }

      return dataProvider.deleteMany(resource, params);
    },
  };

  return compatibleProvider as T;
}

/**
 * Get deprecation logs for monitoring and analytics
 */
export function getDeprecationLogs(): DeprecationLog[] {
  return [...deprecationLogs];
}

/**
 * Clear deprecation logs (useful for testing)
 */
export function clearDeprecationLogs(): void {
  deprecationLogs.length = 0;
}

/**
 * Get grace period information
 */
export function getGracePeriodInfo() {
  const now = Date.now();
  const gracePeriodEnd = GRACE_PERIOD_END.getTime();
  const daysRemaining = Math.max(0, Math.ceil((gracePeriodEnd - now) / (24 * 60 * 60 * 1000)));

  return {
    isWithinGracePeriod: now < gracePeriodEnd,
    gracePeriodEnd: GRACE_PERIOD_END.toISOString(),
    daysRemaining,
    deploymentDate: DEPLOYMENT_DATE.toISOString(),
  };
}