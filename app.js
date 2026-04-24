// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

// Expand the app to full height
tg.expand();

// Set theme colors
document.documentElement.style.setProperty('--bg-color', tg.backgroundColor || '#0d0d0d');
document.documentElement.style.setProperty('--text-primary', tg.textColor || '#ffffff');

// Mock Data
let userBalance = 1250.50;
const btcPrice = 65000;

// Elements
const balanceEl = document.getElementById('total-balance');
const sendInput = document.getElementById('send-amount');
const receiveInput = document.getElementById('receive-amount');
const confirmBtn = document.getElementById('confirm-btn');

// Initial setup
balanceEl.innerText = `$${userBalance.toLocaleString()}`;

// Screen switching logic
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  // Update Nav Active State
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick')?.includes(screenId)) {
      item.classList.add('active');
    }
  });

  // Haptic feedback
  tg.HapticFeedback.impactOccurred('light');
}

// Exchange Calculation
sendInput.addEventListener('input', (e) => {
  const amount = parseFloat(e.target.value) || 0;
  const result = (amount / btcPrice).toFixed(6);
  receiveInput.value = result;
});

// Confirm Transaction
confirmBtn.addEventListener('click', () => {
  const amount = parseFloat(sendInput.value);
  
  if (!amount || amount <= 0) {
    tg.showAlert('Пожалуйста, введите сумму');
    return;
  }

  if (amount > userBalance) {
    tg.showPopup({
      title: 'Ошибка',
      message: 'Недостаточно средств на балансе',
      buttons: [{type: 'ok'}]
    });
    return;
  }

  // Final Haptic
  tg.HapticFeedback.notificationOccurred('success');

  // Prepare data for the bot
  const transactionData = {
    action: 'exchange',
    from: 'USDT',
    to: 'BTC',
    amount: amount,
    received: (amount / btcPrice).toFixed(6),
    date: new Date().toISOString()
  };

  // Check if we can send data
  if (tg.sendData) {
    tg.sendData(JSON.stringify(transactionData));
  } else {
    tg.showAlert('Транзакция создана! (В режиме превью данные не отправляются)');
  }
});

// Ready!
tg.ready();
