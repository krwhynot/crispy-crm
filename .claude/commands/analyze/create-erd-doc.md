You will create an Entity Relationship Diagram (ERD) document for a CRM PostgreSQL database. I will provide you with the database schema, and you need to create both a visual text-based diagram and a comprehensive list of all data fields.

<database_schema>
{{DATABASE_SCHEMA}}
</database_schema>

Your task is to analyze the provided database schema and create a complete ERD document with two main sections:

1. **Visual Diagram**: Create a text-based visual representation of the database structure showing:
   - All tables as boxes with table names
   - Relationships between tables using lines and symbols
   - Primary keys marked with "PK"
   - Foreign keys marked with "FK" 
   - Relationship cardinality (1:1, 1:M, M:M) clearly indicated
   - Use ASCII characters to draw connections between related tables

2. **Data Fields List**: Below the visual diagram, provide a comprehensive list organized by table that includes:
   - Table name as a header
   - All column names with their data types
   - Constraints (PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, etc.)
   - Default values where applicable
   - Brief description of the field's purpose when it's not obvious from the name

For the visual diagram, use a format like this example:
```
┌─────────────────┐         ┌─────────────────┐
│   customers     │         │     orders      │
├─────────────────┤         ├─────────────────┤
│ PK customer_id  │────────<│ FK customer_id  │
│    name         │    1:M  │ PK order_id     │
│    email        │         │    order_date   │
└─────────────────┘         └─────────────────┘
```

For the data fields section, use this format:
```
TABLE: customers
- customer_id (INTEGER, PRIMARY KEY, AUTO_INCREMENT) - Unique identifier for each customer
- name (VARCHAR(100), NOT NULL) - Customer full name
- email (VARCHAR(255), UNIQUE, NOT NULL) - Customer email address
```

Make sure to:
- Identify all relationships correctly based on foreign key constraints
- Show the complete database structure in a logical layout
- Include all tables, even if they seem minor
- Clearly indicate the direction and type of relationships
- List every field with complete information about data types and constraints

Your final output should be a complete ERD document with the visual diagram first, followed by the detailed field listings. The document should be comprehensive enough that a developer could understand the entire database structure from your ERD.