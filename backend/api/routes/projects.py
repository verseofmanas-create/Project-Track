from flask import Blueprint, jsonify, request
from datetime import datetime
from api.db import get_db_connection
from api.routes.auth import require_auth

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/api/projects', methods=['GET'])
@require_auth(['Admin', 'Site Manager', 'Client'])
def get_projects():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Select projects and join calculated expense aggregates
    cursor.execute('''
        SELECT p.*,
               COALESCE(e.total_expenses, 0.0) as total_expenses,
               (p.contract_value - p.amount_received) as outstanding_balance,
               (p.amount_received - COALESCE(e.total_expenses, 0.0)) as profit_loss
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

    projects = []
    for r in rows:
        proj = dict(r)
        # Check alerts
        proj['alerts_count'] = 1 if proj['outstanding_balance'] > (0.3 * proj['contract_value']) else 0
        projects.append(proj)

    return jsonify(projects)

@projects_bp.route('/api/projects', methods=['POST'])
@require_auth(['Admin'])
def create_project():
    data = request.json
    if not data:
        return jsonify({"error": "Missing payload"}), 400

    required = ['name', 'client', 'start_date', 'end_date', 'contract_value']
    for f in required:
        if f not in data:
            return jsonify({"error": f"Field '{f}' is required"}), 400

    name = data['name'].strip()
    client = data['client'].strip()
    start_date = data['start_date'].strip()
    end_date = data['end_date'].strip()

    if not name or not client or not start_date or not end_date:
        return jsonify({"error": "Fields cannot be blank or empty"}), 400

    try:
        contract_val = float(data['contract_value'])
        amount_rec = float(data.get('amount_received', 0.0))
        completion_pct = float(data.get('completion_percentage', 0.0))
    except (ValueError, TypeError):
        return jsonify({"error": "Values for contract_value, amount_received, and completion_percentage must be numeric"}), 400

    if contract_val <= 0:
        return jsonify({"error": "Contract value must be greater than zero"}), 400
    if amount_rec < 0:
        return jsonify({"error": "Amount received cannot be negative"}), 400
    if completion_pct < 0 or completion_pct > 100:
        return jsonify({"error": "Completion percentage must be between 0 and 100"}), 400
    if end_date < start_date:
        return jsonify({"error": "End date cannot be prior to start date"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT INTO projects (name, client, start_date, end_date, completion_percentage, health_status, contract_value, amount_received)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            name,
            client,
            start_date,
            end_date,
            completion_pct,
            data.get('health_status', 'On Track').strip(),
            contract_val,
            amount_rec
        ))

        proj_id = cursor.fetchone()['id']

        # Add a default milestone list for the new project
        default_milestones = [
            (proj_id, "Site Excavation & Laying", start_date, 0),
            (proj_id, "Structure Frame Casting", start_date, 0),
            (proj_id, "Plastering & Masonry", end_date, 0),
            (proj_id, "MEP Installation", end_date, 0),
            (proj_id, "Finishing and Handover", end_date, 0),
        ]
        for m in default_milestones:
            cursor.execute('''
                INSERT INTO milestones (project_id, name, due_date, completed)
                VALUES (%s, %s, %s, %s)
            ''', m)

        # Add an initial system note
        cursor.execute('''
            INSERT INTO notes (project_id, text, timestamp, author)
            VALUES (%s, %s, %s, %s)
        ''', (proj_id, "Project initialized successfully.", datetime.utcnow().isoformat() + "Z", "System"))

        conn.commit()
        conn.close()

        return jsonify({"success": True, "project_id": proj_id}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@projects_bp.route('/api/projects/<int:proj_id>', methods=['GET'])
@require_auth(['Admin', 'Site Manager', 'Client'])
def get_project_detail(proj_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Project Row
    cursor.execute('''
        SELECT p.*,
               COALESCE(e.total_expenses, 0.0) as total_expenses,
               (p.contract_value - p.amount_received) as outstanding_balance,
               (p.amount_received - COALESCE(e.total_expenses, 0.0)) as profit_loss
        FROM projects p
        LEFT JOIN (
            SELECT project_id, SUM(amount) as total_expenses
            FROM expenses
            GROUP BY project_id
        ) e ON p.id = e.project_id
        WHERE p.id = %s
    ''', (proj_id,))

    proj_row = cursor.fetchone()
    if not proj_row:
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    project = dict(proj_row)
    project['alerts_count'] = 1 if project['outstanding_balance'] > (0.3 * project['contract_value']) else 0

    # Resolve user role for dynamic logging details filter
    role = request.environ['current_user']['role']

    # Milestones
    cursor.execute("SELECT * FROM milestones WHERE project_id = %s ORDER BY due_date ASC, id ASC", (proj_id,))
    project['milestones'] = [dict(row) for row in cursor.fetchall()]

    # Notes
    cursor.execute("SELECT * FROM notes WHERE project_id = %s ORDER BY timestamp DESC, id DESC", (proj_id,))
    all_notes = [dict(row) for row in cursor.fetchall()]
    filtered_notes = []
    for note in all_notes:
        text_lower = note['text'].lower()
        author = note['author']
        if role == 'Admin':
            filtered_notes.append(note)
        elif role == 'Site Manager':
            is_financial = (author == 'Financial Engine') or ('payment' in text_lower) or ('expense' in text_lower)
            if not is_financial:
                filtered_notes.append(note)
        else:
            is_internal_expense = (author == 'Financial Engine') and ('expense' in text_lower)
            if not is_internal_expense:
                filtered_notes.append(note)
    project['notes'] = filtered_notes

    # Payments
    cursor.execute("SELECT * FROM payments WHERE project_id = %s ORDER BY date DESC, id DESC", (proj_id,))
    project['payments'] = [dict(row) for row in cursor.fetchall()]

    # Expenses
    cursor.execute("SELECT * FROM expenses WHERE project_id = %s ORDER BY date DESC, id DESC", (proj_id,))
    project['expenses'] = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return jsonify(project)

@projects_bp.route('/api/projects/<int:proj_id>', methods=['PUT'])
@require_auth(['Admin', 'Site Manager'])
def update_project(proj_id):
    data = request.json
    if not data:
        return jsonify({"error": "Missing payload"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = %s", (proj_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    # Perform updates validation
    fields = []
    params = []
    updatable = ['completion_percentage', 'health_status', 'name', 'client', 'start_date', 'end_date', 'contract_value']
    
    start_date = data.get('start_date', existing['start_date']).strip()
    end_date = data.get('end_date', existing['end_date']).strip()

    if end_date < start_date:
        conn.close()
        return jsonify({"error": "End date cannot be prior to start date"}), 400

    for k, v in data.items():
        if k in updatable:
            if k in ['completion_percentage', 'contract_value']:
                try:
                    val = float(v)
                except (ValueError, TypeError):
                    conn.close()
                    return jsonify({"error": f"{k} must be numeric"}), 400
                if k == 'completion_percentage' and (val < 0 or val > 100):
                    conn.close()
                    return jsonify({"error": "Completion percentage must be between 0 and 100"}), 400
                if k == 'contract_value' and val <= 0:
                    conn.close()
                    return jsonify({"error": "Contract value must be greater than zero"}), 400
                fields.append(f"{k} = %s")
                params.append(val)
            else:
                val_str = str(v).strip()
                if k in ['name', 'client', 'start_date', 'end_date'] and not val_str:
                    conn.close()
                    return jsonify({"error": f"{k} cannot be empty"}), 400
                fields.append(f"{k} = %s")
                params.append(val_str)

    if not fields:
        conn.close()
        return jsonify({"error": "No updateable fields provided"}), 400

    params.append(proj_id)
    query = f"UPDATE projects SET {', '.join(fields)} WHERE id = %s"

    try:
        cursor.execute(query, params)
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

@projects_bp.route('/api/projects/<int:proj_id>', methods=['DELETE'])
@require_auth(['Admin'])
def delete_project(proj_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM projects WHERE id = %s", (proj_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Project not found"}), 404
    try:
        cursor.execute("DELETE FROM projects WHERE id = %s", (proj_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@projects_bp.route('/api/projects/<int:proj_id>/milestones', methods=['POST'])
@require_auth(['Admin', 'Site Manager'])
def add_milestone(proj_id):
    data = request.json
    if not data or 'name' not in data or 'due_date' not in data:
        return jsonify({"error": "Fields 'name' and 'due_date' are required"}), 400

    name = data['name'].strip()
    due_date = data['due_date'].strip()

    if not name or not due_date:
        return jsonify({"error": "Milestone name and due date cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM projects WHERE id = %s", (proj_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    try:
        cursor.execute('''
            INSERT INTO milestones (project_id, name, due_date, completed)
            VALUES (%s, %s, %s, 0)
        ''', (proj_id, name, due_date))
        timestamp = datetime.utcnow().isoformat() + "Z"
        cursor.execute('''
            INSERT INTO notes (project_id, text, timestamp, author)
            VALUES (%s, %s, %s, %s)
        ''', (proj_id, f"Added new milestone: {name}. Due: {due_date}.", timestamp, "System"))
        conn.commit()
        conn.close()
        return jsonify({"success": True}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

@projects_bp.route('/api/projects/<int:proj_id>/milestones/<int:milestone_id>', methods=['DELETE'])
@require_auth(['Admin', 'Site Manager'])
def delete_milestone(proj_id, milestone_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name FROM milestones WHERE id = %s AND project_id = %s", (milestone_id, proj_id))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "Milestone not found"}), 404
        cursor.execute("DELETE FROM milestones WHERE id = %s AND project_id = %s", (milestone_id, proj_id))
        timestamp = datetime.utcnow().isoformat() + "Z"
        cursor.execute('''
            INSERT INTO notes (project_id, text, timestamp, author)
            VALUES (%s, %s, %s, %s)
        ''', (proj_id, f"Deleted milestone: {row['name']}.", timestamp, "System"))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

@projects_bp.route('/api/projects/<int:proj_id>/milestones/<int:milestone_id>/toggle', methods=['POST'])
@require_auth(['Admin', 'Site Manager'])
def toggle_milestone(proj_id, milestone_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT completed FROM milestones WHERE id = %s AND project_id = %s", (milestone_id, proj_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Milestone not found"}), 404
    new_status = 1 if row['completed'] == 0 else 0
    cursor.execute("UPDATE milestones SET completed = %s WHERE id = %s", (new_status, milestone_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "completed": new_status})

@projects_bp.route('/api/projects/<int:proj_id>/notes', methods=['POST'])
@require_auth(['Admin', 'Site Manager'])
def add_note(proj_id):
    data = request.json
    if not data or 'text' not in data or 'author' not in data:
        return jsonify({"error": "Fields 'text' and 'author' are required"}), 400
    
    text = data['text'].strip()
    author = data['author'].strip()
    if not text or not author:
        return jsonify({"error": "Note text and author cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM projects WHERE id = %s", (proj_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Project not found"}), 404
    try:
        timestamp = datetime.utcnow().isoformat() + "Z"
        cursor.execute('''
            INSERT INTO notes (project_id, text, timestamp, author)
            VALUES (%s, %s, %s, %s)
        ''', (proj_id, text, timestamp, author))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "timestamp": timestamp}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

@projects_bp.route('/api/projects/<int:proj_id>/notes/<int:note_id>', methods=['DELETE'])
@require_auth(['Admin', 'Site Manager'])
def delete_note(proj_id, note_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM notes WHERE id = %s AND project_id = %s", (note_id, proj_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Note not found"}), 404
        cursor.execute("DELETE FROM notes WHERE id = %s AND project_id = %s", (note_id, proj_id))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

