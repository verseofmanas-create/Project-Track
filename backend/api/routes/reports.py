from flask import Blueprint, jsonify, request
from api.db import get_db_connection

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/api/reports', methods=['GET'])
def get_reports():
    project_id = request.args.get('project_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    if project_id:
        cursor.execute('''
            SELECT r.*, p.name as project_name
            FROM reports r
            JOIN projects p ON r.project_id = p.id
            WHERE r.project_id = %s
            ORDER BY r.date DESC, r.id DESC
        ''', (project_id,))
    else:
        cursor.execute('''
            SELECT r.*, p.name as project_name
            FROM reports r
            JOIN projects p ON r.project_id = p.id
            ORDER BY r.date DESC, r.id DESC
        ''')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@reports_bp.route('/api/reports', methods=['POST'])
def create_report():
    data = request.json
    required = ['project_id', 'title', 'type', 'content', 'generated_by', 'date']
    for f in required:
        if not data or f not in data:
            return jsonify({"error": f"Field '{f}' is required"}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO reports (project_id, title, type, content, generated_by, date, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            data['project_id'],
            data['title'],
            data['type'],
            data['content'],
            data['generated_by'],
            data['date'],
            data.get('status', 'Published')
        ))
        report_id = cursor.fetchone()['id']
        conn.commit()
        conn.close()
        return jsonify({"success": True, "id": report_id}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

@reports_bp.route('/api/reports/<int:report_id>', methods=['DELETE'])
def delete_report(report_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM reports WHERE id = %s", (report_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500
