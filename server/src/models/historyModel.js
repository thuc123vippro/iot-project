const db = require('../config/db');

const HistoryModel = {
    create: async (deviceId, action, status) => {
        const [result] = await db.query(
            'INSERT INTO action_history (device_id, action, status) VALUES (?, ?, ?)',
            [deviceId, action, status]
        );
        return result.insertId;
    },
    updateStatus: async (historyId, status) => {
        await db.query(
            'UPDATE action_history SET status = ? WHERE id = ?',
            [status, historyId]
        );
    },
    getPaginated: async ({ page = 1, limit = 20, findBy = 'all', search = '', sortBy = 'newest' }) => {
        const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
        const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(1, limit), 100) : 20;
        const offset = (safePage - 1) * safeLimit;

        const normalizedSearch = (search || '').trim();
        const params = [];
        let whereClause = '';

        if (normalizedSearch) {
            const likeValue = `%${normalizedSearch}%`;

            if (findBy === 'name') {
                whereClause = 'WHERE d.name LIKE ?';
                params.push(likeValue);
            } else if (findBy === 'action') {
                whereClause = 'WHERE ah.action LIKE ?';
                params.push(likeValue);
            } else if (findBy === 'status') {
                whereClause = 'WHERE ah.status LIKE ?';
                params.push(likeValue);
            } else if (findBy === 'timestamp') {
                whereClause = "WHERE DATE_FORMAT(ah.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?";
                params.push(likeValue);
            } else {
                whereClause = `
                    WHERE (
                        d.name LIKE ?
                        OR ah.action LIKE ?
                        OR ah.status LIKE ?
                        OR DATE_FORMAT(ah.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?
                    )
                `;
                params.push(likeValue, likeValue, likeValue, likeValue);
            }
        }

        const sortMap = {
            newest: 'ah.created_at DESC',
            oldest: 'ah.created_at ASC',
            nameAsc: 'd.name ASC',
            nameDesc: 'd.name DESC',
            actionAsc: 'ah.action ASC',
            actionDesc: 'ah.action DESC',
            statusAsc: 'ah.status ASC',
            statusDesc: 'ah.status DESC'
        };
        const orderByClause = sortMap[sortBy] || sortMap.newest;

        const baseFrom = `
            FROM action_history ah
            INNER JOIN devices d ON d.device_id = ah.device_id
            ${whereClause}
        `;

        const countQuery = `SELECT COUNT(*) AS total ${baseFrom}`;
        const [countRows] = await db.query(countQuery, params);
        const total = countRows[0]?.total || 0;

        const dataQuery = `
            SELECT
                ah.id,
                ah.device_id,
                d.name AS device_name,
                ah.action,
                ah.status,
                ah.created_at
            ${baseFrom}
            ORDER BY ${orderByClause}
            LIMIT ? OFFSET ?
        `;

        const [rows] = await db.query(dataQuery, [...params, safeLimit, offset]);

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

module.exports = HistoryModel;