from flask import Blueprint, jsonify, request
import hashlib
from api.db import get_db_connection

auth_bp = Blueprint('auth', __name__)

def hash_pw(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

from functools import wraps

def require_auth(allowed_roles=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"error": "Missing or invalid authorization token"}), 401
            
            token = auth_header.split(' ')[1]
            if not token.startswith('mock-token-'):
                return jsonify({"error": "Invalid authorization token"}), 401
            
            username = token.replace('mock-token-', '')
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, username, full_name, role, location FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            conn.close()
            
            if not user:
                return jsonify({"error": "Unauthorized"}), 401
            
            if allowed_roles and user['role'] not in allowed_roles:
                return jsonify({"error": f"Forbidden: Access restricted to {allowed_roles}"}), 403
            
            request.environ['current_user'] = user
            return f(*args, **kwargs)
        return decorated
    return decorator


@auth_bp.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.json
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Username and password are required"}), 400

    username = data['username']
    password = data['password']

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    row = cursor.fetchone()
    conn.close()

    if row and row['password_hash'] == hash_pw(password):
        token = f"mock-token-{username}"
        return jsonify({
            "success": True,
            "token": token,
            "user": {
                "id": row['id'],
                "username": row['username'],
                "full_name": row['full_name'],
                "role": row['role'],
                "location": row['location']
            }
        })
    else:
        return jsonify({"error": "Invalid username or password"}), 401

@auth_bp.route('/api/auth/me', methods=['GET'])
def auth_me():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        if token.startswith('mock-token-'):
            username = token.replace('mock-token-', '')
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, username, full_name, role, location FROM users WHERE username = %s", (username,))
            row = cursor.fetchone()
            conn.close()
            if row:
                return jsonify({"user": dict(row)})
    return jsonify({"error": "Unauthorized"}), 401

@auth_bp.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    return jsonify({"success": True})
