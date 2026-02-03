/**
 * Parse Supabase-style query parameters
 * Examples:
 *   ?user_id=eq.123 -> WHERE user_id = '123'
 *   ?pincode=eq.12345 -> WHERE pincode = '12345'
 *   ?user_id=in.(id1,id2,id3) -> WHERE user_id IN ('id1','id2','id3')
 *   ?last_seen=gte.2024-01-01T00:00:00 -> WHERE last_seen >= '2024-01-01T00:00:00'
 *   ?territory_polygon=not.eq.[] -> WHERE territory_polygon != '[]'
 *   ?order=started_at.desc -> ORDER BY started_at DESC
 */

function parseSupabaseQuery(req, res, next) {
  const filters = [];
  const params = [];
  let orderBy = null;

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'order') {
      // Parse order parameter: order=column.direction
      const [column, direction] = value.split('.');
      orderBy = `${column} ${direction?.toUpperCase() || 'ASC'}`;
      continue;
    }

    if (key === 'select') {
      // Store select fields for later use
      req.selectFields = value;
      continue;
    }

    // Parse filter operators
    if (typeof value === 'string') {
      if (value.startsWith('eq.')) {
        const val = value.substring(3);
        filters.push(`${key} = ?`);
        params.push(val);
      } else if (value.startsWith('neq.')) {
        const val = value.substring(4);
        filters.push(`${key} != ?`);
        params.push(val);
      } else if (value.startsWith('gt.')) {
        const val = value.substring(3);
        filters.push(`${key} > ?`);
        params.push(val);
      } else if (value.startsWith('gte.')) {
        const val = value.substring(4);
        filters.push(`${key} >= ?`);
        params.push(val);
      } else if (value.startsWith('lt.')) {
        const val = value.substring(3);
        filters.push(`${key} < ?`);
        params.push(val);
      } else if (value.startsWith('lte.')) {
        const val = value.substring(4);
        filters.push(`${key} <= ?`);
        params.push(val);
      } else if (value.startsWith('in.(')) {
        // Extract values from in.(val1,val2,val3)
        const values = value.substring(4, value.length - 1).split(',');
        const placeholders = values.map(() => '?').join(',');
        filters.push(`${key} IN (${placeholders})`);
        params.push(...values);
      } else if (value.startsWith('not.eq.')) {
        const val = value.substring(7);
        filters.push(`${key} != ?`);
        params.push(val);
      } else {
        // Default to equals
        filters.push(`${key} = ?`);
        params.push(value);
      }
    }
  }

  req.parsedQuery = {
    filters,
    params,
    orderBy,
    whereClause: filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '',
    orderClause: orderBy ? `ORDER BY ${orderBy}` : ''
  };

  next();
}

module.exports = parseSupabaseQuery;
