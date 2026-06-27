from flask import Blueprint, jsonify, request
from datetime import datetime
from api.db import get_db_connection
from api.routes.auth import require_auth

financials_bp = Blueprint('financials', __name__)

@financials_bp.route('/api/projects/<int:proj_id>/payments', methods=['POST'])
@require_auth(['Admin'])
def add_payment(proj_id):
    data = request.json
    required = ['amount', 'payment_mode', 'reference_id']
    for f in required:
        if not data or f not in data:
            return jsonify({"error": f"Field '{f}' is required"}), 400

    try:
        pay_amount = float(data['amount'])
    except (ValueError, TypeError):
        return jsonify({"error": "Amount must be a valid number"}), 400

    if pay_amount <= 0:
        return jsonify({"error": "Payment amount must be greater than zero"}), 400

    reference_id = data['reference_id'].strip()
    if not reference_id:
        return jsonify({"error": "Reference ID cannot be empty"}), 400

    payment_mode = data['payment_mode'].strip()
    if payment_mode not in ['Online', 'Cheque', 'Cash']:
        return jsonify({"error": "Invalid payment mode"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT amount_received FROM projects WHERE id = %s", (proj_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    old_received = row['amount_received']
    pay_date = data.get('date', datetime.utcnow().strftime('%Y-%m-%d')).strip()

    try:
        cursor.execute('''
            INSERT INTO payments (project_id, date, amount, payment_mode, reference_id)
            VALUES (%s, %s, %s, %s, %s)
        ''', (proj_id, pay_date, pay_amount, payment_mode, reference_id))

        new_received = old_received + pay_amount
        cursor.execute("UPDATE projects SET amount_received = %s WHERE id = %s", (new_received, proj_id))

        note_text = f"Recorded payment of ₹{pay_amount:,.2f} via {payment_mode}. Ref: {reference_id}."
        timestamp = datetime.utcnow().isoformat() + "Z"
        cursor.execute('''
            INSERT INTO notes (project_id, text, timestamp, author)
            VALUES (%s, %s, %s, %s)
        ''', (proj_id, note_text, timestamp, "Financial Engine"))

        conn.commit()
        conn.close()
        return jsonify({"success": True, "new_received": new_received}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

@financials_bp.route('/api/projects/<int:proj_id>/expenses', methods=['POST'])
@require_auth(['Admin'])
def add_expense(proj_id):
    data = request.json
    required = ['amount', 'category', 'description']
    for f in required:
        if not data or f not in data:
            return jsonify({"error": f"Field '{f}' is required"}), 400

    try:
        exp_amount = float(data['amount'])
    except (ValueError, TypeError):
        return jsonify({"error": "Amount must be a valid number"}), 400

    if exp_amount <= 0:
        return jsonify({"error": "Expense amount must be greater than zero"}), 400

    category = data['category'].strip()
    if category not in ['Labour', 'Materials', 'Machinery', 'Subcontractor', 'Miscellaneous']:
        return jsonify({"error": "Invalid category"}), 400

    description = data['description'].strip()
    if not description:
        return jsonify({"error": "Description cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM projects WHERE id = %s", (proj_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    exp_date = data.get('date', datetime.utcnow().strftime('%Y-%m-%d')).strip()

    try:
        cursor.execute('''
            INSERT INTO expenses (project_id, category, amount, date, description)
            VALUES (%s, %s, %s, %s, %s)
        ''', (proj_id, category, exp_amount, exp_date, description))

        note_text = f"Logged expense of ₹{exp_amount:,.2f} under {category}: {description}."
        timestamp = datetime.utcnow().isoformat() + "Z"
        cursor.execute('''
            INSERT INTO notes (project_id, text, timestamp, author)
            VALUES (%s, %s, %s, %s)
        ''', (proj_id, note_text, timestamp, "Financial Engine"))

        conn.commit()
        conn.close()
        return jsonify({"success": True}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

@financials_bp.route('/api/projects/<int:proj_id>/expenses/<int:expense_id>', methods=['DELETE'])
@require_auth(['Admin'])
def delete_expense(proj_id, expense_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT amount, category, description FROM expenses WHERE id = %s AND project_id = %s", (expense_id, proj_id))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "Expense not found"}), 404

        amount = row['amount']
        category = row['category']
        description = row['description']

        cursor.execute("DELETE FROM expenses WHERE id = %s AND project_id = %s", (expense_id, proj_id))

        note_text = f"Deleted logged expense of ₹{amount:,.2f} under {category}: {description}."
        timestamp = datetime.utcnow().isoformat() + "Z"
        cursor.execute('''
            INSERT INTO notes (project_id, text, timestamp, author)
            VALUES (%s, %s, %s, %s)
        ''', (proj_id, note_text, timestamp, "Financial Engine"))

        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

