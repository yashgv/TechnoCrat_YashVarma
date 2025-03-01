from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from groq import Groq
from datetime import datetime
from dotenv import load_dotenv
import os
from financial_analyzer import FinancialAnalyzer
import warnings
import yfinance as yf

from flask import Flask, request, send_file, jsonify
 # You'll need to use a Python PDF library like reportlab or PyPDF2


warnings.filterwarnings('ignore', category=RuntimeWarning)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

class FinSaathiAI:
    def __init__(self):
        self.api_key = os.environ.get('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("Groq API key must be provided in the GROQ_API_KEY environment variable.")
        self.client = Groq(api_key=self.api_key)
    
    def get_response(self, user_input):
        try:
            response = self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a Market Education Chatbot, designed to explain financial concepts, investment principles, and economic fundamentals in a clear and engaging way. You do not provide financial advice, stock recommendations, or market predictions. If a user asks an off-topic question, politely redirect them to market-related topics. Keep responses simple, factual, and educational."""
                    },
                    {
                        "role": "user",
                        "content": user_input
                    }
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise Exception(f"Error getting AI response: {str(e)}")
        
try:
    ai_assistant = FinSaathiAI()
except Exception as e:
    print(f"Initialization error: {str(e)}")
    ai_assistant = None

def create_error_response(message, status_code=400):
    return jsonify({
        "status": "error",
        "message": message
    }), status_code

@app.route('/api/chat', methods=['POST'])
def chat():
    if ai_assistant is None:
        return create_error_response("FinSaathi AI is not properly initialized", 500)

    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return create_error_response("No message provided")

        ai_response = ai_assistant.get_response(data['message'])
        current_time = datetime.now().strftime("%I:%M %p")
        
        return jsonify({
            "status": "success",
            "response": {
                "type": "text",
                "content": ai_response,
                "timestamp": current_time,
                "status": True
            }
        })
    except Exception as e:
        return create_error_response(str(e), 500)
    
@app.route('/api/analyze', methods=['POST'])
def analyze_stock():
    try:
        data = request.get_json()
        if not data or 'symbol' not in data:
            return create_error_response("No symbol provided")
            
        symbol = data.get('symbol')
        
        # Use the same Groq API key that's already initialized for FinSaathiAI
        analyzer = FinancialAnalyzer(symbol, os.environ.get('GROQ_API_KEY'))
        
        # Fetch historical data
        historical_data = analyzer.fetch_historical_data()
        
        # Generate AI analysis
        analysis = analyzer.get_analysis(historical_data)
        
        # Get company info
        company_info = yf.Ticker(symbol).info
        
        response_data = {
            'symbol': symbol,
            'company_name': company_info.get('longName', symbol),
            'historical_data': historical_data,
            'narrative': analysis,
            'metadata': {
                'sector': company_info.get('sector', 'N/A'),
                'industry': company_info.get('industry', 'N/A'),
                'market_cap': company_info.get('marketCap', 'N/A'),
                'currency': company_info.get('currency', 'USD')
            }
        }
        
        return jsonify({
            "status": "success",
            "data": response_data
        })
        
    except Exception as e:
        return create_error_response(str(e), 500)
    

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)