// scripts/update-seed-segments.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEGMENT_UUIDS = [
  "22222222-2222-4222-8222-000000000001", // Major Broadline
  "22222222-2222-4222-8222-000000000002", // Specialty/Regional
  "22222222-2222-4222-8222-000000000003", // Management Company
  "22222222-2222-4222-8222-000000000004", // GPO
  "22222222-2222-4222-8222-000000000005", // University
  "22222222-2222-4222-8222-000000000006", // Restaurant Group
  "22222222-2222-4222-8222-000000000007", // Chain Restaurant
  "22222222-2222-4222-8222-000000000008", // Hotel & Aviation
  "22222222-2222-4222-8222-000000000009", // Unknown
];

const seedFilePath = path.join(__dirname, "..", "supabase", "seed.sql");
let content = fs.readFileSync(seedFilePath, "utf8");

let segmentIndex = 0;
let replacementCount = 0;

// Replace NULL playbook_category_id values with UUIDs in round-robin fashion
// Pattern matches: 'organization_type', NULL, 'priority'
// where NULL is the playbook_category_id column
content = content.replace(
  /(  \(\d+, '[^']+', '[^']+', )NULL(, '[A-D]')/g,
  (match, before, after) => {
    const uuid = SEGMENT_UUIDS[segmentIndex % SEGMENT_UUIDS.length];
    segmentIndex++;
    replacementCount++;
    return `${before}'${uuid}'${after}`;
  }
);

fs.writeFileSync(seedFilePath, content, "utf8");
console.log(`✅ Replaced ${replacementCount} NULL segment values`);
console.log(`Distribution: ~${Math.floor(replacementCount / 9)} orgs per segment`);
