document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const balanceUI = document.getElementById('user-balance');
  const searchInput = document.getElementById('stock-search');
  const searchBtn = document.getElementById('search-btn');
  const views = document.querySelectorAll('.view-section');
  const navItems = document.querySelectorAll('.sidebar-nav li');
  const marketTabs = document.querySelectorAll('.market-tab');
  
  // Dashboard Elements
  const lblStockTitle = document.getElementById('current-stock-title');
  const lblStockPrice = document.getElementById('current-stock-price');
  const badgeAISuggestion = document.getElementById('ai-suggestion-badge');
  const btnBuyTab = document.querySelector('.trade-tab[data-action="BUY"]');
  const btnSellTab = document.querySelector('.trade-tab[data-action="SELL"]');
  const tradeTabs = document.querySelectorAll('.trade-tab');
  const tradeStockSymbol = document.getElementById('trade-stock-symbol');
  const tradeQty = document.getElementById('trade-qty');
  const tradePrice = document.getElementById('trade-price');
  const tradeTotal = document.getElementById('trade-total');
  const btnExecuteTrade = document.getElementById('execute-trade-btn');
  const tradeMessage = document.getElementById('trade-message');
  const aiVerdict = document.getElementById('ai-verdict');
  const aiReasoning = document.getElementById('ai-reasoning');
  const popularStocksList = document.getElementById('popular-stocks-list');

  // Portfolio & History Elements
  const portInvested = document.getElementById('port-invested');
  const portCurrent = document.getElementById('port-current');
  const portPL = document.getElementById('port-pl');
  const portTableBody = document.getElementById('portfolio-table-body');
  const historyTableBody = document.getElementById('history-table-body');

  // State
  let currentUser = null;
  let currentStock = { symbol: 'AAPL', price: 0, prevClose: 0 };
  let tradeAction = 'BUY'; // 'BUY' or 'SELL'
  let activeMarket = 'US'; // 'US' or 'IN'
  let refreshInterval = null;
  let tvWidget = null;

  const defaultUS = ['AAPL', 'TSLA', 'GOOGL', 'AMZN', 'MSFT'];
  const defaultIN = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'SBIN.NS'];

  // Initialization
  // Ask permission
if (Notification.permission !== "granted") {
    Notification.requestPermission();
}
  init();

  async function init() {
    await fetchPortfolio();
    setupNavigation();
    setupMarketTabs();
    setupTradeTabs();
    setupSearch();
    loadStock(currentStock.symbol);

    // Auto refresh price every 10 seconds
    setInterval(() => {
      if (document.getElementById('view-dashboard').classList.contains('active-view')) {
        updateCurrentPriceSilently();
      }
    }, 10000);
  }
  function showNotification(title, message) {
    if (Notification.permission === "granted") {
        new Notification(title, {
            body: message,
            icon: "https://cdn-icons-png.flaticon.com/512/3135/3135706.png"
        });
    }
}

  // --- UI Navigation --- //
  function setupNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', async () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        const targetView = item.getAttribute('data-tab');
        views.forEach(v => v.classList.remove('active-view'));
        document.getElementById(`view-${targetView}`).classList.add('active-view');

        if (targetView === 'portfolio') {
          await renderPortfolio();
        } else if (targetView === 'history') {
          await renderHistory();
        }
      });
    });
  }

  function setupMarketTabs() {
    marketTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        marketTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeMarket = tab.getAttribute('data-market');
        
        const watchlist = activeMarket === 'US' ? defaultUS : defaultIN;
        renderWatchlist(watchlist);
        loadStock(watchlist[0]);
      });
    });
    // Initial load
    renderWatchlist(defaultUS);
  }

  function setupTradeTabs() {
    tradeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tradeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tradeAction = tab.getAttribute('data-action');
        
        btnExecuteTrade.textContent = `${tradeAction} ${currentStock.symbol}`;
        btnExecuteTrade.className = `btn ${tradeAction === 'BUY' ? 'buy-btn' : 'sell-btn'}`;
      });
    });

    tradeQty.addEventListener('input', updateTradeTotal);

    btnExecuteTrade.addEventListener('click', executeTrade);
  }

  function setupSearch() {
    searchBtn.addEventListener('click', () => handleSearch());
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  function handleSearch() {
    let query = searchInput.value.trim().toUpperCase();
    if (!query) return;

    // Auto format Indian symbols if in Indian tab and not ending with .NS
    if (activeMarket === 'IN' && !query.includes('.')) {
      query += '.NS';
    }
    
    loadStock(query);
    searchInput.value = '';
  }

  // --- Data Fetching --- //
  async function fetchPortfolio() {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        currentUser = await res.json();
        updateBalanceUI();
      }
    } catch (err) {
      console.error('Failed to fetch portfolio', err);
    }
  }

  function updateBalanceUI() {
    if (currentUser) {
      balanceUI.textContent = formatCurrency(currentUser.balance);
    }
  }

  async function fetchQuote(symbol) {
    try {
      const res = await fetch(`/api/quote/${symbol}`);
      if (res.ok) {
        return await res.json();
      } else {
        throw new Error('Symbol not found or Error');
      }
    } catch (err) {
      console.warn('Falling back to mock data due to API limit or error for:', symbol);
      return generateMockQuote(symbol);
    }
  }

  function generateMockQuote(symbol) {
    // Generate random realistic price if API fails
    const seed = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const basePrice = (seed % 500) + 10;
    const volatility = basePrice * 0.02;
    const price = basePrice + (Math.random() * volatility * 2 - volatility);
    return {
      symbol,
      price: price,
      prevClose: basePrice
    };
  }

  // --- Core Application Logic --- //
  async function loadStock(symbol) {
    tradeMessage.textContent = 'Loading...';
    tradeMessage.className = '';
    
    const data = await fetchQuote(symbol);
    if (!data) {
      tradeMessage.textContent = 'Symbol not found!';
      tradeMessage.className = 'trade-error';
      return;
    }

    currentStock = { ...data };
    
    // UI Update
    lblStockTitle.innerHTML = `${symbol.replace('.NS', '')} <span id="current-stock-price">${formatCurrency(currentStock.price)}</span>`;
    lblStockPrice.textContent = formatCurrency(currentStock.price);
    tradeStockSymbol.textContent = symbol;
    tradePrice.value = currentStock.price.toFixed(2);
    
    btnExecuteTrade.textContent = `${tradeAction} ${symbol}`;
    tradeMessage.textContent = '';
    
    updateTradeTotal();
    renderTradingViewWidget(symbol);
    evaluateAI(currentStock);
  }

  async function updateCurrentPriceSilently() {
    if (!currentStock.symbol) return;
    const data = await fetchQuote(currentStock.symbol);
    if (data && data.price) {
      currentStock.price = data.price;
      const priceElem = document.getElementById('current-stock-price');
      if (priceElem) priceElem.textContent = formatCurrency(data.price);
      tradePrice.value = data.price.toFixed(2);
      updateTradeTotal();
    }
  }

  function updateTradeTotal() {
    const qty = parseFloat(tradeQty.value) || 0;
    tradeTotal.value = (qty * currentStock.price).toFixed(2);
  }

  async function renderWatchlist(symbols) {
    popularStocksList.innerHTML = '<li>Loading...</li>';
    let html = '';
    
    for (let sym of symbols) {
      const data = await fetchQuote(sym);
      const isUp = data.price >= data.prevClose;
      const cls = isUp ? 'wl-price-up' : 'wl-price-down';
      const icon = isUp ? '<i class="fas fa-arrow-up"></i>' : '<i class="fas fa-arrow-down"></i>';
      
      html += `
        <li onclick="loadStockFromWatchlist('${sym}')">
          <span class="wl-symbol">${sym.replace('.NS', '')}</span>
          <span class="${cls}">${formatCurrency(data.price)} ${icon}</span>
        </li>
      `;
    }
    
    popularStocksList.innerHTML = html;
  }

  window.loadStockFromWatchlist = function(sym) {
    loadStock(sym);
  };

  function renderTradingViewWidget(symbol) {
    const container = document.getElementById('tradingview-widget-container');
    container.innerHTML = ''; // Clear existing
    
    // Configure symbol format for TV
    let tvSymbol = symbol;
    if (tvSymbol.includes('.NS')) {
      tvSymbol = 'NSE:' + tvSymbol.replace('.NS', '');
    } else {
      tvSymbol = 'NASDAQ:' + tvSymbol; // Default assumption for US simple symbols
    }

    new TradingView.widget({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1", // Candlestick
      "locale": "en",
      "enable_publishing": false,
      "backgroundColor": "rgba(21, 30, 50, 1)",
      "gridColor": "rgba(31, 41, 55, 1)",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "container_id": "tradingview-widget-container"
    });
  }

  // --- AI Suggestion Engine --- //
  function evaluateAI(stock) {
    // Simple logic based on % change from previous close
    const pctChange = ((stock.price - stock.prevClose) / stock.prevClose) * 100;
    
    let verdict = 'HOLD';
    let reason = 'Stock is consolidating, no clear trend.';
    let cssClass = 'hold';

    if (pctChange > 2) {
      verdict = 'SELL';
      reason = `Stock is up ${pctChange.toFixed(2)}%. Taking profits might be a good idea before it corrects.`;
      cssClass = 'sell';
    } else if (pctChange < -2) {
      verdict = 'BUY';
      reason = `Stock is down ${Math.abs(pctChange).toFixed(2)}%. Might be a good support level to accumulate.`;
      cssClass = 'buy';
    } else if (pctChange > 0.5) {
      verdict = 'BUY';
      reason = 'Slight uptrend momentum forming. Safe to enter.';
      cssClass = 'buy';
    }

    aiVerdict.textContent = verdict;
    aiVerdict.className = `ai-verdict ${cssClass}`;
    aiReasoning.textContent = reason;
    
    badgeAISuggestion.textContent = `${verdict} ${verdict === 'BUY' ? '📈' : verdict === 'SELL' ? '📉' : '⏳'}`;
    badgeAISuggestion.className = `badge ${cssClass}`;
  }

  // --- Execution --- //
  async function executeTrade() {
    const qty = parseFloat(tradeQty.value);
    if (!qty || qty <= 0) {
      showTradeMsg('Invalid quantity', false);
      return;
    }

    btnExecuteTrade.disabled = true;
    showTradeMsg('Executing...', true);

    try {
      const res = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tradeAction,
          symbol: currentStock.symbol,
          quantity: qty,
          price: currentStock.price
        })
      });

      const data = await res.json();
      btnExecuteTrade.disabled = false;

      if (res.ok) {
        showTradeMsg(`Successfully ${tradeAction === 'BUY' ? 'bought' : 'sold'} ${qty} ${currentStock.symbol}!`, true);
        currentUser = data.user;
        updateBalanceUI();
        tradeQty.value = 1;
        updateTradeTotal();
      } else {
        showTradeMsg(data.error || 'Trade failed', false);
      }
    } catch (err) {
      btnExecuteTrade.disabled = false;
      showTradeMsg('Network error executing trade', false);
    }
  }

  function showTradeMsg(msg, isSuccess) {
    tradeMessage.textContent = msg;
    tradeMessage.className = isSuccess ? 'trade-success' : 'trade-error';
    setTimeout(() => { if(tradeMessage.textContent === msg) tradeMessage.textContent = ''; }, 3000);
  }

  // --- Portfolio & History Rendering --- //
  async function renderPortfolio() {
    if (!currentUser) await fetchPortfolio();
    
    let invested = 0;
    let currentVal = 0;
    portTableBody.innerHTML = '<tr><td colspan="7">Loading real-time prices...</td></tr>';

    let html = '';
    
    if (!currentUser.holdings || currentUser.holdings.length === 0) {
      portTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No holdings currently. Start trading!</td></tr>';
      updatePortfolioSummary(0, 0);
      return;
    }

    for (let holding of currentUser.holdings) {
      const liveData = await fetchQuote(holding.symbol);
      const ltp = liveData.price || holding.averagePrice;
      
      const holdingInvested = holding.quantity * holding.averagePrice;
      const holdingCurrent = holding.quantity * ltp;
      const pl = holdingCurrent - holdingInvested;
      const plPct = (pl / holdingInvested) * 100;
      
      invested += holdingInvested;
      currentVal += holdingCurrent;

      const plClass = pl >= 0 ? 'profit-text' : 'loss-text';
      const plSign = pl >= 0 ? '+' : '';

      html += `
        <tr>
          <td><strong>${holding.symbol}</strong></td>
          <td>${holding.quantity}</td>
          <td>${formatCurrency(holding.averagePrice)}</td>
          <td>${formatCurrency(ltp)}</td>
          <td>${formatCurrency(holdingCurrent)}</td>
          <td class="${plClass}">
            ${plSign}${formatCurrency(pl)} (${plSign}${plPct.toFixed(2)}%)
          </td>
          <td>
            <button class="btn primary-btn" style="padding:4px 8px; font-size:12px;" onclick="sellFromPortfolio('${holding.symbol}')">Sell</button>
          </td>
        </tr>
      `;
    }
    
    portTableBody.innerHTML = html;
    updatePortfolioSummary(invested, currentVal);
  }

  function updatePortfolioSummary(invested, currentVal) {
    const pl = currentVal - invested;
    const plPct = invested > 0 ? (pl / invested) * 100 : 0;
    const plClass = pl > 0 ? 'profit' : pl < 0 ? 'loss' : 'neutral';
    const plSign = pl >= 0 ? '+' : '';

    portInvested.textContent = formatCurrency(invested);
    portCurrent.textContent = formatCurrency(currentVal);
    
    portPL.textContent = `${plSign}${formatCurrency(pl)} (${plSign}${plPct.toFixed(2)}%)`;
    portPL.className = plClass;
  }

  window.sellFromPortfolio = function(symbol) {
    // Switch to dashboard and set to SELL action
    navItems[0].click(); // Dashboard is index 0
    tradeTabs[1].click(); // Sell tab is index 1
    loadStock(symbol);
  };

  async function renderHistory() {
    historyTableBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    try {
      const res = await fetch('/api/portfolio/transactions');
      if (res.ok) {
        const txns = await res.json();
        
        if (txns.length === 0) {
          historyTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No transactions found.</td></tr>';
          return;
        }

        let html = '';
        for (let t of txns) {
          const typeClass = t.type === 'BUY' ? 'trade-success' : 'trade-error';
          html += `
            <tr>
              <td><span class="${typeClass}" style="font-weight:bold;">${t.type}</span></td>
              <td><strong>${t.symbol}</strong></td>
              <td>${t.quantity}</td>
              <td>${formatCurrency(t.price)}</td>
              <td>${formatCurrency(t.quantity * t.price)}</td>
              <td>${new Date(t.timestamp).toLocaleString()}</td>
            </tr>
          `;
        }
        historyTableBody.innerHTML = html;
      }
    } catch (err) {
      historyTableBody.innerHTML = '<tr><td colspan="6" class="trade-error">Failed to load history</td></tr>';
    }
  }

  // --- Utilities --- //
  function formatCurrency(val) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  }

});
