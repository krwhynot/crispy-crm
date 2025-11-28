# Architecture Documentation

## Overview

This directory contains architectural decisions, design patterns, and system design documentation for Crispy-CRM (Atomic CRM).

**PRD Reference:** See `../PRD.md` v1.18 for business context, data model, and MVP requirements.

## Contents

- **`architecture-essentials.md`** - Core architectural patterns and principles
- **`adr/`** - Architecture Decision Records (ADRs)

## Architecture Decision Records

ADRs document significant architectural decisions with their context and consequences.

### Recent Decisions

- `2025-10-17-supabase-advisor-report.md` - Supabase configuration audit

## Key Architectural Principles

1. **Single Source of Truth** - Supabase + Zod at API boundary
2. **No Over-Engineering** - Fail fast, no circuit breakers
3. **UI as Source of Truth** - Only validate fields with UI inputs
4. **Semantic Colors Only** - CSS variables, never hex codes
5. **Two-Layer Security** - GRANT permissions + RLS policies

See `architecture-essentials.md` for complete details.
