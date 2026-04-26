const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let currentMode = 'buy'; // 'buy' or 'sell'

// Elements
const buyTab = document.getElementById('buy-tab');
const sellTab = document.getElementById('sell-tab');
const modeHint = document.getElementById('mode-hint');
const exchangeAmount = document.getElementById('exchange-amount');
const walletContainer = document.getElementById('wallet-container');


function setExchangeMode(mode) {
    currentMode = mode;
    if (mode === 'buy') {
        buyTab.classList.add('active');
        sellTab.classList.remove('active');
        modeHint.innerText = 'Введите сумму в рублях';
        walletContainer.style.display = 'block';
    } else {
        sellTab.classList.add('active');
        buyTab.classList.remove('active');
        modeHint.innerText = 'Введите сумму в USDT';
        walletContainer.style.display = 'none';
    }
}

function openSupport() {
    tg.openTelegramLink('https://t.me/PitRix_Support'); 
}

// Укажите здесь ваш домен после настройки Nginx (например, https://pitrix-change.ru)
const SERVER_URL = 'https://ваш-домен.ru';

function getOrdersKey() {
    const userId = tg.initDataUnsafe?.user?.id || 'guest';
    return `pitrix_orders_${userId}`;
}

async function renderOrders() {
    const container = document.getElementById('orders-container');
    const userId = tg.initDataUnsafe?.user?.id;

    if (!userId) {
        container.innerHTML = '<p class="empty-text">Ошибка авторизации Telegram.</p>';
        return;
    }

    container.innerHTML = '<p class="empty-text">Загрузка истории...</p>';

    try {
        // Делаем запрос к нашему API на сервере
        const response = await fetch(`${SERVER_URL}/api/orders?user_id=${userId}`);
        const orders = await response.json();

        if (!orders || orders.length === 0) {
            container.innerHTML = '<p class="empty-text">У вас пока нет активных заявок.</p>';
            return;
        }

        container.innerHTML = orders.map((order) => {
            const date = new Date(order.timestamp).toLocaleDateString();
            const status = order.status || 'в обработке';
            let statusClass = 'status-processing';
            
            if (status === 'выполнена') statusClass = 'status-done';
            if (status === 'отклонена') statusClass = 'status-rejected';

            return `
                <div class="order-card">
                    <div class="order-header">
                        <strong>Заявка #${order.order_id} от ${date}</strong>
                        <span class="status-badge ${statusClass}">${status.toUpperCase()}</span>
                    </div>
                    <p>Сумма: ${order.data.amount} ${order.data.mode === 'sell' ? 'USDT' : 'RUB'}</p>
                    <p>Тип: ${order.data.mode === 'sell' ? 'Продажа' : 'Покупка'}</p>
                    ${order.referrer !== 'нет' ? `<p style="font-size: 10px; color: #aaa;">🤝 Реферал</p>` : ''}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        container.innerHTML = '<p class="empty-text" style="color: #ff4d4d;">Не удалось загрузить данные с сервера. Проверьте соединение.</p>';
    }
}

function submitOrder() {
    const amount = exchangeAmount.value;
    const lastName = document.getElementById('last-name').value;
    const firstName = document.getElementById('first-name').value;
    const middleName = document.getElementById('middle-name').value;
    const tgContact = document.getElementById('tg-contact').value;
    const wallet = document.getElementById('wallet-address').value;
    const rulesAccepted = document.getElementById('rules-check').checked;

    if (!amount) {
        alert('Пожалуйста, введите сумму');
        return;
    }
    if (!lastName || !firstName) {
        alert('Пожалуйста, введите Фамилию и Имя');
        return;
    }
    if (!tgContact || !tgContact.startsWith('@')) {
        alert('Пожалуйста, введите ваш Telegram через @ (например, @username)');
        return;
    }
    if (currentMode === 'buy' && (!wallet || wallet.length !== 34)) {
        alert('Пожалуйста, введите корректный адрес кошелька TRC-20 (ровно 34 символа)');
        return;
    }
    if (!rulesAccepted) {
        alert('Вы должны принять условия сервиса (поставить галочку)');
        return;
    }

    try { tg.HapticFeedback.notificationOccurred('success'); } catch(e) {}

    const orderData = {
        action: 'exchange_order',
        mode: currentMode,
        amount: amount,
        customer: `${lastName} ${firstName} ${middleName}`,
        contact: tgContact,
        wallet: currentMode === 'buy' ? wallet : 'one-time requested',
        timestamp: new Date().toISOString()
    };

    // Сохраняем локально с привязкой к User ID
    const orders = JSON.parse(localStorage.getItem(getOrdersKey()) || '[]');
    orders.unshift(orderData);
    localStorage.setItem(getOrdersKey(), JSON.stringify(orders.slice(0, 20)));

    // Отправляем данные боту (закроет приложение)
    if (tg.sendData) {
        tg.sendData(JSON.stringify(orderData));
    } else {
        alert('Ошибка: Метод sendData недоступен. Убедитесь, что бот открыт через кнопку Reply Keyboard (кнопка внизу чата).');
        showScreen('main-screen');
    }
}

function showScreen(screenId) {
    // Особая логика для разделов, требующих обновления данных
    if (screenId === 'orders-screen') {
        renderOrders();
    }
    
    if (screenId === 'referral-screen') {
        const user = tg.initDataUnsafe?.user;
        const userId = user ? user.id : null;
        
        const botUsername = 'crypto_nn_bot'; 
        const refLinkElement = document.getElementById('ref-link');
        
        if (userId) {
            const refLink = `https://t.me/${botUsername}?start=${userId}`;
            if (refLinkElement) refLinkElement.innerText = refLink;
        } else {
            if (refLinkElement) {
                refLinkElement.innerHTML = '<span style="color: #ff4d4d;">Ошибка: Откройте приложение через кнопку в боте</span>';
            }
        }
    }
    
    // Само переключение экранов
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    // Виброотклик
    try { tg.HapticFeedback.impactOccurred('light'); } catch(e) {}
}

// Привязываем к window для надежности
window.showScreen = showScreen;

function copyRefLink() {
    const link = document.getElementById('ref-link').innerText;
    navigator.clipboard.writeText(link).then(() => {
        alert('Ссылка скопирована!');
    });
}

function shareRefLink() {
    const link = document.getElementById('ref-link').innerText;
    const text = "Присоединяйся к PitRix — лучшему обменнику криптовалюты!";
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    tg.openTelegramLink(shareUrl);
}

async function updateRates() {
    try {
        // Используем публичный API CoinGecko для получения курса USDT к RUB
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=rub');
        const data = await response.json();
        const baseRate = data.tether.rub;

        // Настраиваем спред (разницу) для покупки и продажи
        // Например: покупка на 2% дороже, продажа на 2% дешевле от биржи
        const buyRate = (baseRate * 1.02).toFixed(2);
        const sellRate = (baseRate * 0.98).toFixed(2);

        const buyElem = document.getElementById('buy-rate');
        const sellElem = document.getElementById('sell-rate');
        
        if (buyElem) buyElem.innerText = `${buyRate} RUB`;
        if (sellElem) sellElem.innerText = `${sellRate} RUB`;
        
        console.log('Курсы обновлены:', { buyRate, sellRate });
    } catch (error) {
        console.error('Ошибка при получении курса:', error);
    }
}

// Обновляем курсы при загрузке и каждые 60 секунд
updateRates();
setInterval(updateRates, 60000);

// Инициализация анимированного фона
function initParticles() {
    const container = document.getElementById('bg-particles');
    if (!container) return;

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'usdt-particle';
        
        // Случайные позиции и задержки анимации
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = Math.random() * 100 + 'vh';
        particle.style.animationDuration = (Math.random() * 20 + 15) + 's';
        particle.style.animationDelay = (Math.random() * -20) + 's';
        
        // Случайный размер для эффекта глубины
        const size = Math.random() * 40 + 30;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        container.appendChild(particle);
    }
}

initParticles();
