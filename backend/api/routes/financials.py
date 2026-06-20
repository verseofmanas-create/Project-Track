from flask import Blueprint, jsonify, request
from datetime import datetime
from api.db import get_db_connection

financials_bp = Blueprint('financials', __name__)

@financials_bp.route('/api/projects/<int:proj_id>/payments', methods=['POST'])
def add_payment(proj_id):
    data = request.json
    required = ['amount', 'payment_mode', 'reference_id']
    for f in required:
        if not data or f not in data:
            return jsonify({"error": f"Field '{f}' is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT amount_received FROM projects WHERE id = %s", (proj_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    old_received = row['amount_received']
    pay_amount = float(data['amount'])
    pay_date = data.get('date', datetime.utcnow().strftime('%Y-%m-%d'))

    try:
        cursor.execute('''
            INSERT INTO payments (project_id, date, amount, payment_mode, reference_id)
            VALUES (%s, %s, %s, %s, %s)
        ''', (proj_id, pay_date, pay_amount, data['payment_mode'], data['reference_id']))

        new_received = old_received + pay_amount
        cursor.execute("UPDATE projects SET amount_received = %s WHERE id = %s", (new_received, proj_id))

        note_text = f"Recorded payment of ₹{pay_amount:,.2f} via {data['payment_mode']}. Ref: {data['reference_id']}."
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
def add_expense(proj_id):
    data = request.json
    required = ['amount', 'category', 'description']
    for f in required:
        if not data or f not in data:
            return jsonify({"error": f"Field '{f}' is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM projects WHERE id = %s", (proj_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    exp_amount = float(data['amount'])
    exp_date = data.get('date', datetime.utcnow().strftime('%Y-%m-%d'))

    try:
        cursor.execute('''
            INSERT INTO expenses (project_id, category, amount, date, description)
            VALUES (%s, %s, %s, %s, %s)
        ''', (proj_id, data['category'], exp_amount, exp_date, data['description']))

        note_text = f"Logged expense of ₹{exp_amount:,.2f} under {data['category']}: {data['description']}."
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
