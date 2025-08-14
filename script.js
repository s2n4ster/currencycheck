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
        this.portfolio = this.loadPortfolio();
        this.searchTimeout = null;
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.priceAlerts = this.loadPriceAlerts();
        this.lastPrices = {};
        
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
        
        // Поиск валют
        document.getElementById('search-input').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.searchCurrencies(e.target.value);
            }, 300);
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
    
    // Получение данных о валютах
    async fetchCurrencyData() {
        try {
            this.showLoading(true);
            this.hideError();
            this.animateSync();
            
            // Получаем данные криптовалют и фиатных валют параллельно
            const [cryptoData, fiatData] = await Promise.all([
                this.fetchCryptoData(),
                this.fetchFiatData()
            ]);
            
            this.currencies = [...cryptoData, ...fiatData];
            this.renderCurrencies();
            this.updateLastUpdateTime();
            this.updateStatistics();
            this.checkPriceAlerts();
            
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
    
    // Анимация иконки синхронизации
    animateSync() {
        const syncIcon = document.getElementById('sync-icon');
        syncIcon.classList.add('sync-spin');
        setTimeout(() => {
            syncIcon.classList.remove('sync-spin');
        }, 1000);
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