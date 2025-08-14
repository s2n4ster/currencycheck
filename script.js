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
        this.currentTimeframe = { days: 7, interval: 'daily' };
        
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
        const response = await fetch(this.EXCHANGE_API);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('API error: ' + (data.error?.info || 'Unknown error'));
        }
        
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
            this.currentCurrency = { id: currencyId, name: currencyName };
            
            const modal = document.getElementById('chart-modal');
            const title = document.getElementById('chart-title');
            
            // Сброс к первому временному промежутку
            this.currentTimeframe = { days: 1, interval: 'hourly' };
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
        const interval = button.dataset.interval;
        
        this.currentTimeframe = { days, interval };
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
            
            // Определяем интервал на основе временного промежутка
            let interval = this.currentTimeframe.interval;
            if (this.currentTimeframe.days === 1) {
                interval = 'hourly';
            } else if (this.currentTimeframe.days <= 30) {
                interval = 'daily';
            } else {
                interval = 'daily';
            }
            
            const response = await fetch(
                `${this.COINGECKO_API}/coins/${this.currentCurrency.id}/market_chart?vs_currency=usd&days=${this.currentTimeframe.days}&interval=${interval}`
            );
            
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные графика');
            }
            
            const data = await response.json();
            this.renderChart(data.prices, this.currentCurrency.name);
            
        } catch (error) {
            console.error('Ошибка при загрузке данных графика:', error);
            this.showChartError('Не удалось загрузить данные графика');
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
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Показываем сообщение об ошибке
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
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