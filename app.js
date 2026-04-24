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
const submitBtn = document.getElementById('submit-order');

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    tg.HapticFeedback.impactOccurred('light');
}

function setExchangeMode(mode) {
    currentMode = mode;
    if (mode === 'buy') {
        buyTab.classList.add('active');
        sellTab.classList.remove('active');
        modeHint.innerText = 'Введите сумму в рублях';
        walletContainer.style.display = 'block';
        submitBtn.innerText = 'Создать заявку';
    } else {
        sellTab.classList.add('active');
        buyTab.classList.remove('active');
        modeHint.innerText = 'Введите сумму в USDT';
        walletContainer.style.display = 'none'; // Following screenshot 3 logic
        submitBtn.innerText = 'Получить одноразовый кошелек';
    }
    tg.HapticFeedback.selectionChanged();
}

function openSupport() {
    tg.openTelegramLink('https://t.me/Mosca67_Support'); // Mock support link from screenshots
}

function submitOrder() {
    const amount = exchangeAmount.value;
    const lastName = document.getElementById('last-name').value;
    const firstName = document.getElementById('first-name').value;
    const middleName = document.getElementById('middle-name').value;
    const wallet = document.getElementById('wallet-address').value;
    const rulesAccepted = document.getElementById('rules-check').checked;

    if (!amount || !lastName || !firstName) {
        tg.showAlert('Пожалуйста, заполните все обязательные поля (*)');
        return;
    }

    if (!rulesAccepted) {
        tg.showAlert('Пожалуйста, примите условия сервиса');
        return;
    }

    tg.HapticFeedback.notificationOccurred('success');

    const orderData = {
        action: 'exchange_order',
        mode: currentMode,
        amount: amount,
        customer: `${lastName} ${firstName} ${middleName}`,
        wallet: currentMode === 'buy' ? wallet : 'one-time requested',
        timestamp: new Date().toISOString()
    };

    if (tg.sendData) {
        tg.sendData(JSON.stringify(orderData));
    } else {
        tg.showAlert('Заявка создана! (В режиме превью данные не отправляются)');
        showScreen('main-screen');
    }
}

// Initial rates mock
document.getElementById('buy-rate').innerText = '94.50 RUB';
document.getElementById('sell-rate').innerText = '91.20 RUB';
