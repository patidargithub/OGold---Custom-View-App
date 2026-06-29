const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Robust wrapper for ZAF client.request that implements retries on HTTP 429 (rate limiting).
 */
export async function requestWithRetry(client, options, retries = 3, delay = 1000) {
  try {
    // If the caller didn't explicitly disable autoRetry, let ZAF handle its internal retries.
    // If it fails, our catch block will act as a fallback.
    const requestOptions = {
      autoRetry: true,
      ...options
    };
    return await client.request(requestOptions);
  } catch (error) {
    const isRateLimit = error.status === 429;
    if (isRateLimit && retries > 0) {
      let retryAfter = 5; // default 5 seconds backoff
      if (error.responseHeaders && error.responseHeaders['Retry-After']) {
        retryAfter = parseInt(error.responseHeaders['Retry-After'], 10) || 5;
      } else if (error.headers && error.headers['retry-after']) {
        retryAfter = parseInt(error.headers['retry-after'], 10) || 5;
      }
      console.warn(`Zendesk API Rate Limit (429) hit. Retrying in ${retryAfter}s... (Retries left: ${retries})`);
      await wait(retryAfter * 1000 + 500); // Wait Retry-After seconds + 500ms buffer
      return requestWithRetry(client, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Fetches all ticket fields (both standard and custom) from Zendesk.
 */
export async function fetchTicketFields(client) {
  const options = {
    url: '/api/v2/ticket_fields.json',
    type: 'GET',
    dataType: 'json'
  };
  const response = await requestWithRetry(client, options);
  // Filter only active ticket fields
  return (response.ticket_fields || []).filter(field => field.active);
}

/**
 * Searches tickets using the Zendesk Search API.
 * Sideloads 'users', 'groups', and 'organizations' referenced in the matching tickets.
 */
export async function searchTickets(client, { query, page = 1, perPage = 25, sortBy = 'created_at', sortOrder = 'desc' }) {
  // Build URL parameters
  const encodedQuery = encodeURIComponent(query);
  const includeSideloads = encodeURIComponent('tickets(users,groups,organizations)');
  const url = `/api/v2/search.json?query=${encodedQuery}&include=${includeSideloads}&page=${page}&per_page=${perPage}&sort_by=${sortBy}&sort_order=${sortOrder}`;

  const options = {
    url,
    type: 'GET',
    dataType: 'json'
  };

  const response = await requestWithRetry(client, options);
  
  return {
    tickets: response.results || [],
    count: response.count || 0,
    nextPage: response.next_page,
    prevPage: response.previous_page,
    sideloads: {
      users: response.users || [],
      groups: response.groups || [],
      organizations: response.organizations || []
    }
  };
}

/**
 * Helper to build the Zendesk search query string from filter conditions.
 * Implements OR logic for multiple values in the same field and AND logic between fields.
 */
export function buildSearchQuery(filters) {
  const parts = ['type:ticket', '-status:solved', '-status:closed'];

  // Group filters by field to implement the proper OR / AND logic:
  // - Multiple values within the same field should be treated as OR
  // - Multiple different filter fields should be treated as AND
  // Since Zendesk search treats multiple repetitions of the same field-value as OR,
  // we group them and add each field:value condition.
  const groupedFilters = {};
  
  filters.forEach(filter => {
    if (!filter.field || !filter.values || filter.values.length === 0) return;
    if (!groupedFilters[filter.field]) {
      groupedFilters[filter.field] = [];
    }
    groupedFilters[filter.field].push({
      operator: filter.operator,
      values: filter.values
    });
  });

  Object.entries(groupedFilters).forEach(([field, occurrences]) => {
    occurrences.forEach(occ => {
      occ.values.forEach(val => {
        let formattedVal = val;
        // Handle dates and numbers vs string spacing
        if (typeof val === 'string') {
          // If the value contains a space and is not already quoted, wrap it in double quotes
          if (val.includes(' ') && !val.startsWith('"')) {
            formattedVal = `"${val}"`;
          }
        }
        
        switch (occ.operator) {
          case '=':
          case 'contains':
            parts.push(`${field}:${formattedVal}`);
            break;
          case '!=':
          case 'does not contain':
            parts.push(`-${field}:${formattedVal}`);
            break;
          case '>':
            parts.push(`${field}>${formattedVal}`);
            break;
          case '<':
            parts.push(`${field}<${formattedVal}`);
            break;
          case '>=':
            parts.push(`${field}>=${formattedVal}`);
            break;
          case '<=':
            parts.push(`${field}<=${formattedVal}`);
            break;
          default:
            parts.push(`${field}:${formattedVal}`);
        }
      });
    });
  });

  return parts.join(' ');
}
