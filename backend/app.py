from flask import Flask, request, jsonify, session, send_from_directory, render_template_string
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import os
from datetime import datetime, timedelta

# Initialize Flask app
app = Flask(__name__)

# Load configuration
config_name = os.environ.get('FLASK_ENV', 'production')
if config_name == 'production':
    from config import ProductionConfig
    app.config.from_object(ProductionConfig)
else:
    from config import DevelopmentConfig
    app.config.from_object(DevelopmentConfig)

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Enable CORS
CORS(app, origins=['https://littlesonagrofoods.com', 'https://www.littlesonagrofoods.com'])

# Import models
from models import User, Center, Collection, Sale, Employee, Account

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    try:
        return send_from_directory('/var/www/html', 'index.html')
    except:
        return render_template_string("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>VKS Business Portal</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .container { max-width: 600px; margin: 0 auto; }
                .status { padding: 20px; margin: 20px; border-radius: 8px; }
                .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
                .info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🏢 VKS Business Portal</h1>
                <div class="status success">
                    <h3>✅ Backend is Running</h3>
                    <p>Flask application is successfully deployed and operational</p>
                </div>
                <div class="status info">
                    <h3>🔧 Setup in Progress</h3>
                    <p>Frontend build is being configured. Please check back shortly.</p>
                </div>
                <p><strong>Time:</strong> {{ current_time }}</p>
                <p><a href="/api/health">API Health Check</a></p>
            </div>
        </body>
        </html>
        """, current_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"))

@app.route('/<path:path>')
def static_files(path):
    try:
        return send_from_directory('/var/www/html', path)
    except:
        return index()

# API Routes
@app.route('/api/health')
def health_check():
    try:
        # Test database connection
        from sqlalchemy import text
        with db.engine.connect() as connection:
            connection.execute(text('SELECT 1'))
        db_status = "Connected"
    except Exception as e:
        db_status = f"Error: {str(e)}"
    
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.now().isoformat(),
        'database': db_status,
        'version': '1.0.0'
    })

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and check_password_hash(user.password_hash, password):
        login_user(user)
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        })
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/user')
@login_required
def api_user():
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'role': current_user.role
    })

# Database initialization
def init_database():
    with app.app_context():
        db.create_all()
        
        # Create admin user if doesn't exist
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin_user = User(
                username='admin',
                email='admin@littlesonagrofoods.com',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin_user)
            db.session.commit()
            print("✅ Admin user created: admin/admin123")
        else:
            print("✅ Admin user already exists")

if __name__ == '__main__':
    init_database()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
