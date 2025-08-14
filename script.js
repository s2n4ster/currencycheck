// Live Currency Dashboard - Основная логика приложения

class CurrencyDashboard {
    constructor() {
        // Конфигурация
        this.UPDATE_INTERVAL = 15000; // 15 секунд
        this.COINGECKO_API = 'https://api.coingecko.com/api/v3';
        this.EXCHANGE_API = 'https://api.exchangerate.host/latest';
        
        // Состояние приложения
        this.currencies = [];
        this.favorites = this.loadFavorites();
        this.currentFilter = 'all'; // 'all' или 'favorites'
        this.updateInterval = null;
        this.chart = null;
        
        // Список отслеживаемых валют и криптовалют
        this.currencyList = [
            // Криптовалюты
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', type: 'crypto' },
            { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', type: 'crypto' },
            { id: 'binancecoin', name: 'BNB', symbol: 'BNB', type: 'crypto' },
            { id: 'cardano', name: 'Cardano', symbol: 'ADA', type: 'crypto' },
            { id: 'solana', name: 'Solana', symbol: 'SOL', type: 'crypto' },
            { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', type: 'crypto' },
            // Фиатные валюты (относительно USD)
            { id: 'EUR', name: 'Euro', symbol: 'EUR', type: 'fiat' },
            { id: 'GBP', name: 'British Pound', symbol: 'GBP', type: 'fiat' },
            { id: 'JPY', name: 'Japanese Yen', symbol: 'JPY', type: 'fiat' },
            { id: 'RUB', name: 'Russian Ruble', symbol: 'RUB', type: 'fiat' },
            { id: 'CNY', name: 'Chinese Yuan', symbol: 'CNY', type: 'fiat' },
            { id: 'CAD', name: 'Canadian Dollar', symbol: 'CAD', type: 'fiat' }
        ];
        
        this.init();
    }
    
    // Инициализация приложения
    init() {
        this.setupEventListeners();
        this.initTheme();
        this.fetchCurrencyData();
        this.startAutoUpdate();
        
        console.log('Currency Dashboard инициализирован');
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
    
    // Получение данных о валютах
    async fetchCurrencyData() {
        try {
            this.showLoading(true);
            this.hideError();
            
            // Получаем данные криптовалют и фиатных валют параллельно
            const [cryptoData, fiatData] = await Promise.all([
                this.fetchCryptoData(),
                this.fetchFiatData()
            ]);
            
            this.currencies = [...cryptoData, ...fiatData];
            this.renderCurrencies();
            this.updateLastUpdateTime();
            
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
            this.showError('Не удалось загрузить данные о валютах. Проверьте подключение к интернету.');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Получение данных криптовалют
    async fetchCryptoData() {
        const cryptoIds = this.currencyList
            .filter(c => c.type === 'crypto')
            .map(c => c.id)
            .join(',');
            
        const response = await fetch(
            `${this.COINGECKO_API}/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return this.currencyList
            .filter(c => c.type === 'crypto')
            .map(currency => {
                const priceData = data[currency.id];
                return {
                    ...currency,
                    price: priceData?.usd || 0,
                    change24h: priceData?.usd_24h_change || 0,
                    lastUpdated: priceData?.last_updated_at || Date.now() / 1000
                };
            });
    }
    
    // Получение данных фиатных валют
    async fetchFiatData() {
        const response = await fetch(`${this.EXCHANGE_API}?base=USD`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return this.currencyList
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
        
        grid.innerHTML = filteredCurrencies.map(currency => this.createCurrencyCard(currency)).join('');
        
        // Добавляем анимацию появления
        setTimeout(() => {
            grid.querySelectorAll('.currency-card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('fade-in');
                }, index * 50);
            });
        }, 50);
    }
    
    // Создание карточки валюты
    createCurrencyCard(currency) {
        const isFavorite = this.favorites.includes(currency.id);
        const priceChangeClass = this.getPriceChangeClass(currency.change24h);
        const priceChangeIcon = currency.change24h > 0 ? 'fa-arrow-up' : currency.change24h < 0 ? 'fa-arrow-down' : 'fa-minus';
        
        return `
            <div class="currency-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
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
                        $${this.formatPrice(currency.price)}
                    </div>
                    ${currency.change24h !== 0 ? `
                        <div class="flex items-center ${priceChangeClass} px-2 py-1 rounded-full text-sm font-medium">
                            <i class="fas ${priceChangeIcon} mr-1"></i>
                            ${Math.abs(currency.change24h).toFixed(2)}%
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
            const modal = document.getElementById('chart-modal');
            const title = document.getElementById('chart-title');
            
            title.textContent = `${currencyName} - График за 7 дней`;
            modal.classList.remove('hidden');
            modal.classList.add('modal-backdrop');
            
            // Получаем исторические данные
            const response = await fetch(
                `${this.COINGECKO_API}/coins/${currencyId}/market_chart?vs_currency=usd&days=7&interval=daily`
            );
            
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные графика');
            }
            
            const data = await response.json();
            this.renderChart(data.prices, currencyName);
            
        } catch (error) {
            console.error('Ошибка при загрузке графика:', error);
            alert('Не удалось загрузить график. Попробуйте позже.');
            this.closeChart();
        }
    }
    
    // Отрисовка графика
    renderChart(priceData, currencyName) {
        const ctx = document.getElementById('price-chart').getContext('2d');
        
        // Уничтожаем предыдущий график
        if (this.chart) {
            this.chart.destroy();
        }
        
        const labels = priceData.map(point => {
            const date = new Date(point[0]);
            return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
        });
        
        const prices = priceData.map(point => point[1]);
        
        // Определяем цвет линии на основе общего тренда
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const isPositive = lastPrice > firstPrice;
        
        const lineColor = isPositive ? '#10b981' : '#ef4444';
        const gradientColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        
        // Создаем градиент
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, gradientColor);
        gradient.addColorStop(1, 'transparent');
        
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
                    tension: 0.4,
                    pointBackgroundColor: lineColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)'
                        },
                        ticks: {
                            color: '#6b7280'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)'
                        },
                        ticks: {
                            color: '#6b7280',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
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