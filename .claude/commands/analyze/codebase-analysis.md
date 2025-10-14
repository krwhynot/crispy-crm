# Comprehensive Codebase Analysis

## Project Discovery Phase

### Directory Structure
!`find . -type d -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./build/*" -not -path "./.next/*" -not -path "./coverage/*" | sort`

### Complete File Tree


### File Count and Size Analysis
- Total files: !`find . -type f -not -path "./node_modules/*" -not -path "./.git/*" | wc -l`
- Code files: !`find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.java" -o -name "*.php" -o -name "*.rb" -o -name "*.go" -o -name "*.rs" -o -name "*.cpp" -o -name "*.c" | grep -v node_modules | wc -l`
- Project size: !`du -sh . --exclude=node_modules --exclude=.git --exclude=dist --exclude=build`

## Configuration Files Analysis

### Package Management
- Package.json: @package.json
- Package-lock.json exists: !`ls package-lock.json 2>/dev/null || echo "Not found"`
- Yarn.lock exists: !`ls yarn.lock 2>/dev/null || echo "Not found"`
- Requirements.txt: @requirements.txt
- Gemfile: @Gemfile
- Cargo.toml: @Cargo.toml
- Go.mod: @go.mod
- Composer.json: @composer.json

### Build & Dev Tools
- Webpack config: @webpack.config.js
- Vite config: @vite.config.js
- Rollup config: @rollup.config.js
- Babel config: @.babelrc
- ESLint config: @.eslintrc.js
- Prettier config: @.prettierrc
- TypeScript config: @tsconfig.json
- Tailwind config: @tailwind.config.js
- Next.js config: @next.config.js

### Environment & Docker
- .env files: !`find . -name ".env*" -type f`

### CI/CD Configuration
- GitHub Actions: !`find .github -name "*.yml" -o -name "*.yaml" 2>/dev/null || echo "No GitHub Actions"`

## Database Setup Analysis

### Database Configuration Files
- Database configs: !`find . -name "*database*" -o -name "*db.config*" -o -name "*connection*" -o -name "knexfile*" -o -name "ormconfig*" | grep -v node_modules | head -15`
- Prisma schema: @prisma/schema.prisma
- TypeORM config: @ormconfig.json
- Sequelize config: @config/database.js
- Knex config: @knexfile.js
- MongoDB config: !`find . -name "*mongo*" | grep -E "\.(js|ts|json)$" | grep -v node_modules | head -10`

### Database Migrations & Schema
- Migration files: !`find . -path "*/migrations/*" -o -path "*/migrate/*" -o -path "*/db/migrate/*" | head -20`
- Schema files: !`find . -name "*.sql" -o -name "schema.*" | grep -v node_modules | head -15`
- Seed files: !`find . -path "*/seeds/*" -o -path "*/seeders/*" -o -path "*/fixtures/*" | head -15`
- Database dumps: !`find . -name "*.dump" -o -name "*.sql" | grep -E "(dump|backup|export)" | head -10`

### ORM/ODM Analysis
- Model definitions: !`find . -path "*/models/*" -o -path "*/entities/*" -o -path "*/schemas/*" | grep -v node_modules | head -20`
- Repository files: !`find . -path "*/repositories/*" -o -path "*/repository/*" | grep -v node_modules | head -15`
- Data Access Layer: !`find . -path "*/dal/*" -o -path "*/dao/*" | grep -v node_modules | head -15`

### Database Connection & Pool Management
- Connection files: !`find . -name "*connection*" -o -name "*pool*" | grep -E "\.(js|ts|py|rb|go|java)$" | grep -v node_modules | head -10`
- Database utilities: !`find . -path "*/utils/*" -o -path "*/helpers/*" | grep -E "db|database|query" | grep -v node_modules | head -10`

### Database Environment Variables
- Database ENV vars: !`grep -h "DB\|DATABASE\|MONGO\|POSTGRES\|MYSQL\|REDIS" .env* 2>/dev/null | grep -v "^#" | sort -u || echo "No database env vars found"`

### Query Builders & Raw SQL
- SQL files: !`find . -name "*.sql" | grep -v node_modules | head -15`
- Query builders: !`find . -name "*query*" -o -name "*builder*" | grep -E "\.(js|ts|py)$" | grep -v node_modules | head -10`
- Stored procedures: !`find . -path "*/procedures/*" -o -path "*/stored_procedures/*" -o -name "*procedure*.sql" | head -10`

### Database Testing
- Database test files: !`find . -name "*test*" -o -name "*spec*" | grep -E "(database|db|model|repository)" | grep -v node_modules | head -15`
- Test database config: !`find . -name "*test*" | grep -E "(database|db).*(config|setup)" | grep -v node_modules | head -10`

### Database Documentation
- Database docs: !`find . -name "*.md" | xargs grep -l -i "database\|schema\|table" 2>/dev/null | head -10`
- ERD files: !`find . -name "*.erd" -o -name "*.puml" -o -name "*diagram*" | grep -i "db\|database\|schema" | head -10`

## Source Code Analysis

### Main Application Files
- Main entry points: !`find . -name "main.*" -o -name "index.*" -o -name "app.*" -o -name "server.*" | grep -v node_modules | head -10`
- Routes/Controllers: !`find . -path "*/routes/*" -o -path "*/controllers/*" -o -path "*/api/*" | grep -v node_modules | head -20`
- Models/Schemas: !`find . -path "*/models/*" -o -path "*/schemas/*" -o -path "*/entities/*" | grep -v node_modules | head -20`
- Components: !`find . -path "*/components/*" -o -path "*/views/*" -o -path "*/pages/*" | grep -v node_modules | head -20`

### Testing Files
- Test files: !`find . -name "*test*" -o -name "*spec*" | grep -v node_modules | head -15`
- Test config: @jest.config.js

### API Documentation
- API docs: !`find . -name "*api*" -name "*.md" -o -name "swagger*" -o -name "openapi*" | head -10`

## Atomic Design Migration Pattern Analysis

### Current Migration Status
- Migration Status Document: @src/components/MIGRATION_STATUS.md
- Migration Phase: !`grep -A 1 "Migration Progress" src/components/MIGRATION_STATUS.md 2>/dev/null || echo "No migration status found"`
- Target Completion: !`grep "Target Removal Date" src/components/MIGRATION_STATUS.md 2>/dev/null | head -1 || echo "No target date set"`

### Active Adapter Files
!`echo "Total Adapter Files: $(find src/components -name "*.ts" -exec grep -l "Temporary adapter during atomic design migration" {} \; 2>/dev/null | wc -l)"`

#### Adapter Files by Category:
```
Atoms Adapters:
!`ls src/components/atoms/*.ts 2>/dev/null | xargs grep -l "Temporary adapter" 2>/dev/null || echo "  None found"`

Molecules Adapters:
!`ls src/components/molecules/*.ts 2>/dev/null | xargs grep -l "Temporary adapter" 2>/dev/null || echo "  None found"`

Organisms Adapters:
!`ls src/components/organisms/*.ts 2>/dev/null | xargs grep -l "Temporary adapter" 2>/dev/null || echo "  None found"`

Templates Adapters:
!`ls src/components/templates/*.ts 2>/dev/null | xargs grep -l "Temporary adapter" 2>/dev/null || echo "  None found"`

UI Directory Adapters:
!`ls src/components/ui/*.ts 2>/dev/null | xargs grep -l "Temporary adapter" 2>/dev/null || echo "  None found"`
```

#### Adapter Mapping Details:
!`grep -l "Temporary adapter" src/components/*/*.ts 2>/dev/null | head -15`

### Adapter Pattern Flow Diagram
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ATOMIC DESIGN MIGRATION ADAPTER PATTERN                 │
└─────────────────────────────────────────────────────────────────────────────────┘

     Import Request                    Adapter Layer                    Legacy Location
┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
│                      │         │                      │         │                      │
│  Component imports   │────────▶│  Adapter file acts   │────────▶│  Actual component    │
│  from atomic path:   │         │  as transparent      │         │  exists in legacy    │
│                      │         │  proxy via           │         │  location            │
│ @/components/atoms/  │         │  re-export:          │         │                      │
│    /table            │         │                      │         │ @/components/ui/     │
│                      │         │  export * from       │         │    table             │
│                      │◀────────│  '@/components/ui/   │◀────────│                      │
│  Receives exports    │         │     table'           │         │  Component exports   │
│                      │         │                      │         │                      │
└──────────────────────┘         └──────────────────────┘         └──────────────────────┘
        ▲                                                                    │
        │                                                                    │
        └────────────────────────────────────────────────────────────────────┘
                              Component functions normally
```

### Component Usage Analysis

#### Files Using Atomic Imports
!`echo "Total files using atomic imports: $(grep -r "@/components/\(atoms\|molecules\|organisms\|templates\)" src --include="*.tsx" --include="*.ts" 2>/dev/null | cut -d: -f1 | sort -u | wc -l)"`

#### Pages/Features Using Adapters
```
Files importing from atoms/:
!`grep -r "@/components/atoms/" src --include="*.tsx" --include="*.ts" 2>/dev/null | cut -d: -f1 | sort -u | head -10 | while read f; do echo "  - $(echo $f | sed 's|src/||')"; done`

Files importing from molecules/:
!`grep -r "@/components/molecules/" src --include="*.tsx" --include="*.ts" 2>/dev/null | cut -d: -f1 | sort -u | head -10 | while read f; do echo "  - $(echo $f | sed 's|src/||')"; done`

Files importing from organisms/:
!`grep -r "@/components/organisms/" src --include="*.tsx" --include="*.ts" 2>/dev/null | cut -d: -f1 | sort -u | head -10 | while read f; do echo "  - $(echo $f | sed 's|src/||')"; done`

Files importing from templates/:
!`grep -r "@/components/templates/" src --include="*.tsx" --include="*.ts" 2>/dev/null | cut -d: -f1 | sort -u | head -10 | while read f; do echo "  - $(echo $f | sed 's|src/||')"; done`
```

### Migration Impact Analysis
- Components with mixed imports (both legacy and atomic): !`grep -r "@/components/ui" src --include="*.tsx" --include="*.ts" 2>/dev/null | cut -d: -f1 | sort -u | xargs grep -l "@/components/\(atoms\|molecules\|organisms\|templates\)" 2>/dev/null | wc -l`
- Legacy imports still in use: !`grep -r "@/components/ui" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l`
- Atomic imports already adopted: !`grep -r "@/components/\(atoms\|molecules\|organisms\|templates\)" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l`

### Technical Debt Tracking
- Adapter files (temporary debt): !`find src/components -name "*.ts" -exec grep -l "TODO: Move.*to proper atomic location" {} \; 2>/dev/null | wc -l`
- Migration TODOs in codebase: !`grep -r "TODO.*atomic\|TODO.*migration" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l`

### Development Environment Status
!`ps aux | grep -E "vite|webpack|next" | grep -v grep > /dev/null && echo "✅ Development server is running" || echo "❌ Development server is not running"`

## Key Files Content Analysis

### Root Configuration Files
@README.md
@LICENSE
@.gitignore

### Main Application Entry Points
!`find . -name "index.js" -o -name "index.ts" -o -name "main.js" -o -name "main.ts" -o -name "app.js" -o -name "app.ts" -o -name "server.js" -o -name "server.ts" | grep -v node_modules | head -5 | while read file; do echo "=== $file ==="; head -50 "$file"; echo; done`

## Your Task
Based on all the discovered information above, create a comprehensive analysis that includes:

## 1. Project Overview
- Project type (web app, API, library, etc.)
- Tech stack and frameworks
- Architecture pattern (MVC, microservices, etc.)
- Language(s) and versions

## 2. Detailed Directory Structure Analysis
For each major directory, explain:
- Purpose and role in the application
- Key files and their functions
- How it connects to other parts

## 3. File-by-File Breakdown
Organize by category:
- **Core Application Files**: Main entry points, routing, business logic
- **Configuration Files**: Build tools, environment, deployment
- **Data Layer**: Models, database connections, migrations
- **Frontend/UI**: Components, pages, styles, assets  
- **Testing**: Test files, mocks, fixtures
- **Documentation**: README, API docs, guides
- **DevOps**: CI/CD, Docker, deployment scripts

## 4. Database Architecture Analysis
Document and analyze:
- **Database Type**: Relational (PostgreSQL, MySQL, SQLite) vs NoSQL (MongoDB, Redis, DynamoDB)
- **Connection Strategy**: Connection pooling, singleton patterns, connection lifecycle
- **ORM/ODM Usage**: Type (Prisma, TypeORM, Sequelize, Mongoose), configuration, features used
- **Schema Design**: 
  - Table/collection structure
  - Relationships and foreign keys
  - Indexes and constraints
  - Data types and validation rules
- **Migration Strategy**: 
  - Migration tool and workflow
  - Version control for schema changes
  - Rollback procedures
- **Data Access Patterns**: 
  - Repository pattern implementation
  - Query optimization strategies
  - Caching mechanisms
- **Database Security**: 
  - Authentication methods
  - Encryption at rest/in transit
  - SQL injection prevention
  - Access control and permissions
- **Performance Considerations**: 
  - Query optimization
  - Index usage
  - Connection pool sizing
  - Read/write splitting
- **Backup and Recovery**: 
  - Backup strategies
  - Point-in-time recovery
  - Disaster recovery plans

## 5. API Endpoints Analysis
If applicable, document:
- All discovered endpoints and their methods
- Authentication/authorization patterns
- Request/response formats
- API versioning strategy

## 6. Architecture Deep Dive
Explain:
- Overall application architecture
- Data flow and request lifecycle
- Key design patterns used
- Dependencies between modules

## 7. Environment & Setup Analysis
Document:
- Required environment variables
- Installation and setup process
- Development workflow
- Production deployment strategy

## 8. Technology Stack Breakdown
List and explain:
- Runtime environment
- Frameworks and libraries
- Database technologies
- Build tools and bundlers
- Testing frameworks
- Deployment technologies

## 9. Visual Architecture Diagram
Create a comprehensive diagram showing:
- High-level system architecture
- Component relationships
- Data flow
- External integrations
- File structure hierarchy
- Database schema relationships

Use ASCII art, mermaid syntax, or detailed text representation to show:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Frontend    │────▶│      API        │────▶│    Database     │
│   (React/Vite)   │     │   (Node/Flask)  │     │ (Postgres/supabase)│
└─────────────────┘     └─────────────────┘     └─────────────────┘

## 10. Key Insights & Recommendations
Provide:
- Code quality assessment
- Database optimization opportunities
- Possible Problems
- Potential improvements
- Security considerations
- Performance optimization opportunities
- Maintainability suggestions
- Scalability recommendations

UltraThink deeply about the codebase structure and provide comprehensive insights that would be valuable for new developers joining the project or for architectural decision-making.


At the end, write all of the output into a file called "codebase_analysis.md"


