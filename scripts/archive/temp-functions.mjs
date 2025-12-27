function escapeForPostgREST(value) {
    const str = String(value);
    // Check for PostgREST reserved characters
    const needsQuoting = /[,."':() ]/.test(str);

    if (!needsQuoting) {
        return str;
    }

    // Escape backslashes and quotes
    let escaped = str.replace(/\\/g, '\\\\'); // Backslash → \\
    escaped = escaped.replace(/"/g, '\\"'); // Quote → \"
    return `"${escaped}"`;
}

function transformArrayFilters(filter) {
    if (!filter || typeof filter !== 'object') {
        return filter;
    }

    const transformed = {};

    // Fields that are stored as JSONB arrays in PostgreSQL
    // These use the @cs (contains) operator
    const jsonbArrayFields = ['tags', 'email', 'phone'];

    for (const [key, value] of Object.entries(filter)) {
        // Skip null/undefined values
        if (value === null || value === undefined) {
            continue;
        }

        // Preserve existing PostgREST operators (keys containing @)
        if (key.includes('@')) {
            transformed[key] = value;
            continue;
        }

        // Handle array values
        if (Array.isArray(value)) {
            // Skip empty arrays
            if (value.length === 0) {
                continue;
            }

            if (jsonbArrayFields.includes(key)) {
                // JSONB array contains - format {1,2,3}
                // This checks if the JSONB array contains any of the specified values
                transformed[`${key}@cs`] = `{${value.map(escapeForPostgREST).join(',')}}`;
            } else {
                // Regular IN operator - format (val1,val2,val3)
                // This checks if the field value is in the list
                transformed[`${key}@in`] = `(${value.map(escapeForPostgREST).join(',')})`;
            }
        } else {
            // Regular non-array value
            transformed[key] = value;
        }
    }

    return transformed;
}

// Export for testing
export { escapeForPostgREST, transformArrayFilters };
