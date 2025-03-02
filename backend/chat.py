from werkzeug.middleware.proxy_fix import ProxyFix
from flask import Flask, request, send_file
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
from groq import Groq
from datetime import datetime
from dotenv import load_dotenv
import os
import warnings
import PyPDF2
import requests
import json
import tempfile
from pathlib import Path
import threading
import re
import urllib.request

load_dotenv()

app = Flask(__name__)

# Dictionary to store user sessions
user_sessions = {}

class FinSaathiAI:
    def __init__(self):
        # Load API keys from environment variables
        self.groq_api_key = os.environ.get('GROQ_API_KEY')
        self.landingai_api_key = os.environ.get('LANDINGAI_API_KEY')
        
        if not self.groq_api_key:
            raise ValueError("Groq API key must be provided in the GROQ_API_KEY environment variable.")
        if not self.landingai_api_key:
            raise ValueError("Landing.ai API key must be provided in the LANDINGAI_API_KEY environment variable.")
            
        self.client = Groq(api_key=self.groq_api_key)
        self.pdf_contents = ""
        self.document_analysis = {}
        self.current_document_path = None
    
    def process_document(self, file_path):
        """Process document using Landing.ai agentic document extraction API"""
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                return f"Error: File not found at {file_path}"
            
            # Determine file type and prepare payload
            file_extension = Path(file_path).suffix.lower()
            url = "https://api.va.landing.ai/v1/tools/agentic-document-analysis"
            
            if file_extension in ['.jpg', '.jpeg', '.png']:
                files = {"image": open(file_path, "rb")}
            elif file_extension == '.pdf':
                files = {"pdf": open(file_path, "rb")}
            else:
                return f"Error: Unsupported file type. Please upload JPG, PNG, or PDF files."
            
            # Set up headers with API key
            headers = {
                "Authorization": f"Basic {self.landingai_api_key}",
            }
            
            # Make API request
            response = requests.post(url, files=files, headers=headers)
            
            # Store response
            if response.status_code == 200:
                self.document_analysis = response.json()
                self.current_document_path = file_path
                
                # Also extract text content using PyPDF2 for PDFs to have both analyses
                if file_extension == '.pdf':
                    with open(file_path, 'rb') as file:
                        reader = PyPDF2.PdfReader(file)
                        self.pdf_contents = ""
                        
                        for page in reader.pages:
                            self.pdf_contents += page.extract_text() + "\n"
                
                return f"✅ Successfully processed document: {Path(file_path).name} with Landing.ai analysis.\n\nYou can now ask questions about this document or type 'summarize' to get a summary."
            else:
                return f"⚠ Error processing document with Landing.ai: {response.status_code} - {response.text}\nFalling back to basic text extraction..."
                
        except Exception as e:
            return f"⚠ Error processing document with Landing.ai: {str(e)}\nFalling back to basic text extraction..."
    
    def upload_document(self, file_path):
        """Upload and automatically analyze a document"""
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                return f"Error: File not found at {file_path}"
            
            file_extension = Path(file_path).suffix.lower()
            self.current_document_path = file_path
            
            # First try advanced analysis with Landing.ai
            result = self.process_document(file_path)
            
            # If Landing.ai analysis fails but it's a PDF, fall back to basic extraction
            if "Error processing document with Landing.ai" in result and file_extension == '.pdf':
                try:
                    with open(file_path, 'rb') as file:
                        reader = PyPDF2.PdfReader(file)
                        self.pdf_contents = ""
                        
                        for page in reader.pages:
                            self.pdf_contents += page.extract_text() + "\n"
                    
                    return f"{result}\n✅ Successfully extracted basic text from PDF: {Path(file_path).name} ({len(reader.pages)} pages)"
                except Exception as pdf_e:
                    return f"{result}\n❌ Error with basic PDF extraction: {str(pdf_e)}"
            
            return result
                
        except Exception as e:
            return f"❌ Error uploading document: {str(e)}"
    
    def summarize_document(self):
        """Generate a summary of the currently loaded document"""
        if not self.document_analysis and not self.pdf_contents:
            return "❌ No document has been loaded or processed. Please upload a document first."
        
        try:
            # Prepare prompt for summarization
            if self.document_analysis:
                # Use Landing.ai analysis for richer context
                context = json.dumps(self.document_analysis, indent=2)
                prompt = "Please summarize the following financial document analysis. " + \
                         "Focus on key financial metrics, trends, and important information. " + \
                         "The analysis data is provided in JSON format below:\n\n" + context
            else:
                # Fallback to PyPDF2 extraction
                prompt = "Please summarize the following financial document. " + \
                         "Focus on key financial metrics, trends, and important information:\n\n" + self.pdf_contents
            
            # Generate summary using Groq
            response = self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a Financial Document Analysis Expert. Your task is to analyze and summarize financial documents, 
                        regulatory filings, earnings reports, and extract key insights. Use your expertise in financial terminology and jargon 
                        to generate accurate, concise summaries that highlight the most important information."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more factual responses
                max_tokens=1500
            )
            return "📝 Document Summary:\n\n" + response.choices[0].message.content.strip()
        except Exception as e:
            return f"❌ Error generating document summary: {str(e)}"
    
    def get_response(self, user_input):
        try:
            # Prepare context with document content if available
            system_content = """You are FinSaathi, a Market Education and Financial Document Analysis Expert. 
            You explain financial concepts, investment principles, and economic fundamentals in a clear and engaging way. 
            You can analyze financial documents, regulatory filings, earnings reports, and extract key insights.
            You're fluent in financial terminology and jargon. If a user asks an off-topic question, 
            politely redirect them to market-related topics. Keep responses factual and educational.
            
            When responding on WhatsApp, keep responses concise and well-formatted. Use bullet points and headings
            when appropriate, and use emoji occasionally to make the response engaging.
            """
            
            context = ""
            # Add document analysis to context if available
            if self.document_analysis:
                context += "\n\nHere is detailed analysis from a financial document that you can reference:\n"
                context += json.dumps(self.document_analysis, indent=2)
            
            # Add PDF text content if available
            if self.pdf_contents:
                context += "\n\nHere is additional text content from the document:\n"
                # Limit context length to avoid token limits
                if len(self.pdf_contents) > 6000:
                    context += self.pdf_contents[:6000] + "...[content truncated]"
                else:
                    context += self.pdf_contents
            
            # If we have context, add it to the system content
            if context:
                system_content += context
            
            response = self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {
                        "role": "system",
                        "content": system_content
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
            return f"❌ Error getting AI response: {str(e)}"

def get_or_create_session(phone_number):
    """Get or create a FinSaathiAI session for a user"""
    if phone_number not in user_sessions:
        try:
            user_sessions[phone_number] = FinSaathiAI()
        except Exception as e:
            return None, f"Error initializing session: {str(e)}"
    return user_sessions[phone_number], None

def download_media(media_url, auth_token, account_sid):
    """Download media from Twilio"""
    import base64
    
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_file.close()
    
    # Create proper Basic Auth credentials (Base64 encoded)
    credentials = base64.b64encode(f"{account_sid}:{auth_token}".encode()).decode()
    
    # Download the file
    request = urllib.request.Request(media_url)
    request.add_header('Authorization', f'Basic {credentials}')
    
    try:
        response = urllib.request.urlopen(request)
        with open(temp_file.name, 'wb') as f:
            f.write(response.read())
        return temp_file.name
    except Exception as e:
        print(f"Download error: {str(e)}")
        raise

@app.route("/whatsapp", methods=['POST', 'GET'])
def whatsapp_webhook():
    """Handle incoming WhatsApp messages"""
    # Log all incoming requests
    print("Received webhook call with method:", request.method)
    print("Headers:", request.headers)
    
    # Extract message information
    data = request.form
    print("Twilio Request Data:", data)
    # Rest of your code...
    incoming_msg = request.values.get('Body', '').strip()
    media_count = int(request.values.get('NumMedia', '0'))
    sender = request.values.get('From', '')
    
    # Initialize response
    twilio_resp = MessagingResponse()
    
    # Get or create user session
    session, error = get_or_create_session(sender)
    if error:
        twilio_resp.message(f"❌ {error}")
        return str(twilio_resp)
    
    # Check if there's media (PDF)
    if media_count > 0:
        # Get Twilio credentials
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        
        if not account_sid or not auth_token:
            twilio_resp.message("❌ Twilio credentials not properly configured")
            return str(twilio_resp)
        
        # Process the first media file
        media_url = request.values.get('MediaUrl0', '')
        media_type = request.values.get('MediaContentType0', '')
        
        if not media_url:
            twilio_resp.message("❌ Could not retrieve the media file")
            return str(twilio_resp)
        
        # Check if it's a PDF
        if media_type == 'application/pdf' or media_type.startswith('image/'):
            # Send initial message
            twilio_resp.message("🔍 I've received your document. Processing it now...")
            
            try:
                # Download the file
                temp_file_path = download_media(media_url, auth_token, account_sid)
                to_number = request.values.get('To', '')
                
                # Process in background to avoid Twilio timeout
                def process_and_notify():
                    # Process document
                    result = session.upload_document(temp_file_path)
                    from_number = 'whatsapp:+14155238886'
                    
                    # Send result via Twilio
                    twilio_client = Client(account_sid, auth_token)
                    twilio_client.messages.create(
                        body=result,
                        from_=from_number,
                        to=sender
                    )
                
                # Start background processing
                threading.Thread(target=process_and_notify).start()
                
                return str(twilio_resp)
            except Exception as e:
                twilio_resp.message(f"❌ Error processing document: {str(e)}")
                return str(twilio_resp)
        else:
            twilio_resp.message("❌ Please upload a PDF or image document")
            return str(twilio_resp)
    
    # Handle text commands
    if incoming_msg.lower() == 'summarize':
        # Generate document summary
        summary = session.summarize_document()
        twilio_resp.message(summary)
    
    elif incoming_msg.lower() in ['help', 'commands']:
        # Show available commands
        help_text = """
FinSaathi WhatsApp Commands 📱

- Send a PDF or image document to analyze it
- Type summarize to get a summary of the current document
- Ask any question about finance or the uploaded document
- Type help to see this message again
        """
        twilio_resp.message(help_text)
    
    elif incoming_msg.lower() in ['hi', 'hello', 'start']:
        # Welcome message
        welcome_text = """
Welcome to FinSaathi! 🤖

I'm your financial assistant. I can help with:

📊 Financial concepts
📑 Document analysis
📈 Market education

To get started:
- Send a PDF financial document
- Ask me any finance-related question

Type help to see all commands.
        """
        twilio_resp.message(welcome_text)
    
    else:
        # Get response from FinSaathiAI
        response = session.get_response(incoming_msg)
        twilio_resp.message(response)
    
    return str(twilio_resp)

def run_terminal_chatbot():
    """Run the chatbot in a continuous loop in the terminal"""
    print("\n===== FinSaathi Market Education & Document Analysis Chatbot =====")
    print("Commands:")
    print("- Type 'exit', 'quit', or 'bye' to end the conversation")
    print("- Type 'upload <path>' to upload and automatically analyze a document")
    print("- Type 'summarize' to get a summary of the current document")
    print("================================================================\n")
    
    # Initialize the chatbot
    try:
        chatbot = FinSaathiAI()
    except Exception as e:
        print(f"Initialization error: {str(e)}")
        return
    
    # Main chat loop
    while True:
        # Get user input
        user_input = input("\nYou: ").strip()
        
        # Check if user wants to exit
        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("\nThank you for using FinSaathi! Goodbye.")
            break
        
        # Check for document upload command
        if user_input.lower().startswith('upload '):
            doc_path = user_input[7:].strip()
            print("\nFinSaathi: Processing your document. This may take a moment...")
            result = chatbot.upload_document(doc_path)
            print(f"\nFinSaathi: {result}")
            continue
        
        # Check for summarize command
        if user_input.lower() == 'summarize':
            print("\nFinSaathi: Generating document summary...")
            summary = chatbot.summarize_document()
            print(summary)
            continue
        
        # Skip empty inputs
        if not user_input:
            continue
        
        # Get and display the response
        try:
            print("\nFinSaathi: ", end="")
            response = chatbot.get_response(user_input)
            print(response)
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Check run mode
    if os.environ.get('RUN_MODE', 'web').lower() == 'web':
        # Run Flask app for WhatsApp webhook
        port = int(os.environ.get('PORT', 5000))
        app.run(host='0.0.0.0', port=port)
    else:
        # Run terminal chatbot
        run_terminal_chatbot()