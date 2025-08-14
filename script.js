/**
 * Live Currency Dashboard
 * A modern web application for tracking cryptocurrency and fiat currency rates
 * 
 * @author Developer
 * @version 1.0.0
 * @since 2024
 */

class CurrencyDashboard {
    constructor() {
        // Конфигурация
        this.UPDATE_INTERVAL = 15000; // 15 секунд
        this.COINGECKO_API = 'https://api.coingecko.com/api/v3';
        this.EXCHANGE_API = 'https://api.fxratesapi.com/latest';
        
        // Состояние приложения
        this.currencies = [];
        this.favorites = this.loadFavorites();
        this.currentFilter = 'all'; // 'all' или 'favorites'
        this.updateInterval = null;
        this.chart = null;
        this.currentCurrency = null;
        this.currentTimeframe = { days: 7 };
        this.portfolio = this.loadPortfolio();
        this.searchTimeout = null;
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.priceAlerts = this.loadPriceAlerts();
        this.lastPrices = {};
        
        // Кеширование для оптимизации
        this.cache = {
            crypto: { data: null, timestamp: 0, duration: 30000 }, // 30 секунд
            fiat: { data: null, timestamp: 0, duration: 300000 }   // 5 минут
        };
        
        // Список отслеживаемых валют и криптовалют (расширенный)
        this.currencyList = [
            // Топ криптовалюты
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', type: 'crypto', priority: 1 },
            { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', type: 'crypto', priority: 1 },
            { id: 'tether', name: 'Tether', symbol: 'USDT', type: 'crypto', priority: 1 },
            { id: 'binancecoin', name: 'BNB', symbol: 'BNB', type: 'crypto', priority: 1 },
            { id: 'solana', name: 'Solana', symbol: 'SOL', type: 'crypto', priority: 1 },
            { id: 'usd-coin', name: 'USD Coin', symbol: 'USDC', type: 'crypto', priority: 1 },
            { id: 'cardano', name: 'Cardano', symbol: 'ADA', type: 'crypto', priority: 1 },
            { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX', type: 'crypto', priority: 1 },
            { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', type: 'crypto', priority: 1 },
            { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', type: 'crypto', priority: 1 },
            
            // Популярные альткоины
            { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', type: 'crypto', priority: 2 },
            { id: 'polygon', name: 'Polygon', symbol: 'MATIC', type: 'crypto', priority: 2 },
            { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', type: 'crypto', priority: 2 },
            { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB', type: 'crypto', priority: 2 },
            { id: 'uniswap', name: 'Uniswap', symbol: 'UNI', type: 'crypto', priority: 2 },
            { id: 'ethereum-classic', name: 'Ethereum Classic', symbol: 'ETC', type: 'crypto', priority: 2 },
            { id: 'stellar', name: 'Stellar', symbol: 'XLM', type: 'crypto', priority: 2 },
            { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', type: 'crypto', priority: 2 },
            { id: 'algorand', name: 'Algorand', symbol: 'ALGO', type: 'crypto', priority: 2 },
            { id: 'vechain', name: 'VeChain', symbol: 'VET', type: 'crypto', priority: 2 },
            
            // DeFi токены
            { id: 'aave', name: 'Aave', symbol: 'AAVE', type: 'crypto', priority: 3 },
            { id: 'compound-governance-token', name: 'Compound', symbol: 'COMP', type: 'crypto', priority: 3 },
            { id: 'sushiswap', name: 'SushiSwap', symbol: 'SUSHI', type: 'crypto', priority: 3 },
            { id: 'yearn-finance', name: 'Yearn Finance', symbol: 'YFI', type: 'crypto', priority: 3 },
            { id: 'pancakeswap-token', name: 'PancakeSwap', symbol: 'CAKE', type: 'crypto', priority: 3 },
            { id: 'curve-dao-token', name: 'Curve DAO', symbol: 'CRV', type: 'crypto', priority: 3 },
            
            // Метавселенная и NFT
            { id: 'decentraland', name: 'Decentraland', symbol: 'MANA', type: 'crypto', priority: 3 },
            { id: 'the-sandbox', name: 'The Sandbox', symbol: 'SAND', type: 'crypto', priority: 3 },
            { id: 'axie-infinity', name: 'Axie Infinity', symbol: 'AXS', type: 'crypto', priority: 3 },
            { id: 'enjincoin', name: 'Enjin Coin', symbol: 'ENJ', type: 'crypto', priority: 3 },
            
            // Новые перспективные проекты
            { id: 'aptos', name: 'Aptos', symbol: 'APT', type: 'crypto', priority: 3 },
            { id: 'sui', name: 'Sui', symbol: 'SUI', type: 'crypto', priority: 3 },
            { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', type: 'crypto', priority: 3 },
            { id: 'optimism', name: 'Optimism', symbol: 'OP', type: 'crypto', priority: 3 },
            { id: 'immutable-x', name: 'Immutable X', symbol: 'IMX', type: 'crypto', priority: 3 },
            
            // Мемкоины
            { id: 'pepe', name: 'Pepe', symbol: 'PEPE', type: 'crypto', priority: 4 },
            { id: 'bonk', name: 'Bonk', symbol: 'BONK', type: 'crypto', priority: 4 },
            { id: 'floki', name: 'FLOKI', symbol: 'FLOKI', type: 'crypto', priority: 4 },
            
            // Стейблкоины
            { id: 'dai', name: 'Dai', symbol: 'DAI', type: 'crypto', priority: 2 },
            { id: 'true-usd', name: 'TrueUSD', symbol: 'TUSD', type: 'crypto', priority: 4 },
            { id: 'paxos-standard', name: 'Pax Dollar', symbol: 'USDP', type: 'crypto', priority: 4 },
            
            // Фиатные валюты (относительно USD)
            { id: 'EUR', name: 'Euro', symbol: 'EUR', type: 'fiat', priority: 1 },
            { id: 'GBP', name: 'British Pound', symbol: 'GBP', type: 'fiat', priority: 1 },
            { id: 'JPY', name: 'Japanese Yen', symbol: 'JPY', type: 'fiat', priority: 1 },
            { id: 'RUB', name: 'Russian Ruble', symbol: 'RUB', type: 'fiat', priority: 1 },
            { id: 'CNY', name: 'Chinese Yuan', symbol: 'CNY', type: 'fiat', priority: 1 },
            { id: 'CAD', name: 'Canadian Dollar', symbol: 'CAD', type: 'fiat', priority: 1 },
            { id: 'AUD', name: 'Australian Dollar', symbol: 'AUD', type: 'fiat', priority: 2 },
            { id: 'CHF', name: 'Swiss Franc', symbol: 'CHF', type: 'fiat', priority: 2 },
            { id: 'INR', name: 'Indian Rupee', symbol: 'INR', type: 'fiat', priority: 2 },
            { id: 'KRW', name: 'South Korean Won', symbol: 'KRW', type: 'fiat', priority: 2 }
        ];
        
        this.init();
    }
    
    // Инициализация приложения
    init() {
        this.setupEventListeners();
        this.initTheme();
        this.initSound();
        this.fetchCurrencyData();
        this.startAutoUpdate();
        
        console.log('Currency Dashboard initialized successfully');
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Переключатель темы
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Фильтры
        document.getElementById('show-all').addEventListener('click', () => {
            this.setFilter('all');
        });
        
        document.getElementById('show-favorites').addEventListener('click', () => {
            this.setFilter('favorites');
        });
        
        // Закрытие модального окна графика
        document.getElementById('close-chart').addEventListener('click', () => {
            this.closeChart();
        });
        
        // Закрытие модального окна по клику на фон
        document.getElementById('chart-modal').addEventListener('click', (e) => {
            if (e.target.id === 'chart-modal') {
                this.closeChart();
            }
        });
        
        // Закрытие модального окна по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeChart();
            }
        });
        
        // Обработчики кнопок временных промежутков
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('timeframe-btn') || e.target.closest('.timeframe-btn')) {
                const btn = e.target.classList.contains('timeframe-btn') ? e.target : e.target.closest('.timeframe-btn');
                this.setTimeframe(btn);
            }
        });
        
        // Оптимизированный поиск валют с debouncing
        document.getElementById('search-input').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();
            
            // Мгновенный показ всех валют при очистке поиска
            if (!query) {
                this.renderCurrencies();
                return;
            }
            
            // Debounced поиск для остальных случаев
            this.searchTimeout = setTimeout(() => {
                this.searchCurrencies(query);
            }, 250);
        });
        
        // Калькулятор
        document.getElementById('show-calculator').addEventListener('click', () => {
            this.showCalculator();
        });
        
        document.getElementById('close-calculator').addEventListener('click', () => {
            this.closeCalculator();
        });
        
        // Портфель
        document.getElementById('show-portfolio').addEventListener('click', () => {
            this.showPortfolio();
        });
        
        document.getElementById('close-portfolio').addEventListener('click', () => {
            this.closePortfolio();
        });
        
        document.getElementById('add-to-portfolio').addEventListener('click', () => {
            this.addToPortfolio();
        });
        
        // Экспорт данных
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        // Звуковые уведомления
        document.getElementById('sound-toggle').addEventListener('click', () => {
            this.toggleSound();
        });
        
        // Калькулятор - обновление при изменении значений
        ['calc-from', 'calc-to', 'calc-amount'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.calculateConversion();
            });
        });
    }
    
    // Инициализация темы
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const isDark = savedTheme === 'dark' || 
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.getElementById('theme-icon').className = 'fas fa-sun';
        } else {
            document.documentElement.classList.remove('dark');
            document.getElementById('theme-icon').className = 'fas fa-moon';
        }
    }
    
    // Инициализация звука
    initSound() {
        const button = document.getElementById('sound-toggle');
        const icon = document.getElementById('sound-icon');
        
        if (!this.soundEnabled) {
            button.classList.add('muted');
            icon.className = 'fas fa-volume-mute';
        }
    }
    
    // Переключение темы
    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        
        if (isDark) {
            document.documentElement.classList.remove('dark');
            document.getElementById('theme-icon').className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            document.getElementById('theme-icon').className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        }
    }
    
    // Оптимизированное получение данных о валютах с кешированием
    async fetchCurrencyData() {
        try {
            this.showLoading(true);
            this.hideError();
            this.animateSync();
            
            // Проверяем кеш перед запросами
            const now = Date.now();
            let cryptoData, fiatData;
            
            const cryptoPromise = this.isCacheValid('crypto', now) 
                ? Promise.resolve(this.cache.crypto.data) 
                : this.fetchCryptoData();
                
            const fiatPromise = this.isCacheValid('fiat', now) 
                ? Promise.resolve(this.cache.fiat.data) 
                : this.fetchFiatData();
            
            // Получаем данные параллельно
            [cryptoData, fiatData] = await Promise.all([cryptoPromise, fiatPromise]);
            
            this.currencies = [...cryptoData, ...fiatData];
            this.renderCurrencies();
            this.updateLastUpdateTime();
            this.updateStatistics();
            this.checkPriceAlerts();
            
            // Запускаем анимацию обновления карточек (только для приоритетных)
            setTimeout(() => {
                this.animateCardUpdates();
            }, 300);
            
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
            this.showError('Не удалось загрузить данные о валютах. Проверьте подключение к интернету.');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Проверка валидности кеша
    isCacheValid(type, currentTime) {
        const cache = this.cache[type];
        return cache.data && (currentTime - cache.timestamp) < cache.duration;
    }
    
    // Оптимизированное получение данных криптовалют с кешированием
    async fetchCryptoData() {
        // Разделяем на приоритетные и обычные для оптимизации запросов
        const priorityCryptos = this.currencyList.filter(c => c.type === 'crypto' && c.priority <= 2);
        const otherCryptos = this.currencyList.filter(c => c.type === 'crypto' && c.priority > 2);
        
        // Сначала загружаем приоритетные валюты
        const priorityIds = priorityCryptos.map(c => c.id).join(',');
        const otherIds = otherCryptos.map(c => c.id).join(',');
        
        let priorityData = {};
        let otherData = {};
        
        // Загружаем приоритетные валюты
        if (priorityIds) {
            const response = await fetch(
                `${this.COINGECKO_API}/simple/price?ids=${priorityIds}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            priorityData = await response.json();
        }
        
        // Загружаем остальные валюты с задержкой для уменьшения нагрузки
        if (otherIds) {
            setTimeout(async () => {
                try {
                    const response = await fetch(
                        `${this.COINGECKO_API}/simple/price?ids=${otherIds}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
                    );
                    
                    if (response.ok) {
                        otherData = await response.json();
                        // Обновляем кеш для остальных валют
                        this.updatePartialCryptoData(otherData, otherCryptos);
                    }
                } catch (error) {
                    console.warn('Ошибка при загрузке дополнительных криптовалют:', error);
                }
            }, 500);
        }
        
        const allData = { ...priorityData, ...otherData };
        
        const result = this.currencyList
            .filter(c => c.type === 'crypto')
            .map(currency => {
                const priceData = allData[currency.id];
                return {
                    ...currency,
                    price: priceData?.usd || 0,
                    change24h: priceData?.usd_24h_change || 0,
                    lastUpdated: priceData?.last_updated_at || Date.now() / 1000
                };
            });
        
        // Кешируем результат
        this.cache.crypto = {
            data: result,
            timestamp: Date.now(),
            duration: 30000
        };
        
        return result;
    }
    
    // Частичное обновление данных криптовалют
    updatePartialCryptoData(newData, currencies) {
        if (!this.currencies) return;
        
        currencies.forEach(currency => {
            const priceData = newData[currency.id];
            if (priceData) {
                const existingIndex = this.currencies.findIndex(c => c.id === currency.id);
                if (existingIndex !== -1) {
                    this.currencies[existingIndex] = {
                        ...this.currencies[existingIndex],
                        price: priceData.usd || 0,
                        change24h: priceData.usd_24h_change || 0,
                        lastUpdated: priceData.last_updated_at || Date.now() / 1000
                    };
                }
            }
        });
        
        // Мягкое обновление отображения
        this.softUpdateCurrencyCards();
    }
    
    // Оптимизированное получение данных фиатных валют с кешированием
    async fetchFiatData() {
        const response = await fetch(this.EXCHANGE_API);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('API error: ' + (data.error?.info || 'Unknown error'));
        }
        
        const result = this.currencyList
            .filter(c => c.type === 'fiat')
            .map(currency => {
                const rate = data.rates[currency.id];
                return {
                    ...currency,
                    price: rate ? (1 / rate) : 0, // Конвертируем в цену за 1 единицу валюты в USD
                    change24h: 0, // API не предоставляет данные об изменениях
                    lastUpdated: new Date(data.date).getTime() / 1000
                };
            });
        
        // Кешируем результат (фиатные валюты обновляются реже)
        this.cache.fiat = {
            data: result,
            timestamp: Date.now(),
            duration: 300000 // 5 минут
        };
        
        return result;
    }
    
    // Мягкое обновление карточек валют без полной перерисовки
    softUpdateCurrencyCards() {
        if (!this.currencies) return;
        
        this.currencies.forEach(currency => {
            const cardElement = document.querySelector(`[data-currency-id="${currency.id}"]`);
            if (cardElement) {
                const priceElement = cardElement.querySelector('.currency-price');
                const changeElement = cardElement.querySelector('.currency-change');
                
                if (priceElement) {
                    priceElement.textContent = currency.type === 'crypto' 
                        ? this.formatPrice(currency.price)
                        : currency.price.toFixed(4);
                }
                
                if (changeElement && currency.change24h !== 0) {
                    const isPositive = currency.change24h > 0;
                    changeElement.textContent = `${isPositive ? '+' : ''}${currency.change24h.toFixed(2)}%`;
                    changeElement.className = `currency-change text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`;
                }
                
                // Добавляем эффект обновления
                cardElement.classList.add('pulse-update');
                setTimeout(() => cardElement.classList.remove('pulse-update'), 600);
            }
        });
    }
    
    // Отображение валют
    renderCurrencies() {
        const grid = document.getElementById('currency-grid');
        const filteredCurrencies = this.getFilteredCurrencies();
        
        if (filteredCurrencies.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-star text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-400">
                        ${this.currentFilter === 'favorites' ? 'Нет избранных валют' : 'Нет данных для отображения'}
                    </p>
                </div>
            `;
            return;
        }
        
        // Сортируем по приоритету для лучшей производительности
        const sortedCurrencies = filteredCurrencies.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return b.price - a.price; // По убыванию цены внутри одного приоритета
        });
        
        // Используем DocumentFragment для оптимизации DOM операций
        const fragment = document.createDocumentFragment();
        
        // Рендерим приоритетные валюты сначала (priority 1-2)
        const priorityCurrencies = sortedCurrencies.filter(c => c.priority <= 2);
        const otherCurrencies = sortedCurrencies.filter(c => c.priority > 2);
        
        // Рендерим приоритетные валюты немедленно
        priorityCurrencies.forEach(currency => {
            const cardElement = document.createElement('div');
            cardElement.innerHTML = this.createCurrencyCard(currency);
            fragment.appendChild(cardElement.firstElementChild);
        });
        
        // Очищаем и добавляем приоритетные валюты
        grid.innerHTML = '';
        grid.appendChild(fragment);
        
        // Ленивая загрузка остальных валют
        if (otherCurrencies.length > 0) {
            setTimeout(() => {
                this.renderRemainingCurrencies(otherCurrencies, grid);
            }, 100);
        }
        
        // Оптимизированная анимация появления
        this.animateCardAppearance(grid);
    }
    
    // Рендеринг оставшихся валют с ленивой загрузкой
    renderRemainingCurrencies(currencies, grid) {
        const batchSize = 8; // Рендерим по 8 карточек за раз
        let currentIndex = 0;
        
        const renderBatch = () => {
            const batch = currencies.slice(currentIndex, currentIndex + batchSize);
            const fragment = document.createDocumentFragment();
            
            batch.forEach(currency => {
                const cardElement = document.createElement('div');
                cardElement.innerHTML = this.createCurrencyCard(currency);
                const card = cardElement.firstElementChild;
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                fragment.appendChild(card);
            });
            
            grid.appendChild(fragment);
            
            // Анимируем появление новой порции
            setTimeout(() => {
                const newCards = Array.from(grid.children).slice(-batch.length);
                newCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 40);
                });
            }, 50);
            
            currentIndex += batchSize;
            
            // Продолжаем рендерить, если есть еще валюты
            if (currentIndex < currencies.length) {
                setTimeout(renderBatch, 150);
            }
        };
        
        renderBatch();
    }
    
    // Оптимизированная анимация появления карточек
    animateCardAppearance(grid) {
        const cards = grid.querySelectorAll('.currency-card');
        cards.forEach((card, index) => {
            if (index < 16) { // Анимируем только первые 16 карточек
                setTimeout(() => {
                    card.classList.add('fade-in');
                }, index * 30);
            }
        });
    }
    
    // Создание карточки валюты
    createCurrencyCard(currency) {
        const isFavorite = this.favorites.includes(currency.id);
        const priceChangeClass = this.getPriceChangeClass(currency.change24h);
        const priceChangeIcon = currency.change24h > 0 ? 'fa-arrow-up' : currency.change24h < 0 ? 'fa-arrow-down' : 'fa-minus';
        
        return `
            <div class="currency-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700" data-currency-id="${currency.id}">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold mr-3">
                            ${currency.symbol.substring(0, 2)}
                        </div>
                        <div>
                            <h3 class="currency-name font-semibold text-gray-900 dark:text-white">${currency.name}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${currency.symbol}</p>
                        </div>
                    </div>
                    <button class="favorite-star ${isFavorite ? 'active' : ''}" 
                            onclick="dashboard.toggleFavorite('${currency.id}')"
                            title="${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <div class="currency-price text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        ${currency.type === 'crypto' ? '$' + this.formatPrice(currency.price) : currency.price.toFixed(4)}
                    </div>
                    ${currency.change24h !== 0 ? `
                        <div class="currency-change flex items-center ${priceChangeClass} px-2 py-1 rounded-full text-sm font-medium">
                            <i class="fas ${priceChangeIcon} mr-1"></i>
                            ${(currency.change24h > 0 ? '+' : '')}${currency.change24h.toFixed(2)}%
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                        ${currency.type === 'crypto' ? 'Криптовалюта' : 'Фиатная валюта'}
                    </span>
                    ${currency.type === 'crypto' ? `
                        <button class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                onclick="dashboard.showChart('${currency.id}', '${currency.name}')">
                            <i class="fas fa-chart-line mr-1"></i>
                            График
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // Получение класса для цветовой индикации изменения цены
    getPriceChangeClass(change) {
        if (change > 0) return 'price-up';
        if (change < 0) return 'price-down';
        return 'price-neutral';
    }
    
    // Форматирование цены
    formatPrice(price) {
        if (price >= 1000) {
            return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (price >= 1) {
            return price.toFixed(4);
        } else if (price >= 0.01) {
            return price.toFixed(6);
        } else {
            return price.toFixed(8);
        }
    }
    
    // Переключение избранного
    toggleFavorite(currencyId) {
        const index = this.favorites.indexOf(currencyId);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(currencyId);
        }
        
        this.saveFavorites();
        this.renderCurrencies();
        
        // Добавляем анимацию пульсации
        const card = document.querySelector(`[onclick="dashboard.toggleFavorite('${currencyId}')"]`).closest('.currency-card');
        card.classList.add('pulse-update');
        setTimeout(() => card.classList.remove('pulse-update'), 600);
    }
    
    // Сохранение избранного в localStorage
    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }
    
    // Загрузка избранного из localStorage
    loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem('favorites')) || [];
        } catch {
            return [];
        }
    }
    
    // Установка фильтра
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Обновляем состояние кнопок
        const showAllBtn = document.getElementById('show-all');
        const showFavoritesBtn = document.getElementById('show-favorites');
        
        if (filter === 'all') {
            showAllBtn.className = 'px-3 py-1 text-sm rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700';
            showFavoritesBtn.className = 'px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
        } else {
            showFavoritesBtn.className = 'px-3 py-1 text-sm rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700';
            showAllBtn.className = 'px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
        }
        
        this.renderCurrencies();
    }
    
    // Получение отфильтрованных валют
    getFilteredCurrencies() {
        if (this.currentFilter === 'favorites') {
            return this.currencies.filter(currency => this.favorites.includes(currency.id));
        }
        return this.currencies;
    }
    
    // Показ графика
    async showChart(currencyId, currencyName) {
        try {
            this.currentCurrency = { id: currencyId, name: currencyName };
            
            const modal = document.getElementById('chart-modal');
            const title = document.getElementById('chart-title');
            
            // Сброс к первому временному промежутку
            this.currentTimeframe = { days: 1 };
            this.updateTimeframeButtons();
            
            title.textContent = `${currencyName} - График цены`;
            modal.classList.remove('hidden');
            modal.classList.add('modal-backdrop');
            
            // Загружаем данные для текущего временного промежутка
            await this.loadChartData();
            
        } catch (error) {
            console.error('Ошибка при загрузке графика:', error);
            alert('Не удалось загрузить график. Попробуйте позже.');
            this.closeChart();
        }
    }
    
    // Установка временного промежутка
    async setTimeframe(button) {
        const days = parseInt(button.dataset.days);
        
        this.currentTimeframe = { days };
        this.updateTimeframeButtons();
        
        if (this.currentCurrency) {
            await this.loadChartData();
        }
    }
    
    // Обновление состояния кнопок временных промежутков
    updateTimeframeButtons() {
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.days) === this.currentTimeframe.days) {
                btn.classList.add('active');
            }
        });
    }
    
    // Загрузка данных графика
    async loadChartData() {
        try {
            this.showChartLoading(true);
            
            // Добавляем небольшую задержку для избежания слишком частых запросов
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Используем только параметр days без interval для совместимости с бесплатным API
            const response = await fetch(
                `${this.COINGECKO_API}/coins/${this.currentCurrency.id}/market_chart?vs_currency=usd&days=${this.currentTimeframe.days}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Проверяем, что данные получены корректно
            if (!data.prices || data.prices.length === 0) {
                throw new Error('Получены пустые данные графика');
            }
            
            this.renderChart(data.prices, this.currentCurrency.name);
            
        } catch (error) {
            console.error('Ошибка при загрузке данных графика:', error);
            
            // Показываем более информативную ошибку
            let errorMessage = 'Не удалось загрузить данные графика';
            if (error.message.includes('404')) {
                errorMessage = 'Данные для этой валюты недоступны';
            } else if (error.message.includes('503') || error.message.includes('502')) {
                errorMessage = 'Сервис временно недоступен, попробуйте позже';
            } else if (error.message.includes('network') || error.name === 'TypeError') {
                errorMessage = 'Проблема с подключением к интернету';
            }
            
            this.showChartError(errorMessage);
        } finally {
            this.showChartLoading(false);
        }
    }
    
    // Показ/скрытие индикатора загрузки графика
    showChartLoading(show) {
        const loading = document.getElementById('chart-loading');
        const chartCanvas = document.querySelector('#price-chart').parentElement;
        
        if (show) {
            loading.classList.remove('hidden');
            chartCanvas.style.opacity = '0.3';
        } else {
            loading.classList.add('hidden');
            chartCanvas.style.opacity = '1';
        }
    }
    
    // Показ ошибки графика
    showChartError(message) {
        const canvas = document.getElementById('price-chart');
        const ctx = canvas.getContext('2d');
        
        // Уничтожаем предыдущий график, если он есть
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        // Устанавливаем размеры canvas
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Показываем сообщение об ошибке
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Разбиваем длинное сообщение на строки
        const words = message.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < canvas.width - 40) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        // Выводим строки
        const lineHeight = 20;
        const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
        });
        
        // Добавляем иконку ошибки
        ctx.font = '24px FontAwesome';
        ctx.fillText('⚠', canvas.width / 2, startY - 40);
    }
    
    // Отрисовка графика
    renderChart(priceData, currencyName) {
        const ctx = document.getElementById('price-chart').getContext('2d');
        
        // Уничтожаем предыдущий график
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Форматируем метки в зависимости от временного промежутка
        const labels = priceData.map(point => {
            const date = new Date(point[0]);
            
            if (this.currentTimeframe.days === 1) {
                // Для 24 часов показываем время
                return date.toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } else if (this.currentTimeframe.days <= 30) {
                // Для месяца показываем день и месяц
                return date.toLocaleDateString('ru-RU', { 
                    month: 'short', 
                    day: 'numeric' 
                });
            } else {
                // Для длительных периодов показываем месяц и год
                return date.toLocaleDateString('ru-RU', { 
                    month: 'short', 
                    year: '2-digit' 
                });
            }
        });
        
        const prices = priceData.map(point => point[1]);
        
        // Определяем цвет линии на основе общего тренда
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const isPositive = lastPrice > firstPrice;
        const changePercent = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
        
        const lineColor = isPositive ? '#10b981' : '#ef4444';
        const gradientColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        
        // Создаем градиент
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, gradientColor);
        gradient.addColorStop(1, 'transparent');
        
        // Настраиваем размер точек в зависимости от количества данных
        const pointRadius = priceData.length > 100 ? 0 : priceData.length > 50 ? 1 : 2;
        const pointHoverRadius = pointRadius + 2;
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${currencyName} (USD)`,
                    data: prices,
                    borderColor: lineColor,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointBackgroundColor: lineColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1,
                    pointRadius: pointRadius,
                    pointHoverRadius: pointHoverRadius
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: lineColor,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `$${context.parsed.y.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 6
                                })}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6b7280',
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6b7280',
                            callback: function(value) {
                                if (value >= 1000) {
                                    return '$' + (value / 1000).toFixed(1) + 'K';
                                } else if (value >= 1) {
                                    return '$' + value.toFixed(2);
                                } else {
                                    return '$' + value.toFixed(6);
                                }
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        
        // Обновляем информацию о графике
        this.updateChartInfo(priceData, changePercent, isPositive);
    }
    
    // Обновление информации о графике
    updateChartInfo(priceData, changePercent, isPositive) {
        const periodElement = document.getElementById('chart-period');
        const dataPointsElement = document.getElementById('chart-data-points');
        
        // Определяем название периода
        let periodName = '';
        switch (this.currentTimeframe.days) {
            case 1:
                periodName = '24 часа';
                break;
            case 7:
                periodName = '7 дней';
                break;
            case 30:
                periodName = '30 дней';
                break;
            case 90:
                periodName = '90 дней';
                break;
            case 365:
                periodName = '1 год';
                break;
            default:
                periodName = `${this.currentTimeframe.days} дней`;
        }
        
        const changeColor = isPositive ? '#10b981' : '#ef4444';
        const changeIcon = isPositive ? '↗' : '↘';
        
        periodElement.innerHTML = `
            <span>Период: ${periodName}</span>
            <span style="color: ${changeColor}; margin-left: 1rem;">
                ${changeIcon} ${Math.abs(changePercent)}%
            </span>
        `;
        
        dataPointsElement.textContent = `Точек данных: ${priceData.length}`;
    }
    
    // Закрытие графика
    closeChart() {
        const modal = document.getElementById('chart-modal');
        modal.classList.add('hidden');
        modal.classList.remove('modal-backdrop');
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        // Сбрасываем текущую валюту
        this.currentCurrency = null;
        
        // Скрываем индикатор загрузки
        this.showChartLoading(false);
    }
    
    // Запуск автообновления
    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            this.fetchCurrencyData();
        }, this.UPDATE_INTERVAL);
    }
    
    // Остановка автообновления
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    // Обновление времени последнего обновления
    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        document.getElementById('last-update').textContent = `Обновлено: ${timeString}`;
    }
    
    // Показ/скрытие загрузки
    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.classList.toggle('hidden', !show);
    }
    
    // Показ ошибки
    showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    
    // Скрытие ошибки
    hideError() {
        document.getElementById('error-message').classList.add('hidden');
    }
    
    // Поиск валют
    searchCurrencies(query) {
        if (!query.trim()) {
            this.renderCurrencies();
            return;
        }
        
        const filteredCurrencies = this.currencies.filter(currency =>
            currency.name.toLowerCase().includes(query.toLowerCase()) ||
            currency.symbol.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderFilteredCurrencies(filteredCurrencies);
    }
    
    // Отображение отфильтрованных валют
    renderFilteredCurrencies(currencies) {
        const grid = document.getElementById('currency-grid');
        
        if (currencies.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-search text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-400">Валюты не найдены</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = currencies.map(currency => this.createCurrencyCard(currency)).join('');
        
        // Добавляем анимацию появления
        setTimeout(() => {
            grid.querySelectorAll('.currency-card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('fade-in');
                }, index * 50);
            });
        }, 50);
    }
    
    // Обновление статистики
    updateStatistics() {
        if (this.currencies.length === 0) return;
        
        const cryptoCurrencies = this.currencies.filter(c => c.type === 'crypto');
        
        // Общий объем (примерная оценка)
        const totalVolume = cryptoCurrencies.reduce((sum, currency) => {
            return sum + (currency.price * 1000000); // Примерный объем
        }, 0);
        
        document.getElementById('total-volume').textContent = this.formatLargeNumber(totalVolume);
        
        // Топ растущая валюта
        const topGainer = cryptoCurrencies.reduce((max, currency) => 
            currency.change24h > (max?.change24h || -Infinity) ? currency : max
        , null);
        
        if (topGainer) {
            document.getElementById('top-gainer').textContent = 
                `${topGainer.symbol} +${topGainer.change24h.toFixed(2)}%`;
        }
        
        // Топ падающая валюта
        const topLoser = cryptoCurrencies.reduce((min, currency) => 
            currency.change24h < (min?.change24h || Infinity) ? currency : min
        , null);
        
        if (topLoser) {
            document.getElementById('top-loser').textContent = 
                `${topLoser.symbol} ${topLoser.change24h.toFixed(2)}%`;
        }
        
        // Количество активных валют
        document.getElementById('active-currencies').textContent = this.currencies.length;
        
        // Анимируем статистические карточки
        this.animateStatCards();
    }
    
    // Форматирование больших чисел
    formatLargeNumber(num) {
        if (num >= 1e12) return '$' + (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'K';
        return '$' + num.toFixed(0);
    }
    
    // Показ калькулятора
    showCalculator() {
        const modal = document.getElementById('calculator-modal');
        modal.classList.remove('hidden');
        
        // Заполняем селекты валютами
        this.populateCalculatorSelects();
    }
    
    // Заполнение селектов калькулятора
    populateCalculatorSelects() {
        const fromSelect = document.getElementById('calc-from');
        const toSelect = document.getElementById('calc-to');
        
        const options = this.currencies.map(currency => 
            `<option value="${currency.id}">${currency.name} (${currency.symbol})</option>`
        ).join('');
        
        fromSelect.innerHTML = '<option value="">Выберите валюту...</option>' + options;
        toSelect.innerHTML = '<option value="">Выберите валюту...</option>' + options;
    }
    
    // Расчет конвертации
    calculateConversion() {
        const fromId = document.getElementById('calc-from').value;
        const toId = document.getElementById('calc-to').value;
        const amount = parseFloat(document.getElementById('calc-amount').value) || 0;
        
        if (!fromId || !toId || amount <= 0) {
            document.getElementById('calc-result').textContent = '-';
            return;
        }
        
        const fromCurrency = this.currencies.find(c => c.id === fromId);
        const toCurrency = this.currencies.find(c => c.id === toId);
        
        if (!fromCurrency || !toCurrency) {
            document.getElementById('calc-result').textContent = '-';
            return;
        }
        
        const result = (amount * fromCurrency.price) / toCurrency.price;
        document.getElementById('calc-result').textContent = this.formatPrice(result) + ' ' + toCurrency.symbol;
    }
    
    // Закрытие калькулятора
    closeCalculator() {
        document.getElementById('calculator-modal').classList.add('hidden');
    }
    
    // Показ портфеля
    showPortfolio() {
        const modal = document.getElementById('portfolio-modal');
        modal.classList.remove('hidden');
        
        this.populatePortfolioSelect();
        this.renderPortfolio();
    }
    
    // Заполнение селекта портфеля
    populatePortfolioSelect() {
        const select = document.getElementById('portfolio-currency');
        const options = this.currencies.map(currency => 
            `<option value="${currency.id}">${currency.name} (${currency.symbol})</option>`
        ).join('');
        
        select.innerHTML = '<option value="">Выберите валюту...</option>' + options;
    }
    
    // Добавление в портфель
    addToPortfolio() {
        const currencyId = document.getElementById('portfolio-currency').value;
        const amount = parseFloat(document.getElementById('portfolio-amount').value);
        const buyPrice = parseFloat(document.getElementById('portfolio-price').value);
        
        if (!currencyId || !amount || amount <= 0 || !buyPrice || buyPrice <= 0) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }
        
        const currency = this.currencies.find(c => c.id === currencyId);
        if (!currency) return;
        
        const portfolioItem = {
            id: currencyId,
            name: currency.name,
            symbol: currency.symbol,
            amount: amount,
            buyPrice: buyPrice,
            addedAt: Date.now()
        };
        
        this.portfolio.push(portfolioItem);
        this.savePortfolio();
        this.renderPortfolio();
        
        // Очищаем форму
        document.getElementById('portfolio-currency').value = '';
        document.getElementById('portfolio-amount').value = '';
        document.getElementById('portfolio-price').value = '';
        
        this.showNotification('Актив добавлен в портфель', 'success');
    }
    
    // Отрисовка портфеля
    renderPortfolio() {
        const container = document.getElementById('portfolio-list');
        
        if (this.portfolio.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-briefcase text-4xl mb-4"></i>
                    <p>Ваш портфель пуст. Добавьте активы выше.</p>
                </div>
            `;
            this.updatePortfolioSummary(0, 0, 0);
            return;
        }
        
        let totalValue = 0;
        let totalChange = 0;
        
        const portfolioHtml = this.portfolio.map((item, index) => {
            const currentCurrency = this.currencies.find(c => c.id === item.id);
            if (!currentCurrency) return '';
            
            const currentValue = item.amount * currentCurrency.price;
            const investedValue = item.amount * item.buyPrice;
            const profit = currentValue - investedValue;
            const profitPercent = (profit / investedValue) * 100;
            
            totalValue += currentValue;
            totalChange += profit;
            
            const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
            
            return `
                <div class="portfolio-item">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                                ${item.symbol.substring(0, 2)}
                            </div>
                            <div>
                                <div class="font-semibold text-gray-900 dark:text-white">${item.name}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">${item.amount} ${item.symbol}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold text-gray-900 dark:text-white">$${currentValue.toFixed(2)}</div>
                            <div class="${profitClass} text-sm">
                                ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)
                            </div>
                        </div>
                        <button onclick="dashboard.removeFromPortfolio(${index})" 
                                class="ml-4 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = portfolioHtml;
        this.updatePortfolioSummary(totalValue, totalChange, this.portfolio.length);
    }
    
    // Обновление сводки портфеля
    updatePortfolioSummary(totalValue, totalChange, assetsCount) {
        document.getElementById('portfolio-total').textContent = `$${totalValue.toFixed(2)}`;
        
        const changeElement = document.getElementById('portfolio-change');
        changeElement.textContent = `${totalChange >= 0 ? '+' : ''}$${totalChange.toFixed(2)}`;
        changeElement.className = `text-xl font-bold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`;
        
        document.getElementById('portfolio-assets').textContent = assetsCount;
    }
    
    // Удаление из портфеля
    removeFromPortfolio(index) {
        this.portfolio.splice(index, 1);
        this.savePortfolio();
        this.renderPortfolio();
        this.showNotification('Актив удален из портфеля', 'info');
    }
    
    // Закрытие портфеля
    closePortfolio() {
        document.getElementById('portfolio-modal').classList.add('hidden');
    }
    
    // Сохранение портфеля
    savePortfolio() {
        localStorage.setItem('portfolio', JSON.stringify(this.portfolio));
    }
    
    // Загрузка портфеля
    loadPortfolio() {
        try {
            return JSON.parse(localStorage.getItem('portfolio')) || [];
        } catch {
            return [];
        }
    }
    
    // Экспорт данных
    exportData() {
        const data = {
            currencies: this.currencies,
            favorites: this.favorites,
            portfolio: this.portfolio,
            exportDate: new Date().toISOString()
        };
        
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `currency-dashboard-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Данные экспортированы', 'success');
    }
    
    // Переключение звука
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('soundEnabled', this.soundEnabled);
        
        const button = document.getElementById('sound-toggle');
        const icon = document.getElementById('sound-icon');
        
        if (this.soundEnabled) {
            button.classList.remove('muted');
            icon.className = 'fas fa-volume-up';
        } else {
            button.classList.add('muted');
            icon.className = 'fas fa-volume-mute';
        }
        
        this.showNotification(
            this.soundEnabled ? 'Звук включен' : 'Звук выключен', 
            'info'
        );
    }
    
    // Показ уведомления
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Показываем уведомление
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Воспроизводим звук
        if (this.soundEnabled) {
            this.playNotificationSound(type);
        }
        
        // Удаляем уведомление через 4 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    // Воспроизведение звука уведомления
    playNotificationSound(type) {
        // Создаем простые звуки с помощью Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Разные частоты для разных типов уведомлений
        const frequencies = {
            success: [523, 659, 783], // C, E, G
            error: [400, 300], // Низкие частоты
            info: [523, 659] // C, E
        };
        
        const freqs = frequencies[type] || frequencies.info;
        let time = audioContext.currentTime;
        
        freqs.forEach((freq, index) => {
            oscillator.frequency.setValueAtTime(freq, time);
            gainNode.gain.setValueAtTime(0.1, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            time += 0.15;
        });
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(time);
    }
    
    // Проверка ценовых алертов
    checkPriceAlerts() {
        this.currencies.forEach(currency => {
            const lastPrice = this.lastPrices[currency.id];
            if (lastPrice && Math.abs(currency.change24h) > 10) {
                // Уведомление о значительном изменении цены
                this.showNotification(
                    `${currency.name}: ${currency.change24h > 0 ? '+' : ''}${currency.change24h.toFixed(2)}%`,
                    currency.change24h > 0 ? 'success' : 'error'
                );
            }
            this.lastPrices[currency.id] = currency.price;
        });
    }
    
    // Загрузка ценовых алертов
    loadPriceAlerts() {
        try {
            return JSON.parse(localStorage.getItem('priceAlerts')) || [];
        } catch {
            return [];
        }
    }
    
    // Улучшенная анимация синхронизации
    animateSync() {
        const syncIcon = document.getElementById('sync-icon');
        const syncRing = document.getElementById('sync-ring');
        
        // Запускаем анимации
        syncIcon.classList.add('sync-spin');
        syncRing.classList.add('sync-ring-active');
        
        // Показываем прогресс-бар
        this.showUpdateProgress();
        
        // Убираем анимации
        setTimeout(() => {
            syncIcon.classList.remove('sync-spin');
            syncRing.classList.remove('sync-ring-active');
        }, 1500);
    }
    
    // Показ прогресса обновления
    showUpdateProgress() {
        const progressContainer = document.getElementById('update-progress');
        const progressFill = document.getElementById('progress-fill');
        
        progressContainer.classList.remove('hidden');
        progressFill.style.width = '0%';
        
        // Имитируем прогресс загрузки
        const steps = [10, 25, 45, 70, 85, 100];
        let currentStep = 0;
        
        const updateProgress = () => {
            if (currentStep < steps.length) {
                progressFill.style.width = steps[currentStep] + '%';
                currentStep++;
                setTimeout(updateProgress, 200);
            } else {
                // Скрываем прогресс-бар
                setTimeout(() => {
                    progressContainer.classList.add('hidden');
                    progressFill.style.width = '0%';
                }, 300);
            }
        };
        
        updateProgress();
    }
    
    // Анимация обновления карточек
    animateCardUpdates() {
        const cards = document.querySelectorAll('.currency-card');
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('updating');
                setTimeout(() => {
                    card.classList.remove('updating');
                }, 1000);
                         }, index * 100);
         });
     }
     
     // Анимация статистических карточек
     animateStatCards() {
         const statCards = document.querySelectorAll('.stat-card');
         
         statCards.forEach((card, index) => {
             setTimeout(() => {
                 card.classList.add('updating');
                 setTimeout(() => {
                     card.classList.remove('updating');
                 }, 800);
             }, index * 150);
         });
     }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new CurrencyDashboard();
});

// Обработка видимости страницы для оптимизации
document.addEventListener('visibilitychange', () => {
    if (window.dashboard) {
        if (document.hidden) {
            window.dashboard.stopAutoUpdate();
        } else {
            window.dashboard.startAutoUpdate();
            window.dashboard.fetchCurrencyData(); // Обновляем данные при возвращении на страницу
        }
    }
});

// ===== TAB SYSTEM MANAGER ===== //
class TabManager {
    constructor() {
        this.currentTab = 'market';
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.init();
    }

    init() {
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Initialize with market tab
        this.switchTab('market');
        
        // Load initial data for tabs
        this.loadNewsData();
        this.loadAnalyticsData();
        
        // Setup news filters
        this.setupNewsFilters();
    }

    switchTab(tabId) {
        if (this.currentTab === tabId) return;

        // Add slide out animation to current tab
        const currentTabContent = document.getElementById(`${this.currentTab}-tab`);
        if (currentTabContent) {
            currentTabContent.classList.add('tab-slide-out');
            
            setTimeout(() => {
                currentTabContent.classList.remove('active', 'tab-slide-out');
            }, 300);
        }

        // Update tab buttons
        this.tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });

        // Show new tab content with animation
        setTimeout(() => {
            const newTabContent = document.getElementById(`${tabId}-tab`);
            if (newTabContent) {
                newTabContent.classList.add('active', 'tab-slide-in');
                
                setTimeout(() => {
                    newTabContent.classList.remove('tab-slide-in');
                }, 500);
            }
        }, 300);

        this.currentTab = tabId;

        // Load tab-specific data
        this.loadTabData(tabId);
    }

    loadTabData(tabId) {
        switch(tabId) {
            case 'news':
                this.loadNewsData();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
            case 'alerts':
                this.loadAlertsData();
                break;
            case 'strategies':
                this.loadStrategiesData();
                break;
        }
    }

    setupNewsFilters() {
        const newsFilters = document.querySelectorAll('.news-filter');
        newsFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                newsFilters.forEach(f => f.classList.remove('active'));
                e.target.classList.add('active');
                
                const filterType = e.target.dataset.filter;
                this.filterNews(filterType);
            });
        });
    }

    filterNews(filterType) {
        const newsItems = document.querySelectorAll('#news-grid article');
        newsItems.forEach(item => {
            const category = item.querySelector('.text-xs').textContent.trim();
            if (filterType === 'all' || category === filterType) {
                item.style.display = 'block';
                item.classList.add('tab-slide-in');
            } else {
                item.style.display = 'none';
            }
        });
    }

    loadNewsData() {
        const newsGrid = document.getElementById('news-grid');
        if (!newsGrid) return;
        
        // Проверяем, загружены ли уже новости
        if (newsGrid.children.length > 0) return;

        // Simulated news data
        const newsItems = [
            {
                title: "Bitcoin достигает нового максимума в $120,000",
                excerpt: "Ведущая криптовалюта продолжает бычий тренд на фоне институционального интереса",
                time: "2 часа назад",
                category: "bitcoin",
                icon: "fab fa-bitcoin"
            },
            {
                title: "Ethereum 2.0 показывает впечатляющие результаты",
                excerpt: "Новая версия сети демонстрирует высокую скорость и низкие комиссии",
                time: "4 часа назад",
                category: "ethereum",
                icon: "fab fa-ethereum"
            },
            {
                title: "Регуляторы обсуждают новые правила для криптовалют",
                excerpt: "Глобальные регуляторы работают над едиными стандартами",
                time: "6 часов назад",
                category: "regulation",
                icon: "fas fa-gavel"
            },
            {
                title: "Анализ рынка: что ждет криптовалюты в 2024",
                excerpt: "Эксперты делятся прогнозами на следующий год",
                time: "8 часов назад",
                category: "market",
                icon: "fas fa-chart-line"
            },
            {
                title: "DeFi протоколы набирают популярность",
                excerpt: "Децентрализованные финансы привлекают все больше пользователей",
                time: "10 часов назад",
                category: "market",
                icon: "fas fa-coins"
            },
            {
                title: "Новые функции в кошельках для криптовалют",
                excerpt: "Разработчики представили улучшенные возможности безопасности",
                time: "12 часов назад",
                category: "bitcoin",
                icon: "fas fa-wallet"
            }
        ];

        newsGrid.innerHTML = newsItems.map(item => `
            <article class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 gradient-card-hover">
                <div class="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                    <div class="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <i class="${item.icon} text-white text-4xl"></i>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                            ${item.category}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${item.time}</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        ${item.title}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                        ${item.excerpt}
                    </p>
                    <button class="mt-4 text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline flex items-center">
                        Читать далее 
                        <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </article>
        `).join('');
    }

    loadAnalyticsData() {
        // Simulate loading analytics data
        const sentimentChart = document.getElementById('sentiment-chart');
        if (sentimentChart) {
            sentimentChart.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="relative mb-4">
                            <div class="w-32 h-32 mx-auto">
                                <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path class="text-gray-300 dark:text-gray-600" stroke="currentColor" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                                    <path class="text-green-500" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <span class="text-2xl font-bold text-green-600">75%</span>
                                </div>
                            </div>
                        </div>
                        <p class="text-gray-600 dark:text-gray-400 font-medium">Позитивное настроение</p>
                        <p class="text-sm text-gray-500 mt-2">На основе анализа 10,000+ источников</p>
                    </div>
                </div>
            `;
        }

        // Update fear and greed index with animation
        const fearGreedIndex = document.getElementById('fear-greed-index');
        if (fearGreedIndex) {
            let currentValue = 0;
            const targetValue = 75;
            const animation = setInterval(() => {
                currentValue += 2;
                fearGreedIndex.textContent = currentValue;
                if (currentValue >= targetValue) {
                    clearInterval(animation);
                }
            }, 50);
        }
    }

    loadAlertsData() {
        // Update alert counts with animation
        const counters = [
            { id: 'price-alerts-count', value: 0 },
            { id: 'percent-alerts-count', value: 0 },
            { id: 'news-alerts-count', value: 0 }
        ];

        counters.forEach(counter => {
            const element = document.getElementById(counter.id);
            if (element) {
                element.textContent = counter.value;
            }
        });
    }

    loadStrategiesData() {
        // Add interactive features to strategy cards
        const strategyCards = document.querySelectorAll('#strategies-tab .bg-gradient-to-br');
        strategyCards.forEach(card => {
            card.classList.add('gradient-card-hover');
            
            const button = card.querySelector('button');
            if (button) {
                button.addEventListener('click', () => {
                    this.showNotification('Функция настройки стратегии будет доступна в следующем обновлении!', 'info');
                });
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize tab manager when DOM is loaded
let tabManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        tabManager = new TabManager();
    });
} else {
    tabManager = new TabManager();
}