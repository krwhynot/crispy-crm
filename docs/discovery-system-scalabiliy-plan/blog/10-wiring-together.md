# Wiring It All Together: The Discovery Pipeline

One command to index everything. One command to search.

That is the promise.

But getting there requires connecting a lot of moving pieces. SCIP for code intelligence. Qdrant for vector storage. Ollama for embeddings. Tree-sitter for chunking.

Each tool is powerful on its own. Together, they form a semantic search system that understands your code.

Today we wire them together.

---

## The Pain Point: Manual Orchestration

Last week I tried to search our codebase for "form validation hooks."

Here is what I did:

1. Started Docker Desktop (forgot it was not running)
2. Ran `docker compose up qdrant ollama`
3. Waited. Wondered if it was working.
4. Ran the embedding script. Got "connection refused."
5. Waited longer. Ran again. Different error.
6. Realized I never pulled the Ollama model on this machine.
7. Pulled the model. Re-ran the script.
8. Finally got results.

Thirty minutes. For one search.

That is not a workflow. That is a punishment.

The individual pieces work. But the gaps between them create friction. And friction kills adoption.

If running a semantic search takes 30 minutes of troubleshooting, nobody will use semantic search. They will grep and suffer.

We need to eliminate the gaps.

---

## From Scripts to Pipeline

In the previous articles, we built individual components:

- A SCIP indexer that parses TypeScript into searchable symbols
- A Qdrant client that stores embeddings in a vector database
- An Ollama wrapper that generates those embeddings locally
- Tree-sitter chunking that breaks code at natural boundaries

Each of these works. We tested them. We verified the outputs.

But running four commands in sequence, checking health endpoints, waiting for Docker containers... that gets old fast.

What we need is orchestration.

Not "orchestration" in the enterprise Kubernetes sense. Just a simple task runner that remembers the order of operations so we do not have to.

Enter the justfile.

---

## The Assembly Line Analogy

Think about how a car factory works.

Raw materials enter one end. A finished car rolls off the other end. But in between, there are dozens of stations.

Station 1 stamps the body panels. Station 2 welds them together. Station 3 installs the engine. And so on.

Each station does exactly one thing. Each station expects its inputs in a specific state. And each station passes its outputs to the next station.

Our discovery pipeline works the same way.

**Station 1: SCIP Indexing**
Source code enters. A SCIP index file exits.

**Station 2: Embedding Generation**
SCIP output enters. Vector embeddings exit.

**Station 3: Qdrant Indexing**
Embeddings enter. Searchable vectors exit.

**Station 4: Search Interface**
Your query enters. Relevant code exits.

Each station is a separate script. The justfile is the conveyor belt connecting them.

Why this matters: when something breaks, you know exactly which station failed. When you want to re-run just the embedding step, you can. The assembly line gives you control.

---

## Let's Build It: Justfile Recipes

Time to get concrete.

Here is the complete discovery section for your justfile:

```makefile
# ─────────────────────────────────────────────────────────────
# Discovery Pipeline (Semantic Search)
# ─────────────────────────────────────────────────────────────

# Generate SCIP index from TypeScript source
discover-scip:
    npx scip-typescript index --output .claude/state/index.scip
    scip snapshot --from .claude/state/index.scip --to .claude/state/scip-snapshot/
    @echo "SCIP index generated at .claude/state/index.scip"

# Generate embeddings and store in Qdrant
discover-embeddings:
    @echo "Starting Qdrant and Ollama..."
    docker compose up -d qdrant ollama
    @echo "Waiting for services to be healthy..."
    @scripts/discover/wait-for-services.sh
    npx tsx scripts/discover/embeddings/index.ts index

# Full discovery: SCIP indexing + embeddings
discover: discover-scip discover-embeddings
    @echo "Discovery complete"

# Semantic search query
discover-search query:
    @npx tsx scripts/discover/embeddings/index.ts search "{{query}}"
```

Four recipes. That is the whole pipeline.

Let me walk through each one.

---

### discover-scip

This is Station 1.

```makefile
discover-scip:
    npx scip-typescript index --output .claude/state/index.scip
    scip snapshot --from .claude/state/index.scip --to .claude/state/scip-snapshot/
```

Two commands, one purpose: convert your TypeScript into an indexed format.

The first command runs scip-typescript. It walks your entire codebase, parses every file, resolves all references, and outputs a binary index file.

The second command converts that binary into a human-readable snapshot. Useful for debugging. Optional but recommended.

The output lands in `.claude/state/`. Everything discovery-related lives there. One folder to rule them all.

---

### discover-embeddings

This is Stations 2 and 3 combined.

```makefile
discover-embeddings:
    docker compose up -d qdrant ollama
    @scripts/discover/wait-for-services.sh
    npx tsx scripts/discover/embeddings/index.ts index
```

Line 1 starts the Docker containers. The `-d` flag runs them in the background.

Line 2 is the tricky part. More on this in the gotchas section.

Line 3 runs the actual embedding pipeline. It chunks your code, generates embeddings via Ollama, and stores everything in Qdrant.

Why combine stations 2 and 3? Because they share dependencies. Both need Qdrant running. Both need Ollama running. Starting the containers once for both operations is cleaner.

---

### discover

The master recipe.

```makefile
discover: discover-scip discover-embeddings
```

This depends on both sub-recipes. Run `just discover` and both execute in order.

SCIP first. Embeddings second.

The dependency chain is right there in the recipe definition. No guessing about what runs when.

---

### discover-search

The payoff.

```makefile
discover-search query:
    @npx tsx scripts/discover/embeddings/index.ts search "{{query}}"
```

This takes a query argument and passes it to the search script.

Usage:

```bash
just discover-search "form validation hooks"
just discover-search "data provider error handling"
just discover-search "Zod schema for contacts"
```

The `{{query}}` syntax is justfile's variable interpolation. Whatever you type after `discover-search` becomes the query.

The `@` prefix suppresses printing the command itself. You just see the results, not the noise.

---

## The CLI Experience

Here is what using the pipeline feels like in practice.

**First time setup:**

```bash
just discover
```

This takes a few minutes. SCIP parses everything. Ollama generates embeddings for every code chunk. Qdrant stores them all.

Go get coffee. Check Slack. Come back to a fully indexed codebase.

**Daily use:**

```bash
just discover-search "hooks for form state"
```

Results in under a second:

```
Search Results:

1. [0.847] hook: useFormValidation
   src/hooks/useFormValidation.ts
   export function useFormValidation<T extends ZodSchema>...

2. [0.821] hook: useFormState
   src/hooks/useFormState.ts
   export function useFormState<T>(initialValues: T)...

3. [0.798] function: validateFormData
   src/utils/validation.ts
   export function validateFormData(schema, data)...
```

The numbers in brackets are similarity scores. Higher is better. 0.847 means "very similar to your query."

**After code changes:**

```bash
just discover
```

Re-indexes everything. In a future article, we will make this incremental.

---

## Deep Dive: Incremental Updates

Full reindexing works. But it is slow.

Every file gets parsed. Every chunk gets embedded. Every vector gets stored.

For a 50,000 line codebase, that is maybe 5 minutes. Tolerable for a full rebuild. Frustrating when you changed one file.

Here is the incremental approach:

**The Manifest**

We track what was indexed and when:

```json
{
  "sourceHashes": {
    "src/hooks/useFormValidation.ts": "a3f2c891",
    "src/hooks/useFormState.ts": "b7e4d123",
    "src/components/ContactForm.tsx": "c9f8e456"
  },
  "generatedAt": "2025-12-27T10:00:00Z"
}
```

Each file has a hash. The hash changes when the file content changes.

**The Check**

Before indexing, compare current hashes to manifest hashes:

```typescript
for (const file of sourceFiles) {
  const currentHash = hashFile(file);
  const manifestHash = manifest.sourceHashes[file];

  if (currentHash !== manifestHash) {
    staleFiles.push(file);
  }
}
```

Three outcomes:
- Hash matches: skip this file
- Hash differs: re-index this file
- File not in manifest: new file, index it

**The Update**

Only process stale files:

```typescript
for (const file of staleFiles) {
  const chunks = chunkFile(file);
  const embeddings = await generateEmbeddings(chunks);
  await updateQdrant(file, embeddings);
}
```

One changed file means one file gets re-embedded. Not the entire codebase.

**The Result**

Full index: 5 minutes.
Incremental after one file change: 2 seconds.

That is the power of tracking state.

**The justfile recipe:**

```makefile
# Incremental discovery (only changed files)
discover-incr:
    npx tsx scripts/discover/index.ts --incremental
```

Same output. Fraction of the time.

---

## Watch Out For

Here is what will bite you.

### Docker Startup Timing

The biggest gotcha in this entire pipeline.

You run `docker compose up -d qdrant ollama`. The command returns immediately. "Great," you think, "containers are running."

Wrong.

The containers are starting. They are not ready.

Qdrant needs a few seconds to initialize its storage. Ollama needs a few seconds to load its model weights.

If your embedding script hits the API too early, you get connection refused errors.

**The Fix: Health Check Script**

Create `scripts/discover/wait-for-services.sh`:

```bash
#!/bin/bash
set -e

echo "Waiting for Qdrant..."
until curl -s http://localhost:6333/health > /dev/null 2>&1; do
  sleep 1
done
echo "Qdrant is ready"

echo "Waiting for Ollama..."
until curl -s http://localhost:11434/api/version > /dev/null 2>&1; do
  sleep 1
done
echo "Ollama is ready"

# Give Ollama a moment to fully initialize
sleep 2
```

This script polls the health endpoints until they respond. Only then does it return.

Add it to your recipe:

```makefile
discover-embeddings:
    docker compose up -d qdrant ollama
    @scripts/discover/wait-for-services.sh
    npx tsx scripts/discover/embeddings/index.ts index
```

Now the embedding script never runs until the services are actually ready.

### First Query Cold Start

Ollama loads the embedding model lazily.

Your first embedding request after container startup is slow. Maybe 10 seconds. Because Ollama is loading nomic-embed-text into GPU memory.

Every subsequent request is fast. Sub-second.

**The Fix: Warm-up Request**

Add a dummy embedding request to the health check:

```bash
echo "Warming up Ollama..."
curl -s -X POST http://localhost:11434/api/embeddings \
  -d '{"model":"nomic-embed-text","prompt":"warmup"}' \
  > /dev/null
echo "Ollama is warm"
```

Now the cold start happens during startup, not during your first real query.

### Container Resource Limits

Docker containers share your machine's resources.

Ollama wants GPU access if available. Qdrant wants plenty of RAM for vector operations.

If you are running on a laptop with 8GB RAM, things might get slow.

**The Fix: Resource Hints in docker-compose.yml**

```yaml
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - .claude/qdrant:/qdrant/storage
    deploy:
      resources:
        limits:
          memory: 1G

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - .claude/ollama:/root/.ollama
    deploy:
      resources:
        limits:
          memory: 2G
```

Set explicit limits. Ollama gets 2GB. Qdrant gets 1GB.

If your machine has a GPU and you want Ollama to use it, add:

```yaml
  ollama:
    image: ollama/ollama:latest
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
```

### Persistence Between Restarts

Docker volumes persist data. But only if configured correctly.

Notice the volume mounts in docker-compose.yml:

```yaml
volumes:
  - .claude/qdrant:/qdrant/storage
  - .claude/ollama:/root/.ollama
```

These map container paths to your local filesystem.

Stop the containers. Start them again. Your embeddings are still there. Your downloaded models are still there.

Delete the `.claude/qdrant/` directory? Your embeddings are gone. Re-index time.

**The Fix: Back up `.claude/` with your project.**

Add it to git (or at least back it up). Losing the index means losing 5 minutes of computation.

### Port Conflicts

Qdrant wants port 6333. Ollama wants port 11434.

If something else is using those ports, Docker will fail to start.

**The Fix: Check before starting**

```bash
lsof -i :6333
lsof -i :11434
```

If either shows output, something is using that port. Stop it or change the port mapping in docker-compose.yml.

---

## The Complete Pipeline in Action

Let me show you what the final workflow looks like.

**Day one on a new machine:**

```bash
# Clone the repo
git clone git@github.com:company/project.git
cd project

# One command to set everything up
just discover
```

Behind the scenes, this:
1. Starts Docker containers (if not running)
2. Waits for health checks to pass
3. Pulls the embedding model (if missing)
4. Generates the SCIP index
5. Chunks all source files
6. Generates embeddings for each chunk
7. Stores everything in Qdrant

You wait. Maybe five minutes.

Then you search:

```bash
just discover-search "error handling for API calls"
```

Results in under a second.

**Every day after that:**

```bash
just discover-search "whatever you need"
```

The index persists. The containers stay warm. The friction is gone.

**After making code changes:**

```bash
just discover-incr
```

Incremental update. Two seconds. Back to searching.

This is what "one command to index, one command to search" actually means in practice.

---

## Debugging the Pipeline

Even with good automation, things break. Here is how to debug.

**Is Docker running?**

```bash
docker ps
```

You should see qdrant and ollama containers. If not:

```bash
docker compose up -d qdrant ollama
```

**Is Qdrant healthy?**

```bash
curl http://localhost:6333/health
```

You should see JSON with version info. If connection refused, Qdrant is still starting or crashed.

**Is Ollama responding?**

```bash
curl http://localhost:11434/api/version
```

Same deal. Version JSON means healthy.

**Is the embedding model loaded?**

```bash
docker exec ollama ollama list
```

You should see nomic-embed-text. If not:

```bash
docker exec ollama ollama pull nomic-embed-text
```

**Is there data in Qdrant?**

```bash
curl http://localhost:6333/collections/crispy_code
```

Look for `points_count` in the response. Zero means nothing indexed yet.

Keep these checks handy. When something breaks, run through them in order. The problem reveals itself.

---

## What's Next

We have a working pipeline now.

Run `just discover`. Wait a few minutes. Run `just discover-search "whatever you need"`. Get results.

But there is more to do.

**Next article:** We tackle CI integration. How do you run this pipeline in GitHub Actions? How do you ensure the index stays fresh across branches? How do you prevent stale discovery files from polluting your main branch?

That is the final piece. The automation that makes this system invisible.

Until then, go index something.

```bash
just discover
just discover-search "the code that scared me last week"
```

You might be surprised what comes back.
