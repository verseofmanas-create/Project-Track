from flask import Blueprint, jsonify, request
from api.db import get_db_connection
from api.routes.auth import hash_pw

users_bp = Blueprint('users', __name__)

@users_bp.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, full_name, role, location FROM users ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@users_bp.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    required = ['username', 'password', 'full_name', 'role']
    for f in required:
        if not data or f not in data:
            return jsonify({"error": f"Field '{f}' is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if username exists
    cursor.execute("SELECT id FROM users WHERE username = %s", (data['username'],))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "Username already exists"}), 400

    try:
        cursor.execute('''
            INSERT INTO users (username, password_hash, full_name, role, location)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            data['username'],
            hash_pw(data['password']),
            data['full_name'],
            data['role'],
            data.get('location', '')
        ))
        user_id = cursor.fetchone()['id']
        conn.commit()
        conn.close()
        return jsonify({"success": True, "id": user_id}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

@users_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Don't delete the default Admin user to prevent lockout
        cursor.execute("SELECT username, role FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({"error": "User not found"}), 404
            
        if user['role'] == 'Admin' and user['username'] == 'admin':
            conn.close()
            return jsonify({"error": "Cannot delete the default Admin account"}), 400

        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500
