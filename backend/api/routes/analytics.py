# pyrefly: ignore [missing-import]
from flask import Blueprint, jsonify
from datetime import datetime
from api.db import get_db_connection

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM projects")
    active_projects = cursor.fetchone()['count']

    cursor.execute("SELECT SUM(contract_value) as val, SUM(amount_received) as received FROM projects")
    totals = cursor.fetchone()
    contract_value = totals['val'] or 0.0
    amount_received = totals['received'] or 0.0
    outstanding = contract_value - amount_received

    cursor.execute("SELECT id, contract_value, amount_received FROM projects")
    alerts = 0
    for row in cursor.fetchall():
        out = row['contract_value'] - row['amount_received']
        if out > (0.3 * row['contract_value']):
            alerts += 1

    cursor.execute("SELECT COUNT(*) as count FROM reports")
    reports_count = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM issues")
    issues_count = cursor.fetchone()['count']

    conn.close()

    return jsonify({
        "total_active_projects": active_projects,
        "total_contract_value": float(contract_value),
        "total_outstanding_dues": float(outstanding),
        "total_active_alerts": alerts,
        "total_reports_count": reports_count,
        "total_issues_count": issues_count
    })

@analytics_bp.route('/api/analytics/pnl', methods=['GET'])
def get_pnl():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT p.id, p.name, p.client, p.contract_value, p.amount_received,
               COALESCE(e.total_expenses, 0.0) as total_expenses
        FROM projects p
        LEFT JOIN (
            SELECT project_id, SUM(amount) as total_expenses
            FROM expenses
            GROUP BY project_id
        ) e ON p.id = e.project_id
        ORDER BY p.id ASC
    ''')

    rows = cursor.fetchall()
    conn.close()

    pnl_list = []
    for row in rows:
        proj = dict(row)
        proj['net_profit'] = float(proj['amount_received']) - float(proj['total_expenses'])
        proj['profit_margin'] = (proj['net_profit'] / float(proj['amount_received']) * 100) if float(proj['amount_received']) > 0 else 0.0
        pnl_list.append(proj)

    return jsonify(pnl_list)

@analytics_bp.route('/api/analytics/revenue-summary', methods=['GET'])
def get_revenue_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT TO_CHAR(date::date, 'YYYY-MM') as month_key, SUM(amount) as total
        FROM payments
        GROUP BY month_key
        ORDER BY month_key ASC
        LIMIT 12
    ''')

    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        key = row['month_key']
        try:
            dt = datetime.strptime(key, '%Y-%m')
            label = dt.strftime('%b %y')
        except:
            label = key
        result.append({
            "month": label,
            "revenue": float(row['total'])
        })

    return jsonify(result)
