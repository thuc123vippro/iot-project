/**
 * Shared query parameter validator for paginated table endpoints.
 * Validates and sanitizes: page, limit, findBy, sortBy, search.
 *
 * Returns { page, limit, findBy, sortBy, search, errors }
 * where errors is an object — empty means all params are valid.
 */

const MAX_SEARCH_LENGTH = 200;
const MAX_PAGE_SIZE = 100;

const ALLOWED = {
  sensor: {
    findBy:  ['all', 'name', 'value', 'timestamp'],
    sortBy:  ['newest', 'oldest', 'valueAsc', 'valueDesc', 'nameAsc', 'nameDesc'],
  },
  history: {
    findBy:  ['all', 'name', 'action', 'status', 'timestamp'],
    sortBy:  ['newest', 'oldest', 'nameAsc', 'nameDesc', 'actionAsc', 'actionDesc', 'statusAsc', 'statusDesc'],
  },
};

/**
 * @param {object} query        - req.query
 * @param {string[]} validFindBy
 * @param {string[]} validSortBy
 * @returns {{ page, limit, findBy, sortBy, search, errors }}
 */
const parseTableQuery = (query, validFindBy, validSortBy) => {
  const errors = {};

  // page — must be a positive integer; default 1
  const rawPage = Number.parseInt(query.page, 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  // limit — 1 .. MAX_PAGE_SIZE; default 20
  // Nếu vượt quá MAX_PAGE_SIZE thì clamp xuống, không reject 400
  const rawLimit = Number.parseInt(query.limit, 10);
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1
    ? Math.min(rawLimit, MAX_PAGE_SIZE)
    : 20;

  // findBy — must be in whitelist; default 'all'
  const rawFindBy = (query.findBy || '').toString().trim();
  let findBy = 'all';
  if (rawFindBy !== '') {
    if (validFindBy.includes(rawFindBy)) {
      findBy = rawFindBy;
    } else {
      errors.findBy = `findBy không hợp lệ. Cho phép: ${validFindBy.join(', ')}`;
      // Fallback to 'all' — request still proceeds with safe default
    }
  }

  // sortBy — must be in whitelist; default 'newest'
  const rawSortBy = (query.sortBy || '').toString().trim();
  let sortBy = 'newest';
  if (rawSortBy !== '') {
    if (validSortBy.includes(rawSortBy)) {
      sortBy = rawSortBy;
    } else {
      errors.sortBy = `sortBy không hợp lệ. Cho phép: ${validSortBy.join(', ')}`;
      // Fallback to 'newest'
    }
  }

  // search — trim and enforce max length
  const rawSearch = String(query.search || '').trim();
  let search = rawSearch;
  if (rawSearch.length > MAX_SEARCH_LENGTH) {
    errors.search = `search không được vượt quá ${MAX_SEARCH_LENGTH} ký tự`;
    search = rawSearch.slice(0, MAX_SEARCH_LENGTH);
  }

  return { page, limit, findBy, sortBy, search, errors };
};

module.exports = {
  parseTableQuery,
  ALLOWED,
};
