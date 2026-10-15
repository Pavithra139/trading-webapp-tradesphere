# 🌐 TradeSphere – Real-Time Virtual Trading Platform

A production-level virtual trading platform with real-time market data, AI-powered insights, and portfolio management. Trade US and Indian stocks with a modern, Groww/Zerodha-inspired interface.

![TradeSphere](https://img.shields.io/badge/TradeSphere-Virtual%20Trading-667eea)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Express](https://img.shields.io/badge/Express-4-green)
![MongoDB](https://img.shields.io/badge/MongoDB-8-brightgreen)

## ✨ Features

### 📊 Trading & Portfolio
- Multi-stock trading (BUY/SELL) with real-time prices
- Portfolio dashboard with P&L tracking per stock
- Overall profit/loss percentage across portfolio
- $100,000 virtual balance to start

### 📈 Market Data & Charts
- **Live stock data** via Yahoo Finance API (real, not dummy)
- Interactive **candlestick charts** (TradingView-style)
- Multiple timeframes (1D, 5D, 1M, 3M, 6M, 1Y)
- Volume overlay on charts

### 🌍 Multi-Market Support
- US stocks (AAPL, TSLA, GOOGL, MSFT, etc.)
- Indian stocks (RELIANCE.NS, TCS.NS, INFY.NS, etc.)
- One-click market toggle (US / INDIA)

### 🟢 Market Status
- Real-time OPEN 🟢 / CLOSED 🔴 status
- US Market (NYSE/NASDAQ) and Indian Market (NSE/BSE)
- Countdown to next open/close

### 🔍 Advanced Search
- Real-time stock search with autocomplete
- Debounced API calls with caching
- Keyboard navigation (↑ ↓ Enter)
- Market badge (US/INDIA) per result

### ⚡ Real-Time Features
- WebSocket-based live price updates (Socket.io)
- Real-time portfolio P&L updates
- Instant UI updates on stock switch

### 🤖 AI Features
- **Rule-based analysis**: SMA, RSI, MACD indicators
- **Google Gemini AI** integration for smart insights
- BUY 📈 / SELL 📉 / HOLD ⏳ recommendations
- Confidence levels and trend detection

### 🔔 Price Alerts
- Set custom price alerts per stock
- Real-time alert triggering via WebSocket
- Toast notifications on trigger

### 📜 Transaction History
- Full trade history with timestamps
- Sortable by date (latest first)

## 🛠 Tech Stack

| Layer    | Technology                                  |
|----------|---------------------------------------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS        |
| Backend  | Node.js, Express                            |
| Database | MongoDB (Mongoose)                          |
| Charts   | Lightweight Charts (TradingView)            |
| Realtime | Socket.io                                   |
| AI       | Google Gemini API + Rule-based engine       |
| Data     | Yahoo Finance API (yahoo-finance2)          |
| UI       | Framer Motion, Lucide React, react-hot-toast|

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **MongoDB** running locally (`brew services start mongodb-community`)
- **Gemini API Key** (optional, for AI insights)

### 1. Install dependencies
```bash
cd paper2
npm run install:all
```

### 2. Configure environment
```bash
# Edit backend/.env
MONGODB_URI=mongodb://localhost:27017/tradesphere
GEMINI_API_KEY=your_key_here   # Optional
```

### 3. Start both servers
```bash
npm run dev
```

Or start individually:
```bash
# Terminal 1: Backend (port 5000)
cd backend && npm run dev

# Terminal 2: Frontend (port 3000)
cd frontend && npm run dev
```

### 4. Open in browser
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health

## 📡 API Endpoints

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | `/api/stocks/quote/:sym`  | Get real-time quote      |
| GET    | `/api/stocks/search?q=`   | Search stocks            |
| GET    | `/api/stocks/history/:sym`| Historical candlestick   |
| GET    | `/api/stocks/popular`     | Popular stocks by market |
| GET    | `/api/stocks/market-status`| Market open/close status|
| GET    | `/api/portfolio`          | Get portfolio            |
| POST   | `/api/trade`              | Execute BUY/SELL trade   |
| GET    | `/api/transactions`       | Get trade history        |
| GET    | `/api/ai/suggestion/:sym` | Get AI recommendation    |
| POST   | `/api/portfolio/alert`    | Create price alert       |

## 📁 Project Structure

```
paper2/
├── backend/
│   ├── server.js              # Express + Socket.io server
│   ├── models/
│   │   ├── Portfolio.js       # Holdings, balance, alerts
│   │   └── Transaction.js     # Trade history
│   ├── routes/
│   │   ├── stocks.js          # Stock data endpoints
│   │   ├── portfolio.js       # Portfolio management
│   │   ├── trade.js           # Buy/Sell execution
│   │   ├── transactions.js    # Trade history
│   │   └── ai.js              # AI recommendations
│   ├── services/
│   │   ├── stockService.js    # Yahoo Finance + caching
│   │   ├── aiService.js       # Rule-based analysis
│   │   └── geminiService.js   # Google Gemini AI
│   └── sockets/
│       └── priceSocket.js     # WebSocket price updates
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx     # Root layout
    │   │   ├── page.tsx       # Redirect to dashboard
    │   │   ├── globals.css    # Design system
    │   │   └── dashboard/
    │   │       └── page.tsx   # Main dashboard
    │   ├── components/
    │   │   ├── chart/         # Candlestick chart
    │   │   ├── search/        # Stock search + autocomplete
    │   │   ├── trading/       # Buy/Sell panel
    │   │   ├── portfolio/     # Holdings table
    │   │   ├── ai/            # AI insight card
    │   │   └── ui/            # Shared UI components
    │   ├── hooks/             # Custom React hooks
    │   └── lib/               # API client, socket, utils
    └── public/
```
