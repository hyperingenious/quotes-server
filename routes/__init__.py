from flask import Flask

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'hjshjhdjah kjshkjdhjs'
    from .upload import upload

    app.register_blueprint(upload, url_prefix='/')
    return app