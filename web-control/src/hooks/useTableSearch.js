import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;
const MAX_PAGINATION_BUTTONS = 6;

// ── Validation rules keyed by findBy field ───────────────────────────────────
const FIELD_RULES = {
  value: {
    pattern: /^-?[\d.,\s]+$/,
    message: 'Trường Value chỉ chấp nhận số (ví dụ: 28.5)',
  },
  action: {
    pattern: /^(on|off)$/i,
    message: 'Action chỉ chấp nhận: on hoặc off',
  },
  status: {
    pattern: /^(on|off|waiting)$/i,
    message: 'Status chỉ chấp nhận: on, off hoặc waiting',
  },
};

const validateSearch = (value, findBy) => {
  if (value.length > MAX_SEARCH_LENGTH) {
    return `Quá dài — tối đa ${MAX_SEARCH_LENGTH} ký tự (hiện tại: ${value.length})`;
  }
  const rule = FIELD_RULES[findBy];
  if (rule && value.trim() !== '' && !rule.pattern.test(value.trim())) {
    return rule.message;
  }
  return '';
};

/**
 * Shared hook for paginated tables with search / filter / sort.
 *
 * @param {string}  endpoint       - e.g. '/sensor-data'
 * @param {string}  defaultFindBy  - e.g. 'all'
 * @param {string}  defaultSortBy  - e.g. 'newest'
 */
const useTableSearch = ({ endpoint, defaultFindBy = 'all', defaultSortBy = 'newest' }) => {
  // ── Draft controls ───────────────────────────────────────────────────────────
  const [findBy, setFindByRaw] = useState(defaultFindBy);
  const [sortBy, setSortByRaw] = useState(defaultSortBy);
  const [searchInput, setSearchInputRaw] = useState('');
  const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_PAGE_SIZE));
  const [validationError, setValidationError] = useState('');

  // extraFilters: thêm tham số tùy chọn vào API (vd: { unit: '°C' })
  // Component gọi setExtraFilters để cập nhật, sẽ được commit cùng commitSearch
  const [pendingExtra, setPendingExtra] = useState({});

  // ── Committed query — triggers fetch ─────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [committedQuery, setCommittedQuery] = useState({
    findBy: defaultFindBy,
    sortBy: defaultSortBy,
    search: '',
    extra: {},
  });

  // ── Server data ──────────────────────────────────────────────────────────────
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1,
  });

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setFetchError('');

      try {
        const { data } = await axios.get(`${API_BASE}${endpoint}`, {
          params: {
            page: currentPage,
            limit: pageSize,
            findBy: committedQuery.findBy,
            search: committedQuery.search,
            sortBy: committedQuery.sortBy,
            ...committedQuery.extra,
          },
        });

        if (!cancelled) {
          setRows(data?.data || []);
          setPagination(
            data?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 1 }
          );
        }
      } catch {
        if (!cancelled) {
          setFetchError('Không thể tải dữ liệu. Vui lòng thử lại.');
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [endpoint, currentPage, pageSize, committedQuery]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    const total = pagination.totalPages || 1;
    const start = Math.max(1, Math.min(currentPage - 2, total - MAX_PAGINATION_BUTTONS + 1));
    const end = Math.min(total, start + MAX_PAGINATION_BUTTONS - 1);
    const pages = [];
    for (let p = Math.max(1, start); p <= end; p++) pages.push(p);
    return pages;
  }, [pagination.totalPages, currentPage]);

  const recordRangeText = useMemo(() => {
    const { total } = pagination;
    if (total === 0) return '0 bản ghi';
    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, total);
    return `${from}–${to} / ${total} bản ghi`;
  }, [pagination, currentPage, pageSize]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const setSearchInput = useCallback((value) => {
    setSearchInputRaw(value);
    setValidationError(validateSearch(value, findBy));
  }, [findBy]);

  const setFindBy = useCallback((value) => {
    setFindByRaw(value);
    setValidationError(validateSearch(searchInput, value));
  }, [searchInput]);

  /** Sort áp dụng ngay lập tức */
  const setSortBy = useCallback((value) => {
    setSortByRaw(value);
    setCurrentPage(1);
    setCommittedQuery((prev) => ({ ...prev, sortBy: value }));
  }, []);

  /** Component dùng để đăng ký extra params (vd: unit) — sẽ commit cùng Search */
  const setExtraFilters = useCallback((extra) => {
    setPendingExtra(extra);
  }, []);

  /** Validate rồi commit query */
  const commitSearch = useCallback(() => {
    const err = validateSearch(searchInput, findBy);
    if (err) { setValidationError(err); return; }
    setValidationError('');
    setCurrentPage(1);
    setCommittedQuery({ findBy, sortBy, search: searchInput.trim(), extra: pendingExtra });
  }, [searchInput, findBy, sortBy, pendingExtra]);

  const applyPageSize = useCallback(() => {
    const parsed = Number.parseInt(pageSizeInput, 10);
    const safe = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
    setPageSize(safe);
    setPageSizeInput(String(safe));
    setCurrentPage(1);
  }, [pageSizeInput]);

  const onPageChange = useCallback((next) => {
    if (next >= 1 && next <= pagination.totalPages && next !== currentPage) {
      setCurrentPage(next);
    }
  }, [pagination.totalPages, currentPage]);

  return {
    // Server data
    rows, loading, fetchError, pagination,
    // Pagination
    currentPage, pageSize, pageNumbers, onPageChange, recordRangeText,
    // Filter draft
    findBy, sortBy, searchInput, pageSizeInput, validationError,
    // Actions
    setFindBy, setSortBy, setSearchInput, setPageSizeInput,
    setExtraFilters, commitSearch, applyPageSize,
  };
};

export default useTableSearch;
