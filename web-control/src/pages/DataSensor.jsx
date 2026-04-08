import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import useTableSearch from '../hooks/useTableSearch';
import './DataSensor.css';

// ── Constants ────────────────────────────────────────────────────────────────

const FIND_BY_OPTIONS = [
  { value: 'all',       label: 'All Fields' },
  { value: 'name',      label: 'Sensor Name' },
  { value: 'value',     label: 'Value' },
  { value: 'timestamp', label: 'Timestamp' },
];

const SORT_BY_OPTIONS = [
  { value: 'newest',    label: 'Newest First' },
  { value: 'oldest',    label: 'Oldest First' },
  { value: 'valueAsc',  label: 'Value ↑' },
  { value: 'valueDesc', label: 'Value ↓' },
  { value: 'nameAsc',   label: 'Name A → Z' },
  { value: 'nameDesc',  label: 'Name Z → A' },
];

const SEARCH_PLACEHOLDER = {
  all:       'Tìm kiếm tất cả...',
  name:      'Nhập tên cảm biến...',
  value:     'Nhập giá trị số (vd: 28.5)',
  timestamp: 'Nhập ngày giờ (vd: 2024-01-15)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatValue = (value, unit) => {
  if (value === null || value === undefined) return '--';
  return `${value} ${unit || ''}`.trim();
};

const formatTimestamp = (raw) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const D = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
};

// ── Component ─────────────────────────────────────────────────────────────────

const DataSensor = () => {
  const {
    rows, loading, fetchError,
    currentPage, pageSize, pageNumbers, onPageChange, recordRangeText,
    findBy, sortBy, searchInput, pageSizeInput, validationError,
    setFindBy, setSortBy, setSearchInput, setPageSizeInput,
    setExtraFilters, commitSearch, applyPageSize,
  } = useTableSearch({ endpoint: '/sensor-data', defaultFindBy: 'all', defaultSortBy: 'newest' });

  // ── Unit selector (chỉ hiện khi findBy === 'value') ─────────────────────────
  const [availableUnits, setAvailableUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');

  // Lấy danh sách unit từ /api/sensors một lần khi mount
  useEffect(() => {
    axios.get('http://localhost:3001/api/sensors')
      .then(({ data }) => {
        const units = [...new Set(
          (data || []).map((s) => s.unit).filter(Boolean)
        )];
        setAvailableUnits(units);
      })
      .catch(() => {}); // Lỗi không nghiêm trọng — bỏ qua
  }, []);

  // Khi findBy thay đổi ra khỏi 'value' → reset unit về mặc định
  const handleFindByChange = (value) => {
    setFindBy(value);
    if (value !== 'value') {
      setSelectedUnit('');
      setExtraFilters({});
    }
  };

  const handleUnitChange = (value) => {
    setSelectedUnit(value);
    setExtraFilters(value ? { unit: value } : {});
  };

  // ── Table rows ───────────────────────────────────────────────────────────────
  const displayedRows = useMemo(
    () =>
      rows.map((row, index) => ({
        no: (currentPage - 1) * pageSize + index + 1,
        sensor_name: row.sensor_name,
        value: formatValue(row.value, row.unit),
        created_at: formatTimestamp(row.created_at),
      })),
    [rows, currentPage, pageSize]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitSearch();
  };

  const isValueMode = findBy === 'value';

  return (
    <section className="sensor-page">
      <div className="sensor-shell">

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div className="sensor-filter-card">

          <select
            value={findBy}
            onChange={(e) => handleFindByChange(e.target.value)}
            className="sensor-control"
            aria-label="Tìm theo trường"
          >
            {FIND_BY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="sensor-search-group">
            {/* Input row: [value input] + [unit select khi ở value mode] */}
            <div className={`sensor-search-row${isValueMode ? ' has-unit' : ''}`}>
              <div className="sensor-search-input-wrap">
                <input
                  className={`sensor-control sensor-search${validationError ? ' input-error' : ''}`}
                  placeholder={SEARCH_PLACEHOLDER[findBy]}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Từ khóa tìm kiếm"
                  aria-invalid={!!validationError}
                  aria-describedby={validationError ? 'sensor-search-error' : undefined}
                  maxLength={110}
                />
                {searchInput && (
                  <button
                    type="button"
                    className="sensor-clear-input-btn"
                    onClick={() => setSearchInput('')}
                    aria-label="Xóa từ khóa"
                    title="Xóa"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Unit selector — chỉ hiện khi findBy === 'value' */}
              {isValueMode && (
                <select
                  value={selectedUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="sensor-control sensor-unit-select"
                  aria-label="Chọn đơn vị"
                >
                  <option value="">All units</option>
                  {availableUnits.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              )}
            </div>

            {validationError && (
              <p id="sensor-search-error" className="sensor-validation-error" role="alert">
                {validationError}
              </p>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sensor-control"
            aria-label="Sắp xếp theo"
          >
            {SORT_BY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            type="button"
            className="sensor-search-button"
            onClick={commitSearch}
            disabled={!!validationError}
          >
            Search
          </button>

        </div>

        {/* ── Table card ──────────────────────────────────────────────────── */}
        <div className="sensor-table-card">

          {fetchError && (
            <p className="sensor-state-text sensor-state-error">{fetchError}</p>
          )}

          {!fetchError && loading && (
            <p className="sensor-state-text">Đang tải dữ liệu...</p>
          )}

          {!loading && !fetchError && (
            <>
              <div className="sensor-table-scroll">
                <table className="sensor-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Sensor Name</th>
                      <th>Value</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="sensor-empty">Không có dữ liệu phù hợp</td>
                      </tr>
                    ) : (
                      displayedRows.map((row) => (
                        <tr key={`${row.no}-${row.created_at}`}>
                          <td>{row.no}</td>
                          <td>{row.sensor_name}</td>
                          <td>{row.value}</td>
                          <td>{row.created_at}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination footer ─────────────────────────────────────── */}
              <div className="sensor-pagination-wrap">
                <div className="sensor-pagination-left">
                  <label className="sensor-page-size" htmlFor="sensor-page-size-input">
                    <span>Dòng/trang</span>
                    <input
                      id="sensor-page-size-input"
                      type="number"
                      min={1}
                      max={100}
                      value={pageSizeInput}
                      onChange={(e) => setPageSizeInput(e.target.value)}
                      onBlur={applyPageSize}
                      onKeyDown={(e) => e.key === 'Enter' && applyPageSize()}
                      aria-label="Số dòng mỗi trang"
                    />
                  </label>
                  <span className="sensor-record-range">{recordRangeText}</span>
                </div>

                <div className="sensor-pagination">
                  <button
                    type="button"
                    className="sensor-page-btn nav"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Trang trước"
                  >
                    ‹
                  </button>

                  {pageNumbers.map((p) => (
                    <button
                      type="button"
                      key={p}
                      className={`sensor-page-btn${p === currentPage ? ' active' : ''}`}
                      onClick={() => onPageChange(p)}
                      aria-current={p === currentPage ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="sensor-page-btn nav"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= (pageNumbers[pageNumbers.length - 1] || 1)}
                    aria-label="Trang sau"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </section>
  );
};

export default DataSensor;
