from flask import Blueprint, request, jsonify, current_app
import os
import pandas as pd
from .db import engine, transactions_table
from sqlalchemy import insert, text
import requests

from flask_jwt_extended import jwt_required, get_jwt_identity

main = Blueprint('main', __name__)

@main.route('/')
def home():
    return "Finance Dashboard API is running!"

@main.route('/upload', methods=['POST'])
@jwt_required()
def upload_csv():
    user_id = get_jwt_identity()

    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Only CSV files are allowed'}), 400

    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    try:
        df = pd.read_csv(filepath)
        df.columns = [col.strip().lower() for col in df.columns]

        with engine.begin() as conn:
            for _, row in df.iterrows():
                insert_stmt = insert(transactions_table).values(
                    date=pd.to_datetime(row['date']).date(),
                    amount=float(row['amount']),
                    description=str(row.get('merchant', 'Unknown')),
                    category=str(row.get('category', 'Uncategorized')),
                    subcategory=str(row.get('subcategory', '')),
                    merchant=str(row.get('merchant', '')),
                    payment_method=str(row.get('paymentmethod', '')),
                    location=str(row.get('location', '')),
                    user_id=user_id
                )
                conn.execute(insert_stmt)

        return jsonify({'message': 'Data inserted successfully', 'rows': len(df)}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@main.route('/insights', methods=['GET'])
@jwt_required()
def get_insights():
    user_id = get_jwt_identity()

    try:
        with engine.connect() as conn:
            queries = {
                "by_category": """
                    SELECT category, SUM(amount) as total
                    FROM transactions
                    WHERE user_id = :user_id
                    GROUP BY category
                    ORDER BY total DESC
                """,
                "by_subcategory": """
                    SELECT subcategory, SUM(amount) as total
                    FROM transactions
                    WHERE user_id = :user_id
                    GROUP BY subcategory
                    ORDER BY total DESC
                """,
                "by_month": """
                    SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(amount) as total
                    FROM transactions
                    WHERE user_id = :user_id
                    GROUP BY month
                    ORDER BY month
                """,
                "by_payment_method": """
                    SELECT payment_method, SUM(amount) as total
                    FROM transactions
                    WHERE user_id = :user_id
                    GROUP BY payment_method
                    ORDER BY total DESC
                """,
                "by_location": """
                    SELECT location, SUM(amount) as total
                    FROM transactions
                    WHERE user_id = :user_id
                    GROUP BY location
                    ORDER BY total DESC
                """,
                "top_merchants": """
                    SELECT merchant, SUM(amount) as total
                    FROM transactions
                    WHERE user_id = :user_id
                    GROUP BY merchant
                    ORDER BY total DESC
                    LIMIT 5
                """
            }

            results = {}
            for key, sql in queries.items():
                rows = conn.execute(text(sql), {"user_id": user_id}).fetchall()
                results[key] = [
                    {"label": row[0], "total": float(row[1])} for row in rows if row[0]
                ]

        return jsonify(results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@main.route('/advice', methods=['GET'])
@jwt_required()
def get_advice():
    user_id = get_jwt_identity()

    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT category, SUM(amount) as total
                    FROM transactions
                    WHERE user_id = :user_id
                    GROUP BY category
                    ORDER BY total DESC
                """),
                {"user_id": user_id}
            ).fetchall()

        summary = "Here is the user's spending breakdown:\n"
        for row in result:
            summary += f"- {row[0]}: ₹{float(row[1]):,.2f}\n"

        prompt = (
            summary +
            "\nBased on this, give practical, personalized financial advice for saving money next month."
        )

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mistralai/mistral-7b-instruct",
                "messages": [{"role": "user", "content": prompt}]
            }
        )

        result = response.json()

        if 'choices' not in result:
            return jsonify({"error": result.get("error", "Unexpected response format")}), 500

        advice = result['choices'][0]['message']['content']
        return jsonify({"summary": summary, "advice": advice})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
