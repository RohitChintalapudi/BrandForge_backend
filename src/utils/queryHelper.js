/**
 * Parses and sanitizes pagination parameters from query string
 * @param {Object} query - Express req.query object
 * @param {number} defaultLimit - Default items per page
 * @param {number} maxLimit - Maximum allowed items per page
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPaginationOptions = (query, defaultLimit = 10, maxLimit = 50) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Builds structured pagination response metadata
 * @param {number} totalItems - Total documents count
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationMetadata = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    totalItems,
    currentPage: page,
    totalPages,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Escapes regex special characters to prevent regex injection attacks
 * @param {string} str - Raw search string
 * @returns {string} Escaped search string
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports = {
  getPaginationOptions,
  buildPaginationMetadata,
  escapeRegex,
};
