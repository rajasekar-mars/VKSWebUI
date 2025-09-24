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
    app.config['SECRET_KEY'] = 'vks-production-secret-key-2025'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://vksuser:vks_secure_password_2025@localhost/vkswebui_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['DEBUG'] = False
else:
    app.config['SECRET_KEY'] = 'vks-development-secret-key-2025'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['DEBUG'] = True

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Enable CORS
CORS(app, origins=['https://littlesonagrofoods.com', 'https://www.littlesonagrofoods.com'])

# Define models directly in app.py for now
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='employee')

class Center(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)

class Collection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(50), nullable=False)
    center_id = db.Column(db.Integer, db.ForeignKey('center.id'))

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item = db.Column(db.String(150), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(50), nullable=False)

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    balance = db.Column(db.Float, nullable=False, default=0.0)

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
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .status { padding: 20px; margin: 20px 0; border-radius: 8px; }
                .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
                .info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
                .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px; }
                .logo { font-size: 3em; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">🏢</div>
                <h1>VKS Business Portal</h1>
                <div class="status success">
                    <h3>✅ System Online</h3>
                    <p>Flask backend is running successfully on littlesonagrofoods.com</p>
                </div>
                <div class="status info">
                    <h3>🚀 Deployment Complete</h3>
                    <p>Your dairy management system is now live and operational!</p>
                </div>
                <p><strong>Server Time:</strong> {{ current_time }}</p>
                <div style="margin-top: 30px;">
                    <a href="/api/health" class="btn">API Health Check</a>
                    <a href="/api/user" class="btn">User Profile</a>
                </div>
                <div style="margin-top: 20px; color: #666; font-size: 0.9em;">
                    <p>Admin Access: admin / admin123</p>
                    <p>FTP Server: littlesonagrofoods.com (dairyftp/dairy123)</p>
                </div>
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
        db_tables = db.engine.table_names() if hasattr(db.engine, 'table_names') else []
    except Exception as e:
        db_status = f"Error: {str(e)}"
        db_tables = []
    
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.now().isoformat(),
        'database': db_status,
        'tables': len(db_tables),
        'version': '1.0.0',
        'environment': config_name
    })

# OTP-based login endpoints (to match frontend expectations)
@app.route('/api/login/request_otp', methods=['POST'])
def request_otp():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and check_password_hash(user.password_hash, password):
        # For simplicity, we'll use a fixed OTP instead of sending SMS
        # In production, you'd generate a random OTP and send via SMS/email
        session['pending_user_id'] = user.id
        session['otp'] = '123456'  # Fixed OTP for demo
        
        return jsonify({
            'success': True,
            'message': 'OTP sent successfully',
            'otp': '123456'  # In production, don't return OTP in response!
        })
    
    return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

@app.route('/api/login/verify_otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    otp = data.get('otp')
    
    if session.get('otp') == otp and session.get('pending_user_id'):
        user_id = session.pop('pending_user_id')
        session.pop('otp')
        
        user = User.query.get(user_id)
        if user:
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
    
    return jsonify({'success': False, 'message': 'Invalid or expired OTP'}), 401

# Keep the simple login for frontend (no OTP required for now)
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
                'role': user.role,
                'access_control': getattr(user, 'AccessControl', '').split(',') if hasattr(user, 'AccessControl') and user.AccessControl else []
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
