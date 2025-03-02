
from flask import Flask, jsonify, request, copy_current_request_context
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from datetime import datetime
import yfinance as yf
import pandas as pd
from flask_sqlalchemy import SQLAlchemy
from threading import Thread
import time
import asyncio

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///trading.db'
db = SQLAlchemy(app)

class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50))
    balance = db.Column(db.Float, default=100000.0)
    
class Position(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50))
    symbol = db.Column(db.String(10))
    quantity = db.Column(db.Integer)
    entry_price = db.Column(db.Float)

with app.app_context():
    db.create_all()

def emit_with_context(event, data):
    with app.app_context():
        socketio.emit(event, data)

def background_task():
    """Background task to fetch and broadcast real-time stock data"""
    with app.app_context():
        while True:
            try:
                # Fetch market data
                categories = {
                    'large-cap': ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
                    'mid-cap': ['AMD', 'UBER', 'SNAP', 'DASH'],
                    'small-cap': ['PLTR', 'RBLX', 'HOOD', 'COIN']
                }
                
                for category, symbols in categories.items():
                    stocks_data = []
                    for symbol in symbols:
                        try:
                            stock = yf.Ticker(symbol)
                            info = stock.info
                            real_time_data = stock.history(period='1d', interval='1m').iloc[-1]
                            
                            stocks_data.append({
                                'symbol': symbol,
                                'name': info.get('longName', ''),
                                'price': real_time_data['Close'],
                                'change': ((real_time_data['Close'] - real_time_data['Open']) / real_time_data['Open']) * 100,
                                'volume': real_time_data['Volume'],
                                'high': real_time_data['High'],
                                'low': real_time_data['Low']
                            })
                        except Exception as e:
                            print(f"Error fetching {symbol}: {str(e)}")
                            continue
                    
                    emit_with_context(f'market_data_{category}', {'stocks': stocks_data})
                
                # Sleep for 1 second before next update
                time.sleep(1)
                
            except Exception as e:
                print(f"Background task error: {str(e)}")
                time.sleep(5)  # Wait 5 seconds before retrying on error

@app.route('/api/stock/<symbol>')
def get_stock_data(symbol):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period='1d', interval='1m')
        info = stock.info
        
        return jsonify({
            'symbol': symbol,
            'name': info.get('longName', ''),
            'price': hist.iloc[-1]['Close'],
            'change': info.get('regularMarketChangePercent', 0),
            'volume': info.get('volume', 0),
            'marketCap': info.get('marketCap', 0),
            'historical': hist.to_dict('records'),
            'details': {
                'pe_ratio': info.get('forwardPE', 0),
                'dividend_yield': info.get('dividendYield', 0),
                'beta': info.get('beta', 0),
                'week52_high': info.get('fiftyTwoWeekHigh', 0),
                'week52_low': info.get('fiftyTwoWeekLow', 0)
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/market-data')
def get_market_data():
    categories = {
        'large-cap': ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
        'mid-cap': ['AMD', 'UBER', 'SNAP', 'DASH'],
        'small-cap': ['PLTR', 'RBLX', 'HOOD', 'COIN']
    }
    
    result = {}
    for category, symbols in categories.items():
        stocks = []
        for symbol in symbols:
            try:
                stock = yf.Ticker(symbol)
                info = stock.info
                stocks.append({
                    'symbol': symbol,
                    'name': info.get('longName', ''),
                    'price': info.get('currentPrice', 0),
                    'change': info.get('regularMarketChangePercent', 0)
                })
            except:
                continue
        result[category] = stocks
    
    return jsonify(result)

@app.route('/api/portfolio/<user_id>')
def get_portfolio(user_id):
    portfolio = Portfolio.query.filter_by(user_id=user_id).first()
    if not portfolio:
        portfolio = Portfolio(user_id=user_id)
        db.session.add(portfolio)
        db.session.commit()
    
    positions = Position.query.filter_by(user_id=user_id).all()
    positions_data = []
    
    for position in positions:
        try:
            stock = yf.Ticker(position.symbol)
            current_price = stock.info.get('currentPrice', 0)
            positions_data.append({
                'symbol': position.symbol,
                'quantity': position.quantity,
                'entry_price': position.entry_price,
                'current_price': current_price,
                'pl': (current_price - position.entry_price) * position.quantity
            })
        except:
            continue
    
    return jsonify({
        'balance': portfolio.balance,
        'positions': positions_data
    })

@app.route('/api/trade', methods=['POST'])
def execute_trade():
    data = request.json
    user_id = data['userId']
    symbol = data['symbol']
    quantity = data['quantity']
    action = data['action']
    
    portfolio = Portfolio.query.filter_by(user_id=user_id).first()
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404
    
    try:
        stock = yf.Ticker(symbol)
        current_price = stock.info['currentPrice']
        total_cost = current_price * quantity
        
        if action == 'buy':
            if portfolio.balance < total_cost:
                return jsonify({'error': 'Insufficient funds'}), 400
            
            portfolio.balance -= total_cost
            position = Position(
                user_id=user_id,
                symbol=symbol,
                quantity=quantity,
                entry_price=current_price
            )
            db.session.add(position)
            
        elif action == 'sell':
            position = Position.query.filter_by(user_id=user_id, symbol=symbol).first()
            if not position or position.quantity < quantity:
                return jsonify({'error': 'Insufficient shares'}), 400
            
            position.quantity -= quantity
            portfolio.balance += total_cost
            
            if position.quantity == 0:
                db.session.delete(position)
        
        db.session.commit()
        return jsonify({'success': True, 'balance': portfolio.balance})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('subscribe')
def handle_subscribe(symbol):
    """Handle subscription to real-time stock updates"""
    @copy_current_request_context
    def send_updates():
        with app.app_context():
            while True:
                try:
                    stock = yf.Ticker(symbol)
                    data = stock.history(period='1d', interval='1m').iloc[-1]
                    emit('stock_update', {
                        'symbol': symbol,
                        'price': data['Close'],
                        'volume': data['Volume'],
                        'timestamp': str(data.name)
                    })
                    time.sleep(1)
                except Exception as e:
                    print(f"Error updating {symbol}: {str(e)}")
                    time.sleep(5)

    Thread(target=send_updates).start()

if __name__ == '__main__':
    # Start the background task
    background_thread = Thread(target=background_task)
    background_thread.daemon = True
    background_thread.start()
    
    # Run the server with WebSocket support
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True, port=5002)