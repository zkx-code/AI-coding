"""
数据库操作模块
负责 SQLite 数据库的初始化、增删查统
"""
import sqlite3
import os

from config import DB_PATH

# 模块级连接对象（单例模式）
_conn: sqlite3.Connection | None = None


def _get_conn() -> sqlite3.Connection:
    """获取数据库连接，每次调用都创建新连接，线程安全"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # 让查询结果可以用列名访问
    conn.execute("PRAGMA journal_mode=WAL")  # 提高并发性能
    return conn


def init_db():
    """初始化数据库，创建 transactions 表（如果不存在）"""
    conn = _get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT DEFAULT ''
        )
    """)
    conn.commit()
    conn.close()


def add(amount: float, category: str, date: str, notes: str):
    """添加一条账目"""
    conn = _get_conn()
    conn.execute(
        "INSERT INTO transactions (amount, category, date, notes) VALUES (?, ?, ?, ?)",
        (amount, category, date, notes),
    )
    conn.commit()
    conn.close()


def get_all(year_month: str = "", categories: list[str] | None = None) -> list[dict]:
    """
    查询账目列表
    - year_month: YYYY-MM 格式的月份筛选，空字符串表示不筛选
    - categories: 分类列表筛选，None 或空列表表示不筛选
    """
    conn = _get_conn()
    query = "SELECT * FROM transactions WHERE 1=1"
    params: list = []

    if year_month:
        query += " AND strftime('%Y-%m', date) = ?"
        params.append(year_month)

    if categories:
        placeholders = ",".join(["?"] * len(categories))
        query += f" AND category IN ({placeholders})"
        params.extend(categories)

    query += " ORDER BY date DESC, id DESC"
    cursor = conn.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_by_id(transaction_id: int) -> dict | None:
    """按 ID 查询单条记录"""
    conn = _get_conn()
    cursor = conn.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def delete(transaction_id: int) -> bool:
    """按 ID 删除账目，返回是否删除成功"""
    conn = _get_conn()
    cursor = conn.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def get_available_months() -> list[str]:
    """获取数据库中所有有记录的月份（YYYY-MM 格式），降序排列"""
    conn = _get_conn()
    cursor = conn.execute(
        "SELECT DISTINCT strftime('%Y-%m', date) AS month FROM transactions ORDER BY month DESC"
    )
    rows = cursor.fetchall()
    conn.close()
    return [row["month"] for row in rows]


def get_stats(year_month: str = "") -> list[dict]:
    """
    分类统计
    - year_month: 可选月份筛选
    返回每类的汇总数据：category, total（总金额）, count（笔数）
    """
    conn = _get_conn()
    query = """
        SELECT category, SUM(amount) AS total, COUNT(*) AS count
        FROM transactions
        WHERE 1=1
    """
    params: list = []

    if year_month:
        query += " AND strftime('%Y-%m', date) = ?"
        params.append(year_month)

    query += " GROUP BY category ORDER BY total DESC"
    cursor = conn.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]
