# Global Search Bar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add unified global search bar in top navigation for cross-module search

**Architecture:** Extend existing module-level search (100% complete) to create global search bar with unified results page. Reuse React Admin search infrastructure.

**Tech Stack:** React Admin useList, AppBar, Autocomplete component
**Effort:** 2 days | **Priority:** HIGH | **Status:** Module search works, global missing

---

## Implementation Steps

### Step 1-3: Create Global Search Component (4 hours)

**File:** `src/atomic-crm/layout/GlobalSearch.tsx`

```typescript
import { useState } from 'react'
import { Autocomplete, TextField, Box, Chip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useDataProvider } from 'react-admin'
import SearchIcon from '@mui/icons-material/Search'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const navigate = useNavigate()
  const dataProvider = useDataProvider()

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) return

    // Search across multiple resources
    const searches = await Promise.all([
      dataProvider.getList('contacts', {
        filter: { q: searchQuery },
        pagination: { page: 1, perPage: 5 },
      }),
      dataProvider.getList('organizations', {
        filter: { q: searchQuery },
        pagination: { page: 1, perPage: 5 },
      }),
      dataProvider.getList('opportunities', {
        filter: { q: searchQuery },
        pagination: { page: 1, perPage: 5 },
      }),
    ])

    const combined = [
      ...searches[0].data.map(r => ({ ...r, _type: 'contacts' })),
      ...searches[1].data.map(r => ({ ...r, _type: 'organizations' })),
      ...searches[2].data.map(r => ({ ...r, _type: 'opportunities' })),
    ]

    setResults(combined)
  }

  return (
    <Autocomplete
      options={results}
      getOptionLabel={(option) => option.name}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Chip label={option._type} size="small" sx={{ mr: 1 }} />
          {option.name}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search everywhere..."
          InputProps={{
            ...params.InputProps,
            startAdornment: <SearchIcon />,
          }}
        />
      )}
      onInputChange={(_, value) => {
        setQuery(value)
        handleSearch(value)
      }}
      onChange={(_, value) => {
        if (value) navigate(`/${value._type}/${value.id}/show`)
      }}
      sx={{ minWidth: 300 }}
    />
  )
}
```

### Step 4: Add to AppBar

**File:** `src/atomic-crm/layout/AppBar.tsx`

```typescript
import { GlobalSearch } from './GlobalSearch'

// In AppBar render, add:
<Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
  <GlobalSearch />
</Box>
```

### Step 5-7: Create Unified Results Page (4 hours)

**File:** `src/atomic-crm/search/SearchResultsPage.tsx`

```typescript
import { useSearchParams } from 'react-router-dom'
import { List, Datagrid, TextField } from 'react-admin'

export function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')

  return (
    <>
      <Typography variant="h4">Search Results for "{query}"</Typography>
      
      <Typography variant="h6" sx={{ mt: 3 }}>Contacts</Typography>
      <List resource="contacts" filter={{ q: query }} perPage={10}>
        <Datagrid>
          <TextField source="name" />
          <TextField source="email" />
        </Datagrid>
      </List>

      <Typography variant="h6" sx={{ mt: 3 }}>Organizations</Typography>
      <List resource="organizations" filter={{ q: query }} perPage={10}>
        <Datagrid>
          <TextField source="name" />
          <TextField source="segment" />
        </Datagrid>
      </List>

      <Typography variant="h6" sx={{ mt: 3 }}>Opportunities</Typography>
      <List resource="opportunities" filter={{ q: query }} perPage={10}>
        <Datagrid>
          <TextField source="name" />
          <TextField source="stage" />
        </Datagrid>
      </List>
    </>
  )
}
```

### Step 8: Add Search History (localStorage)

```typescript
// In GlobalSearch.tsx
const [history, setHistory] = useState<string[]>(() => {
  return JSON.parse(localStorage.getItem('searchHistory') || '[]')
})

const saveToHistory = (query: string) => {
  const updated = [query, ...history.filter(h => h !== query)].slice(0, 10)
  setHistory(updated)
  localStorage.setItem('searchHistory', JSON.stringify(updated))
}
```

### Step 9-10: Testing & Commit

```bash
npm run dev
# Test: Type in search, verify results dropdown
# Test: Click result, verify navigation
# Test: View search history

git add src/atomic-crm/layout/GlobalSearch.tsx
git add src/atomic-crm/search/SearchResultsPage.tsx
git commit -m "feat: add global search bar with unified results

- Create GlobalSearch autocomplete component
- Search across contacts, organizations, opportunities
- Add to AppBar for always-visible access
- Create unified results page
- Save last 10 searches to localStorage

PRD Requirement: 11-search-filtering.md (global search)

🤖 Generated with Claude Code"
```

---

**Plan Status:** ✅ Ready | **Time:** 2 days | **Impact:** HIGH (Better UX)
