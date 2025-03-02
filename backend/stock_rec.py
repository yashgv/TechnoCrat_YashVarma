import yfinance as yf
import pandas as pd
import feedparser
from yahooquery import Screener
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from financial_narrative_generator import FinancialNarrativeGenerator
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

class StockAnalyzer:
    def __init__(self, api_key):
        self.api_key = api_key
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
        
    def extract_company_mentions(self, text):
        """Extract company names and their stock symbols from news text"""
        # Common Indian stock symbol patterns
        symbol_pattern = r'([A-Z]+)(?:\.NS|\.BO)?'
        
        # Get all potential stock symbols
        symbols = re.findall(symbol_pattern, text)
        
        # Filter valid symbols using yfinance
        valid_stocks = []
        for symbol in symbols:
            try:
                stock = yf.Ticker(f"{symbol}.NS")
                info = stock.info
                if info and 'longName' in info:
                    valid_stocks.append({
                        'symbol': f"{symbol}.NS",
                        'name': info['longName']
                    })
            except:
                continue
        
        return valid_stocks

    def get_stock_news(self, company_info):
        """Fetch news using Yahoo Finance"""
        symbol, company_name = company_info
        try:
            # Get stock info
            stock = yf.Ticker(symbol)
            
            # Fetch news
            news = stock.news
            if not news:
                return []
                
            # Process and format news
            formatted_news = []
            for article in news[:5]:  # Get latest 5 news items
                formatted_news.append({
                    'title': article.get('title', ''),
                    'link': article.get('link', ''),
                    'published': datetime.fromtimestamp(article.get('providerPublishTime', 0)).strftime('%Y-%m-%d %H:%M:%S'),
                    'summary': article.get('summary', '')
                })
            
            # Sort by publication date
            formatted_news.sort(key=lambda x: x['published'], reverse=True)
            return [(news['title'], news['link']) for news in formatted_news]
            
        except Exception as e:
            print(f"Error fetching news for {company_name} ({symbol}): {e}")
            return []

    def get_all_news_activity(self):
        """Get news activity for stocks"""
        try:
            # Get top active stocks from Yahoo Finance
            screener = Screener()
            trending = screener.get_screeners('most_actives_in')['most_actives_in']['quotes']
            
            active_stocks = []
            for stock in trending:
                symbol = stock.get('symbol')
                name = stock.get('longName', symbol)
                
                # Add .NS suffix for Indian stocks if not present
                if not symbol.endswith(('.NS', '.BO')):
                    symbol = f"{symbol}.NS"
                
                # Get news for this stock
                news = self.get_stock_news((symbol, name))
                
                if news:
                    active_stocks.append({
                        'symbol': symbol,
                        'name': name,
                        'news_count': len(news),
                        'news': news,
                        'latest_news_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    })
            
            # Sort by news count
            active_stocks.sort(key=lambda x: x['news_count'], reverse=True)
            return active_stocks
            
        except Exception as e:
            print(f"Error analyzing news activity: {e}")
            return []

    def get_top_active_stocks(self, market='^NSEI', limit=5):
        """Get top stocks based on news activity"""
        try:
            active_stocks = self.get_all_news_activity()
            return [(stock['symbol'], stock['name']) 
                    for stock in active_stocks[:limit]]
        except Exception as e:
            print(f"Error fetching top active stocks: {e}")
            return []

    def analyze_sentiment(self, news_articles):
        """Analyze sentiment of news articles"""
        sentiments = []
        for title, link in news_articles:
            sentiment_score = self.sentiment_analyzer.polarity_scores(title)['compound']
            sentiment = ("Positive" if sentiment_score > 0.05 
                       else "Negative" if sentiment_score < -0.05 
                       else "Neutral")
            sentiments.append((title, sentiment, link))
        return sentiments

    def analyze_stock(self, stock_info):
        """Analyze a single stock with both technical and sentiment analysis"""
        symbol, company_name = stock_info
        try:
            # Get news and sentiment analysis using company name for better results
            news_articles = self.get_stock_news((symbol, company_name))
            sentiment_results = self.analyze_sentiment(news_articles)
            
            # Calculate sentiment metrics
            sentiments = [s[1] for s in sentiment_results]
            positive_count = sentiments.count("Positive")
            negative_count = sentiments.count("Negative")
            neutral_count = sentiments.count("Neutral")
            
            sentiment_status = ("Mixed" if positive_count > 0 and negative_count > 0 
                              else "Bullish" if positive_count > negative_count 
                              else "Bearish" if negative_count > positive_count 
                              else "Neutral")

            # Get technical analysis
            narrator = FinancialNarrativeGenerator(symbol, self.api_key)
            historical_data = narrator.fetch_historical_data()
            sim_results, risk_metrics = narrator.monte_carlo_simulation(historical_data)
            backtest_metrics, historical_data = narrator.backtest_strategy(historical_data)
            
            # Get AI insights
            insights = narrator.get_stock_insights(
                historical_data, sim_results, risk_metrics, backtest_metrics
            )
            
            current_price = historical_data['Close'].iloc[-1]
            recommendation = self._extract_recommendation(insights, current_price)
            
            return {
                'symbol': symbol,
                'name': company_name,
                'current_price': current_price,
                'recommendation': recommendation,
                'sentiment': {
                    'status': sentiment_status,
                    'positive': positive_count,
                    'negative': negative_count,
                    'neutral': neutral_count,
                    'articles': sentiment_results,
                    'source': 'Yahoo Finance'
                },
                'confidence_metrics': {
                    'technical_score': backtest_metrics['Sharpe_Ratio'],
                    'risk_score': risk_metrics['VaR_95'],
                    'return_potential': risk_metrics['Expected_Return']
                },
                'insights': insights
            }
            
        except Exception as e:
            print(f"Error analyzing {company_name} ({symbol}): {e}")
            return None

    def _extract_recommendation(self, insights, current_price):
        """Extract buy/sell recommendation and price targets from insights"""
        try:
            # Extract price targets using regex
            price_matches = re.findall(r'\$(\d+\.?\d*)', insights)
            price_targets = [float(p) for p in price_matches if float(p) != current_price]
            
            if not price_targets:
                return {
                    'action': 'HOLD',
                    'target_price': current_price,
                    'stop_loss': current_price * 0.95
                }
            
            # Calculate average price target
            avg_target = sum(price_targets) / len(price_targets)
            
            # Determine recommendation based on average target
            if avg_target > current_price * 1.05:  # 5% potential upside
                action = 'BUY'
                stop_loss = current_price * 0.95  # 5% below current price
            elif avg_target < current_price * 0.95:  # 5% potential downside
                action = 'SELL'
                stop_loss = current_price * 1.05  # 5% above current price
            else:
                action = 'HOLD'
                stop_loss = current_price * 0.95
            
            return {
                'action': action,
                'target_price': avg_target,
                'stop_loss': stop_loss
            }
            
        except Exception as e:
            print(f"Error extracting recommendation: {e}")
            return None

    def get_market_recommendations(self, market='^NSEI'):
        """Get recommendations for top active stocks"""
        top_stocks = self.get_top_active_stocks(market)
        
        recommendations = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            results = list(executor.map(self.analyze_stock, top_stocks))
        
        recommendations = [r for r in results if r is not None]
        recommendations.sort(key=lambda x: x['confidence_metrics']['technical_score'], reverse=True)
        return recommendations

def clean_insights(insights_text):
    """Clean and extract key conclusions from insights"""
    try:
        # Look for conclusion sections with common patterns
        conclusion_patterns = [
            r"(?:Final Decision|Trading Decision|Recommendation):\s*([^.\n]+(?:[^.\n]+)*)",
            r"(?:Overall|Summary|Conclusion):\s*([^.\n]+(?:[^.\n]+)*)",
            r"✅\s*(?:Final|Trading)\s*Decision:\s*([^.\n]+(?:[^.\n]+)*)",
            r"(?:Key Actions|Action Points):\s*([^.\n]+(?:[^.\n]+)*)"
        ]
        
        conclusions = []
        for pattern in conclusion_patterns:
            matches = re.findall(pattern, insights_text, re.IGNORECASE)
            conclusions.extend(matches)
        
        if conclusions:
            # Combine all conclusions and clean up
            final_text = " | ".join(conclusions)
            # Remove any remaining markdown or special characters
            final_text = re.sub(r'[#*`]', '', final_text)
            return final_text.strip()
        
        # Fallback: If no conclusion found, take the last meaningful sentence
        sentences = re.split(r'[.!?]+', insights_text)
        meaningful_sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
        if meaningful_sentences:
            return meaningful_sentences[-1]
        
        return insights_text[:200] + "..."  # Last resort fallback
        
    except Exception as e:
        print(f"Error cleaning insights: {e}")
        return insights_text[:200] + "..."

def format_stock_analysis(recommendations):
    """Format stock analysis data into web-friendly JSON structure"""
    return {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "market": "NSE",
        "stocks": [
            {
                "symbol": rec['symbol'].replace('.NS', ''),
                "company_name": rec['name'],
                "price": {
                    "current": round(rec['current_price'], 2),
                    "target": round(rec['recommendation']['target_price'], 2),
                    "stop_loss": round(rec['recommendation']['stop_loss'], 2)
                },
                "recommendation": {
                    "action": rec['recommendation']['action'],
                    "sentiment": rec['sentiment']['status'],
                    "confidence_score": round(rec['confidence_metrics']['technical_score'], 2)
                },
                "analysis": {
                    "technical": {
                        "score": round(rec['confidence_metrics']['technical_score'], 2),
                        "risk": round(rec['confidence_metrics']['risk_score'] * 100, 2),
                        "potential_return": round(rec['confidence_metrics']['return_potential'] * 100, 2)
                    },
                    "sentiment": {
                        "positive": rec['sentiment']['positive'],
                        "negative": rec['sentiment']['negative'],
                        "neutral": rec['sentiment']['neutral']
                    }
                },
                "key_insights": clean_insights(rec['insights'])
            }
            for rec in recommendations
        ]
    }

def main():
    import json
    
    # Initialize with Groq API key
    api_key = "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"
    
    analyzer = StockAnalyzer(api_key)
    
    try:
        recommendations = analyzer.get_market_recommendations()
        
        if not recommendations:
            return json.dumps({
                "error": "No recommendations available",
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
        
        # Format data for web display
        analysis_json = format_stock_analysis(recommendations)
        
        # Return formatted JSON string
        return json.dumps(analysis_json, indent=2)
        
    except Exception as e:
        return json.dumps({
            "error": str(e),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

if __name__ == "__main__":
    # Print JSON output
    print(main())