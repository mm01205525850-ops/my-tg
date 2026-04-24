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

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    try { tg.HapticFeedback.impactOccurred('light'); } catch(e) {}
}

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

function submitOrder() {
    const amount = exchangeAmount.value;
    const lastName = document.getElementById('last-name').value;
    const firstName = document.getElementById('first-name').value;
    const middleName = document.getElementById('middle-name').value;
    const wallet = document.getElementById('wallet-address').value;
    const rulesAccepted = document.getElementById('rules-check').checked;

    console.log("Submit clicked", { amount, lastName, firstName, rulesAccepted });

    if (!amount) {
        alert('Пожалуйста, введите сумму');
        return;
    }
    if (!lastName || !firstName) {
        alert('Пожалуйста, введите Фамилию и Имя');
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
        wallet: currentMode === 'buy' ? wallet : 'one-time requested',
        timestamp: new Date().toISOString()
    };

    // Пытаемся отправить данные боту
    if (tg.sendData) {
        tg.sendData(JSON.stringify(orderData));
        tg.close(); // Закрываем приложение после отправки
    } else {
        alert('Заявка создана! Данные: ' + JSON.stringify(orderData));
        showScreen('main-screen');
    }
}

// Initial rates mock
if(document.getElementById('buy-rate')) {
    document.getElementById('buy-rate').innerText = '94.50 RUB';
    document.getElementById('sell-rate').innerText = '91.20 RUB';
}
