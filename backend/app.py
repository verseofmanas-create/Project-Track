import os
import sys
# Support importing local modules when running inside Vercel serverless environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# pyrefly: ignore [missing-import]
from flask import Flask, send_from_directory
from flask_cors import CORS

from api.db import init_db
from api.routes.projects import projects_bp
from api.routes.financials import financials_bp
from api.routes.analytics import analytics_bp
from api.routes.auth import auth_bp
from api.routes.reports import reports_bp
from api.routes.issues import issues_bp
from api.routes.users import users_bp

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app)  # Enable CORS for development mode

# Register Blueprints for modular routing
app.register_blueprint(projects_bp)
app.register_blueprint(financials_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(issues_bp)
app.register_blueprint(users_bp)

# Initialize Database Schema & Seed Data
init_db()

@app.route('/health')
def health():
    return "OK", 200

# ══════════════════════════════════════════════════════════════
# SERVE FRONTEND (SPA ROUTES fallback)
# ══════════════════════════════════════════════════════════════

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    print(f"DEBUG: Received request for path: '{path}'")
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Run on port 5050
    app.run(debug=True, host='0.0.0.0', port=5050)
