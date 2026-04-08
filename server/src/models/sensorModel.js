const db = require('../config/db');

const SensorModel = {
    getAll: async () => {
        const sql = `
            SELECT
                s.sensor_id,
                s.name,
                s.type,
                s.unit,
                (
                    SELECT sd.value
                    FROM sensor_data sd
                    WHERE sd.sensor_id = s.sensor_id
                    ORDER BY sd.created_at DESC
                    LIMIT 1
                ) AS lastest_value
            FROM sensors s
        `;
        const [rows] = await db.query(sql);
        return rows;
    },

    saveHistory: async (sensorId, value) => {
        const query = "INSERT INTO sensor_data (sensor_id, value, created_at) VALUES (?, ?, NOW())";
        return await db.query(query, [sensorId, value]);
    },

    getSensorDataPaginated: async ({ page = 1, limit = 10, findBy = 'all', search = '', sortBy = 'newest', unit = '' }) => {
        const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
        const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(1, limit), 100) : 10;
        const offset = (safePage - 1) * safeLimit;

        const normalizedSearch = (search || '').trim();
        const normalizedUnit = (unit || '').trim();

        // ── Xây WHERE clause theo từng điều kiện ────────────────────────────
        const conditions = [];
        const params = [];

        // 1. Điều kiện tìm kiếm text
        if (normalizedSearch) {
            const likeValue = `%${normalizedSearch}%`;

            if (findBy === 'name') {
                conditions.push('s.name LIKE ?');
                params.push(likeValue);
            } else if (findBy === 'value') {
                // Dùng so sánh số học thay vì LIKE để tránh match sai (vd: "34" khớp 334, 434)
                // Chuẩn hóa: cho phép dấu phẩy thay thế dấu chấm (34,5 → 34.5)
                const normalizedNum = normalizedSearch.replace(',', '.');
                const numericValue = parseFloat(normalizedNum);

                if (isNaN(numericValue)) {
                    // Chuỗi không phải số hợp lệ → không trả về kết quả nào
                    conditions.push('1 = 0');
                } else if (normalizedNum.includes('.')) {
                    // Có phần thập phân → khớp chính xác đến số chữ số sau dấu chấm
                    const decimalPlaces = (normalizedNum.split('.')[1] || '').length;
                    conditions.push('ROUND(sd.value, ?) = ?');
                    params.push(decimalPlaces, numericValue);
                } else {
                    // Chỉ phần nguyên → khớp tất cả giá trị có phần nguyên = số đó
                    conditions.push('FLOOR(sd.value) = ?');
                    params.push(Math.floor(numericValue));
                }
            } else if (findBy === 'timestamp') {
                conditions.push("DATE_FORMAT(sd.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?");
                params.push(likeValue);
            } else {
                // findBy === 'all'
                conditions.push(`(
                    s.name LIKE ?
                    OR CAST(sd.value AS CHAR) LIKE ?
                    OR DATE_FORMAT(sd.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?
                )`);
                params.push(likeValue, likeValue, likeValue);
            }
        }

        // 2. Điều kiện lọc theo unit (chỉ áp dụng khi có chọn unit cụ thể)
        if (normalizedUnit) {
            conditions.push('s.unit = ?');
            params.push(normalizedUnit);
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // ── Sort ─────────────────────────────────────────────────────────────
        const sortMap = {
            newest:    'sd.created_at DESC',
            oldest:    'sd.created_at ASC',
            valueAsc:  'sd.value ASC',
            valueDesc: 'sd.value DESC',
            nameAsc:   's.name ASC',
            nameDesc:  's.name DESC'
        };
        const orderByClause = sortMap[sortBy] || sortMap.newest;

        // ── Query ─────────────────────────────────────────────────────────────
        const baseFrom = `
            FROM sensor_data sd
            INNER JOIN sensors s ON s.sensor_id = sd.sensor_id
            ${whereClause}
        `;

        const [countRows] = await db.query(`SELECT COUNT(*) AS total ${baseFrom}`, params);
        const total = countRows[0]?.total || 0;

        const [rows] = await db.query(`
            SELECT
                sd.sensor_id,
                s.name AS sensor_name,
                sd.value,
                s.unit,
                sd.created_at
            ${baseFrom}
            ORDER BY ${orderByClause}
            LIMIT ? OFFSET ?
        `, [...params, safeLimit, offset]);

        return {
            data: rows,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: total > 0 ? Math.ceil(total / safeLimit) : 1
            }
        };
    }
};

module.exports = SensorModel;
