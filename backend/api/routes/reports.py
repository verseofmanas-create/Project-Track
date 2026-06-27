from flask import Blueprint, jsonify, request
from api.db import get_db_connection
from api.routes.auth import require_auth

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/api/reports', methods=['GET'])
@require_auth(['Admin', 'Site Manager', 'Client'])
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
@require_auth(['Admin', 'Site Manager'])
def create_report():
    data = request.json
    required = ['project_id', 'title', 'type', 'content', 'generated_by', 'date']
    for f in required:
        if not data or f not in data:
            return jsonify({"error": f"Field '{f}' is required"}), 400

    title = data['title'].strip()
    type_str = data['type'].strip()
    content = data['content'].strip()
    generated_by = data['generated_by'].strip()
    date_str = data['date'].strip()

    if not title or not type_str or not content or not generated_by or not date_str:
        return jsonify({"error": "All fields are required and cannot be blank"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM projects WHERE id = %s", (data['project_id'],))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    try:
        cursor.execute('''
            INSERT INTO reports (project_id, title, type, content, generated_by, date, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            data['project_id'],
            title,
            type_str,
            content,
            generated_by,
            date_str,
            data.get('status', 'Published').strip()
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
@require_auth(['Admin'])
def delete_report(report_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM reports WHERE id = %s", (report_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Report not found"}), 404
        cursor.execute("DELETE FROM reports WHERE id = %s", (report_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

