#!/usr/bin/env node
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  prompt: string;
}

// Lightweight index structure (from skill-index.json)
interface SkillIndexEntry {
  priority: "critical" | "high" | "medium" | "low";
  keywords: string[];
  intentPatterns: string[];
}

interface SkillIndex {
  version: string;
  description: string;
  agents: Record<string, unknown>;
  skills: Record<string, SkillIndexEntry>;
  keywordOwnership: Record<string, unknown>;
  skillToDomain?: Record<string, string>;
}

interface MatchedSkill {
  name: string;
  matchType: "keyword" | "intent";
  config: SkillIndexEntry;
}

async function main() {
  try {
    // Read input from stdin
    const input = readFileSync(0, "utf-8");
    const data: HookInput = JSON.parse(input);
    const prompt = data.prompt.toLowerCase();

    // Load lightweight skill index (not full skill-rules.json)
    const projectDir = process.env.CLAUDE_PROJECT_DIR || join(__dirname, "..", "..");
    const indexPath = join(projectDir, ".claude", "skills", "skill-index.json");
    const index: SkillIndex = JSON.parse(readFileSync(indexPath, "utf-8"));

    const matchedSkills: MatchedSkill[] = [];

    // Check each skill for matches using flattened index structure
    for (const [skillName, config] of Object.entries(index.skills)) {
      // Keyword matching (direct access - no promptTriggers wrapper)
      if (config.keywords && config.keywords.length > 0) {
        const keywordMatch = config.keywords.some((kw) => prompt.includes(kw.toLowerCase()));
        if (keywordMatch) {
          matchedSkills.push({ name: skillName, matchType: "keyword", config });
          continue;
        }
      }

      // Intent pattern matching (direct access)
      if (config.intentPatterns && config.intentPatterns.length > 0) {
        const intentMatch = config.intentPatterns.some((pattern) => {
          const regex = new RegExp(pattern, "i");
          return regex.test(prompt);
        });
        if (intentMatch) {
          matchedSkills.push({ name: skillName, matchType: "intent", config });
        }
      }
    }

    // Generate output if matches found
    if (matchedSkills.length > 0) {
      let output = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      output += "🎯 SKILL ACTIVATION CHECK\n";
      output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

      // Group by priority
      const critical = matchedSkills.filter((s) => s.config.priority === "critical");
      const high = matchedSkills.filter((s) => s.config.priority === "high");
      const medium = matchedSkills.filter((s) => s.config.priority === "medium");
      const low = matchedSkills.filter((s) => s.config.priority === "low");

      if (critical.length > 0) {
        output += "⚠️ CRITICAL SKILLS (REQUIRED):\n";
        critical.forEach((s) => (output += `  → ${s.name}\n`));
        output += "\n";
      }

      if (high.length > 0) {
        output += "📚 RECOMMENDED SKILLS:\n";
        high.forEach((s) => (output += `  → ${s.name}\n`));
        output += "\n";
      }

      if (medium.length > 0) {
        output += "💡 SUGGESTED SKILLS:\n";
        medium.forEach((s) => (output += `  → ${s.name}\n`));
        output += "\n";
      }

      if (low.length > 0) {
        output += "📌 OPTIONAL SKILLS:\n";
        low.forEach((s) => (output += `  → ${s.name}\n`));
        output += "\n";
      }

      output += "ACTION: Use Skill tool BEFORE responding\n";
      output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

      console.log(output);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error in skill-activation-prompt hook:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Uncaught error:", err);
  process.exit(1);
});
