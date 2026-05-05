/**
 * Manual mock for expo-sqlite that backs storage with an in-memory JS object store.
 * Parses the subset of SQL used by EventRepository and database.ts migration.
 */

'use strict';

// ── tiny SQL interpreter ────────────────────────────────────────────────────

/**
 * Parse named parameters (?-style positional) and interpolate into a
 * plain JS value array for matching.
 */
function applyParams(sql, params) {
  const p = Array.isArray(params) ? [...params] : [];
  return sql.replace(/\?/g, () => {
    const v = p.shift();
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
  });
}

/** Very small WHERE evaluator for the patterns we actually use. */
function evaluateWhere(row, whereClause) {
  if (!whereClause) return true;

  // Handle compound: "a AND b"
  const andParts = whereClause.split(/\bAND\b/i);
  return andParts.every(part => evaluateSingleCondition(row, part.trim()));
}

function sqlValueToJs(raw) {
  if (raw === 'NULL' || raw === undefined) return null;
  if (/^'(.*)'$/s.test(raw)) return raw.slice(1, -1).replace(/''/g, "'");
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function evaluateSingleCondition(row, cond) {
  // col IS NULL
  let m = cond.match(/^(\w+)\s+IS\s+NULL$/i);
  if (m) return row[m[1]] == null;

  // col IS NOT NULL
  m = cond.match(/^(\w+)\s+IS\s+NOT\s+NULL$/i);
  if (m) return row[m[1]] != null;

  // col = value
  m = cond.match(/^(\w+)\s*=\s*(.+)$/i);
  if (m) {
    const col = m[1];
    const val = sqlValueToJs(m[2].trim());
    return row[col] === val;
  }

  // col != value  /  col <> value
  m = cond.match(/^(\w+)\s*(?:!=|<>)\s*(.+)$/i);
  if (m) {
    const col = m[1];
    const val = sqlValueToJs(m[2].trim());
    return row[col] !== val;
  }

  return true; // unknown condition — pass through
}

/** Parse ORDER BY col ASC/DESC */
function applyOrderBy(rows, orderByClause) {
  if (!orderByClause) return rows;
  const m = orderByClause.match(/(\w+)\s*(ASC|DESC)?/i);
  if (!m) return rows;
  const col = m[1];
  const dir = (m[2] || 'ASC').toUpperCase();
  return [...rows].sort((a, b) => {
    if (a[col] < b[col]) return dir === 'ASC' ? -1 : 1;
    if (a[col] > b[col]) return dir === 'ASC' ? 1 : -1;
    return 0;
  });
}

// ── In-memory database class ────────────────────────────────────────────────

class InMemoryDatabase {
  constructor() {
    /** @type {Map<string, Map<string, any[]>>} dbName -> tableName -> rows[] */
    this._tables = new Map();
  }

  _getTable(name) {
    if (!this._tables.has(name)) this._tables.set(name, []);
    return this._tables.get(name);
  }

  // ── execAsync: run DDL / multi-statement script ──────────────────────────
  async execAsync(sql) {
    // Split on semicolons (crude but sufficient for our schema)
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      this._execStatement(stmt);
    }
  }

  _execStatement(stmt) {
    // PRAGMA — ignore
    if (/^\s*PRAGMA/i.test(stmt)) return;

    // CREATE TABLE IF NOT EXISTS <name> (...)
    let m = stmt.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(/is);
    if (m) {
      const tableName = m[1];
      if (!this._tables.has(tableName)) this._tables.set(tableName, []);
      return;
    }

    // INSERT OR IGNORE INTO <table> (cols) VALUES (vals)
    m = stmt.match(/INSERT OR IGNORE INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/is);
    if (m) {
      const table = m[1];
      const cols = m[2].split(',').map(c => c.trim());
      const rawVals = m[3].split(',').map(v => v.trim());
      const rows = this._getTable(table);
      const pkCol = cols[0];
      const pkVal = sqlValueToJs(rawVals[0]);
      // OR IGNORE: skip if PK exists
      if (rows.some(r => r[pkCol] === pkVal)) return;
      const row = {};
      cols.forEach((c, i) => { row[c] = sqlValueToJs(rawVals[i]); });
      rows.push(row);
      return;
    }

    // INSERT INTO <table> (...) VALUES (...)
    m = stmt.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/is);
    if (m) {
      const table = m[1];
      const cols = m[2].split(',').map(c => c.trim());
      const rawVals = m[3].split(',').map(v => v.trim());
      const row = {};
      cols.forEach((c, i) => { row[c] = sqlValueToJs(rawVals[i]); });
      this._getTable(table).push(row);
      return;
    }
  }

  // ── runAsync: INSERT / UPDATE ────────────────────────────────────────────
  async runAsync(sql, params = []) {
    const interpolated = applyParams(sql, params);
    this._execRunStatement(interpolated);
  }

  _execRunStatement(stmt) {
    stmt = stmt.trim();

    // INSERT INTO <table> (cols) VALUES (vals)
    let m = stmt.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/is);
    if (m) {
      const table = m[1];
      const cols = m[2].split(',').map(c => c.trim());
      const rawVals = splitSqlValues(m[3]);
      const row = {};
      cols.forEach((c, i) => { row[c] = sqlValueToJs(rawVals[i]); });
      this._getTable(table).push(row);
      return;
    }

    // INSERT OR REPLACE INTO <table> (cols) VALUES (vals)
    m = stmt.match(/INSERT OR REPLACE INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/is);
    if (m) {
      const table = m[1];
      const cols = m[2].split(',').map(c => c.trim());
      const rawVals = splitSqlValues(m[3]);
      const pkCol = cols[0];
      const pkVal = sqlValueToJs(rawVals[0]);
      const rows = this._getTable(table);
      const idx = rows.findIndex(r => r[pkCol] === pkVal);
      const row = {};
      cols.forEach((c, i) => { row[c] = sqlValueToJs(rawVals[i]); });
      if (idx >= 0) rows[idx] = row; else rows.push(row);
      return;
    }

    // UPDATE <table> SET col=val, ... WHERE col=val
    m = stmt.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)$/is);
    if (m) {
      const table = m[1];
      const setPart = m[2];
      const wherePart = m[3];
      const rows = this._getTable(table);
      const updates = parseSetClause(setPart);
      rows.forEach((row, idx) => {
        if (evaluateWhere(row, wherePart)) {
          rows[idx] = { ...row, ...updates };
        }
      });
      return;
    }
  }

  // ── getAllAsync: SELECT ───────────────────────────────────────────────────
  async getAllAsync(sql, params = []) {
    const interpolated = applyParams(sql, params);
    return this._execSelect(interpolated);
  }

  // ── getFirstAsync: SELECT (first row) ───────────────────────────────────
  async getFirstAsync(sql, params = []) {
    const interpolated = applyParams(sql, params);
    const results = this._execSelect(interpolated);
    return results.length > 0 ? results[0] : null;
  }

  _execSelect(stmt) {
    stmt = stmt.trim();

    // SELECT COUNT(*) as count FROM <table> WHERE ...
    let m = stmt.match(/SELECT\s+COUNT\(\*\)\s+as\s+(\w+)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+.+)?$/is);
    if (m) {
      const alias = m[1];
      const table = m[2];
      const wherePart = m[3] || null;
      const rows = this._getTable(table);
      const count = rows.filter(r => evaluateWhere(r, wherePart)).length;
      return [{ [alias]: count }];
    }

    // SELECT * FROM <table> [WHERE ...] [ORDER BY ...]
    m = stmt.match(/SELECT\s+\*\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+))?$/is);
    if (m) {
      const table = m[1];
      const wherePart = m[2] ? m[2].trim() : null;
      const orderByPart = m[3] ? m[3].trim() : null;
      let rows = this._getTable(table).filter(r => evaluateWhere(r, wherePart));
      if (orderByPart) rows = applyOrderBy(rows, orderByPart);
      // Return copies so tests don't mutate internal state
      return rows.map(r => ({ ...r }));
    }

    // SELECT value FROM <table> WHERE ...
    m = stmt.match(/SELECT\s+(\w+)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?$/is);
    if (m) {
      const col = m[1];
      const table = m[2];
      const wherePart = m[3] ? m[3].trim() : null;
      const rows = this._getTable(table).filter(r => evaluateWhere(r, wherePart));
      return rows.map(r => ({ [col]: r[col] }));
    }

    return [];
  }
}

// ── SQL parsing helpers ─────────────────────────────────────────────────────

/**
 * Split a SQL VALUES list respecting quoted strings.
 * e.g. "'foo','bar baz'" -> ["'foo'", "'bar baz'"]
 */
function splitSqlValues(raw) {
  const results = [];
  let current = '';
  let inString = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "'" && !inString) { inString = true; current += ch; }
    else if (ch === "'" && inString) {
      current += ch;
      // Handle escaped quote ''
      if (raw[i + 1] === "'") { i++; current += "'"; }
      else inString = false;
    } else if (ch === ',' && !inString) {
      results.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) results.push(current.trim());
  return results;
}

/**
 * Parse "col1=val1, col2=val2" into { col1: val1, col2: val2 }
 */
function parseSetClause(setPart) {
  const updates = {};
  // Split on ", col=" boundaries
  const parts = setPart.split(/,\s*(?=\w+=)/);
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const col = part.slice(0, eqIdx).trim();
    const val = sqlValueToJs(part.slice(eqIdx + 1).trim());
    updates[col] = val;
  }
  return updates;
}

// ── Module exports ──────────────────────────────────────────────────────────

const openDatabaseAsync = jest.fn(async (_name) => {
  return new InMemoryDatabase();
});

module.exports = {
  openDatabaseAsync,
};
