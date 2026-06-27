from flask import Blueprint, jsonify, request
from api.db import get_db_connection
from api.routes.auth import require_auth

issues_bp = Blueprint('issues', __name__)

@issues_bp.route('/api/issues', methods=['GET'])
@require_auth(['Admin', 'Site Manager', 'Client'])
def get_issues():
    project_id = request.args.get('project_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    if project_id:
        cursor.execute('''
            SELECT i.*, p.name as project_name
            FROM issues i
            JOIN projects p ON i.project_id = p.id
            WHERE i.project_id = %s
            ORDER BY i.date_reported DESC, i.id DESC
        ''', (project_id,))
    else:
        cursor.execute('''
            SELECT i.*, p.name as project_name
            FROM issues i
            JOIN projects p ON i.project_id = p.id
            ORDER BY i.date_reported DESC, i.id DESC
        ''')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@issues_bp.route('/api/issues', methods=['POST'])
@require_auth(['Admin', 'Site Manager'])
def create_issue():
    data = request.json
    required = ['project_id', 'title', 'description', 'severity', 'reported_by', 'assigned_to', 'date_reported']
    for f in required:
        if not data or f not in data:
            return jsonify({"error": f"Field '{f}' is required"}), 400

    title = data['title'].strip()
    description = data['description'].strip()
    severity = data['severity'].strip()
    reported_by = data['reported_by'].strip()
    assigned_to = data['assigned_to'].strip()
    date_reported = data['date_reported'].strip()

    if not title or not description or not severity or not reported_by or not assigned_to or not date_reported:
        return jsonify({"error": "All fields are required and cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM projects WHERE id = %s", (data['project_id'],))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    try:
        cursor.execute('''
            INSERT INTO issues (project_id, title, description, severity, status, reported_by, assigned_to, date_reported, date_resolved)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            data['project_id'],
            title,
            description,
            severity,
            data.get('status', 'Open').strip(),
            reported_by,
            assigned_to,
            date_reported,
            data.get('date_resolved')
        ))
        issue_id = cursor.fetchone()['id']
        conn.commit()
        conn.close()
        return jsonify({"success": True, "id": issue_id}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

@issues_bp.route('/api/issues/<int:issue_id>', methods=['PUT'])
@require_auth(['Admin', 'Site Manager'])
def update_issue(issue_id):
    data = request.json
    if not data:
        return jsonify({"error": "Missing payload"}), 400
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM issues WHERE id = %s", (issue_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Issue not found"}), 404

    fields = []
    params = []
    updatable = ['status', 'assigned_to', 'severity', 'date_resolved']
    for k, v in data.items():
        if k in updatable:
            val_str = str(v).strip() if v is not None else None
            if k in ['status', 'assigned_to', 'severity'] and not val_str:
                conn.close()
                return jsonify({"error": f"{k} cannot be empty"}), 400
            fields.append(f"{k} = %s")
            params.append(val_str)
            
    if not fields:
        conn.close()
        return jsonify({"error": "No updateable fields provided"}), 400
    params.append(issue_id)
    query = f"UPDATE issues SET {', '.join(fields)} WHERE id = %s"
    try:
        cursor.execute(query, params)
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

@issues_bp.route('/api/issues/<int:issue_id>', methods=['DELETE'])
@require_auth(['Admin'])
def delete_issue(issue_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM issues WHERE id = %s", (issue_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Issue not found"}), 404
        cursor.execute("DELETE FROM issues WHERE id = %s", (issue_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

