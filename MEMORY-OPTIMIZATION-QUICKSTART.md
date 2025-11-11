# 🧠 Memory Optimization - Quick Start

**Problem:** Your setup uses 25 ports and 12-14GB RAM, leaving little headroom on 16GB.

**Solution:** Applied Approach 1 - Resource Limiting (3-4GB savings expected).

---

## ⚡ Super Quick Setup (2 minutes)

### Option A: Use the Optimization Script (Easiest)
```bash
cd /home/krwhynot/projects/crispy-crm

# Run once per dev session
./scripts/dev/optimize-memory.sh

# This kills unused VS Code servers and sets memory limits
# Then start Supabase and dev server as normal
npm run db:local:start
npm run dev
```

### Option B: Manual Setup (More Control)
```bash
# Terminal 1: Start Supabase (uses docker-compose.override.yml automatically)
npm run db:local:start

# Terminal 2: Load optimizations and start dev server
source .env.memory-optimized
npm run dev

# Terminal 3 (Optional): Monitor resources
./scripts/dev/monitor-resources.sh
```

---

## 📊 What Changed

✅ **Docker Containers** - Memory limits enforced
- PostgreSQL capped at 2GB (was unlimited)
- Kong capped at 512MB (was unlimited)
- All others capped at 256MB

✅ **Vite Configuration** - Optimized build settings

✅ **Node.js** - Heap size limited to 2GB

✅ **Helper Scripts** - Two new tools for optimization

---

## 📈 Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| RAM Usage | 12-14GB | 8-10GB | ⬇️ 3-4GB (25-30%) |
| PostgreSQL | 1.5-2GB | 1-1.5GB | ⬇️ Limited |
| Kong | 800MB-1GB | 300-400MB | ⬇️ Limited |
| Node.js | 1-2GB | 800MB-1.2GB | ⬇️ Limited |
| Vite Build | 1-2 min | ~1 min | ⚡ Faster |

---

## 🔍 Verification

Check that limits are working:

```bash
# While Supabase is running, see container memory
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"

# While dev server is running, check Node.js memory
ps aux | grep vite | grep -v grep
```

---

## 🛠️ If You Hit Issues

### "Docker container keeps exiting"
→ Increase memory limit in `supabase/docker-compose.override.yml`

### "Vite build is slow"
→ Run `./scripts/dev/optimize-memory.sh` first

### "VS Code is sluggish"
→ Kill language servers: `pkill -f "jsonServerMain"`

---

## 📚 Full Details

For in-depth documentation, troubleshooting, and advanced tuning:

👉 See `docs/development/MEMORY-OPTIMIZATION.md`

---

## 📝 Files Created

- `supabase/docker-compose.override.yml` - Docker memory limits
- `.env.memory-optimized` - Node.js environment variables
- `scripts/dev/optimize-memory.sh` - Cleanup and setup script
- `scripts/dev/monitor-resources.sh` - Real-time resource monitor
- `docs/development/MEMORY-OPTIMIZATION.md` - Complete guide

---

## ❓ Questions?

The optimization guide has troubleshooting, advanced tuning, and performance verification sections.

**Recommended reading order:**
1. This file (overview)
2. Run the optimization: `./scripts/dev/optimize-memory.sh`
3. Start dev: `npm run dev`
4. Monitor: `./scripts/dev/monitor-resources.sh` (in another terminal)
5. If issues: Check `docs/development/MEMORY-OPTIMIZATION.md` troubleshooting
