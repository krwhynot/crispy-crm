// Admin module exports
// DEPRECATED: User management consolidated into /sales resource
// The admin/users directory is scheduled for removal

// HealthDashboard is the only remaining admin-specific component
// It's lazy-loaded directly in CRM.tsx

// Legacy exports removed - use /sales resource instead:
// - UserList → /sales
// - UserSlideOver → /sales?view=:id
// - UserInviteForm → /sales/create
// - RoleBadgeField, StatusField → exported from sales validation
