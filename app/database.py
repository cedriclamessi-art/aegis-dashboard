import sqlite3
import json
import datetime
from contextlib import contextmanager
from app.config import DATABASE_PATH


def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


@contextmanager
def db_session():
    conn = get_db()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with db_session() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS shops (
                user_id TEXT PRIMARY KEY,
                mode TEXT NOT NULL DEFAULT 'coach',
                budget INTEGER NOT NULL DEFAULT 50,
                prix REAL,
                secteur TEXT NOT NULL DEFAULT 'Beauté',
                tracking INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS agent_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                agent_type TEXT NOT NULL,
                input_data TEXT NOT NULL,
                output_data TEXT,
                status TEXT NOT NULL DEFAULT 'running',
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                completed_at TEXT
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                alert_type TEXT NOT NULL,
                message TEXT NOT NULL,
                severity TEXT NOT NULL DEFAULT 'warning',
                data TEXT,
                read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_runs_user ON agent_runs(user_id);
            CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
        """)


def save_agent_run(user_id: str, agent_type: str, input_data: dict) -> int:
    with db_session() as conn:
        cursor = conn.execute(
            "INSERT INTO agent_runs (user_id, agent_type, input_data) VALUES (?, ?, ?)",
            (user_id, agent_type, json.dumps(input_data)),
        )
        return cursor.lastrowid


def complete_agent_run(run_id: int, output_data: dict, status: str = "completed"):
    with db_session() as conn:
        conn.execute(
            "UPDATE agent_runs SET output_data=?, status=?, completed_at=datetime('now') WHERE id=?",
            (json.dumps(output_data), status, run_id),
        )


def get_agent_runs(user_id: str, limit: int = 20) -> list[dict]:
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM agent_runs WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]


def save_alert(user_id: str, alert_type: str, message: str, severity: str = "warning", data: dict = None):
    with db_session() as conn:
        conn.execute(
            "INSERT INTO alerts (user_id, alert_type, message, severity, data) VALUES (?, ?, ?, ?, ?)",
            (user_id, alert_type, message, severity, json.dumps(data) if data else None),
        )


def get_alerts(user_id: str, unread_only: bool = False, limit: int = 50) -> list[dict]:
    with db_session() as conn:
        query = "SELECT * FROM alerts WHERE user_id=?"
        if unread_only:
            query += " AND read=0"
        query += " ORDER BY created_at DESC LIMIT ?"
        rows = conn.execute(query, (user_id, limit)).fetchall()
        return [dict(r) for r in rows]


def save_shop(user_id: str, mode: str, budget: int, prix: float, secteur: str, tracking: bool):
    with db_session() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO shops (user_id, mode, budget, prix, secteur, tracking)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, mode, budget, prix, secteur, int(tracking)),
        )
