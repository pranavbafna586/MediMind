from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
from flask_cors import CORS
import base64
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Configure Gemini API with key from .env
api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-pro')

def clean_ai_response(text):
    return text.replace('**', '').replace('*', '').replace('\n\d.', '\n•').strip()

def get_health_prompt(user_input: str) -> str:
    return f"""You are a knowledgeable healthcare assistant. Please help with this health-related query: {user_input}

    Guidelines:
    1. Only answer health-related questions
    2. If the question is not about health, respond: "I can only help with health-related questions. Please ask about medical, wellness, or health topics."
    3. Focus on these health areas:
        - Medical conditions and symptoms
        - Treatment options
        - Preventive healthcare
        - General wellness
        - Mental health
        - First aid
        - Medication information
    4. Keep responses clear and simple
    5. For emergencies, always advise seeking immediate medical attention
    6. Avoid using special characters or markdown formatting
    7. Limit response to 100 words
    8. Include a disclaimer for serious medical concerns

    Remember: Provide general information only. For specific medical advice, recommend consulting a healthcare professional."""

def get_image_analysis_prompt(query: str) -> str:
    return f"""You are a health, fitness, and nutrition expert. Analyze this image and provide:

If this is a food/meal image:
1. Estimated calories
2. Macro nutrients (protein, carbs, fats)
3. Health benefits
4. Any dietary concerns
5. How it fits into a fitness diet

If this is an exercise/workout image:
1. Exercise form analysis
2. Target muscle groups
3. Benefits
4. Safety tips
5. Recommended sets and reps

If this is a medicine image, provide detailed medical usage information.

Keep response under 100 words and be accurate.

For the query: {query}"""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get('message', '')
        
        if not user_input:
            return jsonify({'error': 'No message provided'}), 400

        # Generate response using Gemini with health prompt
        prompt = get_health_prompt(user_input)
        response = model.generate_content(prompt)
        ai_response = clean_ai_response(response.text)
        
        return jsonify({
            'response': ai_response
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    try:
        data = request.json
        image_data = data.get('image', '')  # Base64 encoded image
        query = data.get('query', '')

        if not image_data or not query:
            return jsonify({'error': 'Image and query are required'}), 400

        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)

        # Get image contents
        image_parts = [
            {
                'inline_data': {
                    'mime_type': 'image/jpeg',  # Adjust mime type as needed
                    'data': base64.b64encode(image_bytes).decode('utf-8')
                }
            },
            {
                'text': get_image_analysis_prompt(query)
            }
        ]

        # Generate response using Gemini with image and prompt
        response = model.generate_content(image_parts)
        ai_response = clean_ai_response(response.text)
        
        return jsonify({
            'response': ai_response
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)