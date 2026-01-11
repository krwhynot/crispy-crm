# Testing Docker MCP Tools Guide

**Purpose:** Verify all Docker MCP Gateway tools are functioning correctly
**Prerequisites:** Docker Desktop running, MCP Gateway enabled
**Time Required:** 15-20 minutes for full verification

---

## Quick Health Check

Before testing individual tools, verify the gateway is operational:

```bash
# Check Docker Desktop is running
powershell.exe -NoProfile -Command "docker info" | head -5

# List enabled MCP servers
powershell.exe -NoProfile -Command "docker mcp server ls"

# Expected output:
# MCP Servers (7 enabled)
# NAME                        SECRETS
# context7                    -
# exa                         ✓ done
# github-official             ✓ done
# obsidian                    ✓ done
# perplexity-ask              ✓ done
# playwright                  -
# zen                         ◐ partial
```

---

## Server-by-Server Testing

### 1. context7 (Library Documentation)

**Purpose:** Fetches up-to-date library documentation

**Test 1: Resolve a library ID**
```
Use the resolve-library-id tool with:
  libraryName: "react-admin"
```

**Expected Result:**
- Returns a Context7-compatible library ID like `/marmelab/react-admin`
- Shows library metadata (description, trust score)

**Test 2: Get library docs**
```
Use the get-library-docs tool with:
  context7CompatibleLibraryID: "/marmelab/react-admin"
  topic: "useRecordContext"
```

**Expected Result:**
- Returns documentation about React Admin's `useRecordContext` hook
- Includes code examples and API reference

**Verification Checklist:**
- [ ] Library resolution returns valid ID
- [ ] Documentation retrieval returns content
- [ ] Topic filtering narrows results appropriately

---

### 2. playwright (Browser Automation)

**Purpose:** Automates browser interactions for testing and scraping

**Test 1: Navigate and snapshot**
```
Use browser_navigate with:
  url: "https://example.com"

Then use browser_snapshot (no parameters)
```

**Expected Result:**
- Browser opens/navigates to example.com
- Snapshot returns accessibility tree with elements like:
  - `heading "Example Domain"`
  - `link "More information..."`

**Test 2: Click an element**
```
Use browser_click with:
  element: "More information link"
  ref: "<ref from snapshot>"
```

**Expected Result:**
- Browser navigates to IANA page
- No errors returned

**Test 3: Form interaction**
```
Use browser_navigate with:
  url: "https://httpbin.org/forms/post"

Use browser_snapshot to get form elements

Use browser_fill_form with fields from snapshot
```

**Verification Checklist:**
- [ ] Navigation works
- [ ] Snapshots return readable element tree
- [ ] Click interactions succeed
- [ ] Form filling works
- [ ] Screenshots can be captured

**Cleanup:**
```
Use browser_close to end session
```

---

### 3. perplexity-ask (Web Search)

**Purpose:** AI-powered web search and research

**Test 1: Quick search**
```
Use perplexity_ask with:
  messages: [
    {"role": "user", "content": "What is the latest version of React Admin?"}
  ]
```

**Expected Result:**
- Returns current React Admin version with sources
- Includes recent release information

**Test 2: Deep research**
```
Use perplexity_research with:
  messages: [
    {"role": "user", "content": "Compare Supabase vs Firebase for React applications in 2024"}
  ]
```

**Expected Result:**
- Detailed comparison with citations
- Multiple sources referenced

**Test 3: Reasoning**
```
Use perplexity_reason with:
  messages: [
    {"role": "user", "content": "Should I use RSC or client components for a data-heavy dashboard?"}
  ]
```

**Expected Result:**
- Reasoned analysis with pros/cons
- May include `<think>` tags showing reasoning process

**Verification Checklist:**
- [ ] perplexity_ask returns results
- [ ] perplexity_research includes citations
- [ ] perplexity_reason provides analysis
- [ ] API key is working (no auth errors)

---

### 4. obsidian (Notes & Knowledge)

**Prerequisites:**
- Obsidian desktop running
- Obsidian REST API plugin enabled
- Local API running at `https://127.0.0.1:27124`

**Test 1: List vault contents**
```
Use obsidian_list_notes with:
  dirPath: "/"
  recursionDepth: 1
```

**Expected Result:**
- Returns folder structure of vault root
- Shows files and directories

**Test 2: Read a note**
```
Use obsidian_read_note with:
  filePath: "<path to any existing note>"
  format: "markdown"
```

**Expected Result:**
- Returns note content as markdown
- Includes frontmatter if present

**Test 3: Search vault**
```
Use obsidian_global_search with:
  query: "TODO"
  maxMatchesPerFile: 3
```

**Expected Result:**
- Returns files containing "TODO"
- Shows match context

**Test 4: Create/Update note**
```
Use obsidian_update_note with:
  targetType: "filePath"
  targetIdentifier: "test/mcp-test-note.md"
  content: "# MCP Test\n\nThis note was created by Docker MCP testing."
  modificationType: "wholeFile"
  wholeFileMode: "overwrite"
  createIfNeeded: true
```

**Expected Result:**
- Creates new note at specified path
- Content matches what was sent

**Verification Checklist:**
- [ ] Vault listing works
- [ ] Note reading works
- [ ] Search returns results
- [ ] Note creation/update works
- [ ] REST API connection is stable

**Cleanup:**
```
Use obsidian_delete_note with:
  filePath: "test/mcp-test-note.md"
  confirm: true
```

---

### 5. zen (Advanced Reasoning)

**Purpose:** Multi-model reasoning, debugging, and code analysis

**Test 1: List available models**
```
Use listmodels (no parameters)
```

**Expected Result:**
- Returns list of available AI models
- Shows capabilities (thinking, code-gen, context size)
- Includes models from configured providers (OpenAI, Gemini)

**Test 2: Simple chat**
```
Use chat with:
  prompt: "Explain the Strangler Fig pattern for legacy code migration in 2 sentences."
  working_directory_absolute_path: "/home/krwhynot/projects/crispy-crm"
  model: "gemini-2.5-pro"
```

**Expected Result:**
- Returns explanation from Gemini
- Response is coherent and relevant

**Test 3: Deep thinking**
```
Use thinkdeep with:
  step: "Analyzing the architecture of a React Admin + Supabase application"
  step_number: 1
  total_steps: 1
  next_step_required: false
  findings: "Initial analysis of component structure"
  model: "gemini-2.5-pro"
```

**Expected Result:**
- Returns structured analysis
- May include expert model validation

**Test 4: Debug workflow**
```
Use debug with:
  step: "Investigating potential causes of slow list rendering"
  step_number: 1
  total_steps: 2
  next_step_required: true
  findings: "Checking for unnecessary re-renders"
  model: "gpt-4o"
  hypothesis: "Component may be missing React.memo or useCallback"
```

**Expected Result:**
- Returns structured debugging guidance
- Suggests next investigation steps

**Verification Checklist:**
- [ ] Model listing shows OpenAI models
- [ ] Model listing shows Gemini models
- [ ] Chat returns responses
- [ ] Thinkdeep provides analysis
- [ ] Debug workflow functions
- [ ] No API authentication errors

---

### 6. exa (Web Search)

**Purpose:** Exa AI web search engine

**Test 1: Basic search**
```
Use web_search_exa with:
  query: "React Admin v5 new features"
  numResults: 3
```

**Expected Result:**
- Returns 3 search results
- Each result has title, URL, and snippet

**Verification Checklist:**
- [ ] Search returns results
- [ ] Results are relevant to query
- [ ] No API key errors

---

### 7. github-official (GitHub API)

**Purpose:** Full GitHub operations

**Test 1: Get authenticated user**
```
Use get_me (no parameters)
```

**Expected Result:**
- Returns your GitHub username
- Shows account details

**Test 2: List repository issues**
```
Use list_issues with:
  owner: "marmelab"
  repo: "react-admin"
  state: "OPEN"
  perPage: 5
```

**Expected Result:**
- Returns 5 open issues
- Each issue has title, number, labels

**Test 3: Search code**
```
Use search_code with:
  query: "useRecordContext language:typescript"
  perPage: 5
```

**Expected Result:**
- Returns code matches from GitHub
- Shows file paths and repository info

**Test 4: Get file contents**
```
Use get_file_contents with:
  owner: "krwhynot"
  repo: "crispy-crm"
  path: "README.md"
```

**Expected Result:**
- Returns README.md content
- Includes file metadata

**Verification Checklist:**
- [ ] Authentication works (get_me succeeds)
- [ ] Issue listing works
- [ ] Code search returns results
- [ ] File reading works
- [ ] No rate limiting errors

---

## Comprehensive Test Script

Run all tests in sequence to verify full functionality:

### Phase 1: Infrastructure
1. Verify Docker Desktop running
2. Verify gateway status with `docker mcp server ls`
3. Check all secrets configured

### Phase 2: Documentation Tools
1. context7: Resolve + fetch React Admin docs
2. perplexity: Search for current library versions

### Phase 3: Automation Tools
1. playwright: Navigate → Snapshot → Interact → Close
2. github: Authenticate → List issues → Search code

### Phase 4: Knowledge Tools
1. obsidian: List → Read → Create → Delete test note
2. zen: List models → Chat → Thinkdeep

### Phase 5: Search Tools
1. exa: Web search test
2. perplexity: Research test

---

## Common Issues & Solutions

### "Server not responding"

```bash
# Check if gateway is running
powershell.exe -NoProfile -Command "docker mcp gateway status"

# Restart gateway
powershell.exe -NoProfile -Command "docker mcp gateway restart"
```

### "Missing required secrets"

```bash
# Check secret status
powershell.exe -NoProfile -Command "docker mcp server inspect <name>"

# Set missing secret
powershell.exe -NoProfile -Command "docker mcp secret set <server>.<key>=<value>"
```

### "Obsidian connection refused"

1. Verify Obsidian desktop is running
2. Check REST API plugin is enabled
3. Verify API key matches: Settings → Community Plugins → Local REST API
4. Ensure HTTPS is enabled on port 27124

### "GitHub rate limited"

- Wait 60 seconds between heavy operations
- Use authenticated requests (get_me first)
- Check rate limit: `gh api rate_limit`

### "Playwright browser not found"

```
Use browser_install (no parameters)
```

This downloads the required browser binaries.

### "Zen partial secrets"

Zen works with partial secrets (OpenAI + Gemini). Optional providers:
- `openrouter_api_key` - Access to additional models
- `xai_api_key` - Access to Grok models

---

## Test Results Template

Use this template to record your test results:

```markdown
## MCP Docker Gateway Test Results
**Date:** YYYY-MM-DD
**Tester:**

### Gateway Status
- [ ] Docker Desktop running
- [ ] Gateway responding
- [ ] All 7 servers enabled

### Server Results

| Server | Status | Notes |
|--------|--------|-------|
| context7 | ✅/❌ | |
| playwright | ✅/❌ | |
| perplexity-ask | ✅/❌ | |
| obsidian | ✅/❌ | |
| zen | ✅/❌ | |
| exa | ✅/❌ | |
| github-official | ✅/❌ | |

### Issues Found
1.

### Actions Taken
1.
```

---

## Automation (Future)

For automated testing, consider creating a test script:

```typescript
// scripts/test-mcp-tools.ts
// TODO: Implement automated MCP tool verification
// This would use the MCP client SDK to programmatically test each tool
```

---

## Related Documentation

- [MCP Docker Gateway Setup](../MCP-DOCKER-GATEWAY-SETUP.md)
- [MCP Servers Overview](../mcp-servers.md)
- [Docker MCP CLI Reference](https://docs.docker.com/mcp/)
