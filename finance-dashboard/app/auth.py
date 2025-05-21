from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text
from .db import engine

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    hashed = generate_password_hash(password)

    try:
        with engine.begin() as conn:
            conn.execute(text("INSERT INTO users (username, password) VALUES (:u, :p)"), {
                "u": username,
                "p": hashed
            })
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM users WHERE username = :u"),
            {"u": username}
        ).mappings().fetchone()

    if result and check_password_hash(result["password"], password):
        token = create_access_token(identity=result["id"])
        return jsonify({"access_token": token})

    return jsonify({"error": "Invalid username or password"}), 401
