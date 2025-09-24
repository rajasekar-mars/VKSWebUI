import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'vks-production-secret-key-2025'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://vksuser:vks_secure_password_2025@localhost/vkswebui_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    WTF_CSRF_ENABLED = True
    
class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    
class DevelopmentConfig(Config):
    DEBUG = True
    
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': ProductionConfig
}