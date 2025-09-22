from flask import Flask, render_template, request, jsonify
import os
import google.generativeai as genai
from datetime import datetime, timedelta

# Initialize Flask
app = Flask(__name__)

# Configure Gemini API key from environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

def get_next_reset_time():
    now = datetime.now()
    reset_time = now.replace(hour=13, minute=30, second=0, microsecond=0)
    if now >= reset_time:
        reset_time += timedelta(days=1)
    return reset_time.strftime("%Y-%m-%d %H:%M:%S")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/text", methods=["POST"])
def api_text():
    message = request.json.get("message", "").strip()
    if not message:
        return jsonify({
            "error": "No message provided.",
            "reset_time": get_next_reset_time()
        }), 400

    try:
        response = gemini_model.generate_content(message)
        return jsonify({
            "model": "Gemini",
            "response": response.text
        })
    except Exception as e:
        return jsonify({
            "error": f"Gemini error: {str(e)}",
            "reset_time": get_next_reset_time()
        }), 500

# Render requires dynamic port
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
