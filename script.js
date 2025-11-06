// Calculator State
let currentValue = '0';
let previousValue = '';
let operator = '';
let userTier = 'free'; // free, premium, unlimited
let billingCycle = 'monthly'; // monthly, annual
let selectedPlan = '';
let selectedPaymentMethod = '';

// Tier Limits
const tierLimits = {
    free: 1000,
    premium: 10000,
    unlimited: Infinity
};

// Pricing Configuration (in USD)
const pricing = {
    premium: {
        monthly: 50,
        annual: 50 * 12 * 0.85 // 15% discount
    },
    unlimited: {
        monthly: 150,
        annual: 150 * 12 * 0.85 // 15% discount
    }
};

// Exchange rate USD to PHP
const USD_TO_PHP = 56;

// Payment Account Details
const paymentAccounts = {
    gcash: {
        number: '09342342424',
        name: 'Calculator Pro Services'
    },
    maya: {
        number: '09876543210',
        name: 'Calculator Pro Services'
    }
};

// Display Functions
function updateDisplay() {
    document.getElementById('display').textContent = currentValue;
    updateTierBadge();
}

function updateTierBadge() {
    const badge = document.getElementById('tierBadge');
    if (userTier === 'free') {
        badge.textContent = 'FREE TIER (< 1000)';
        badge.className = 'tier-badge free';
    } else if (userTier === 'premium') {
        badge.textContent = 'PREMIUM (< 10,000)';
        badge.className = 'tier-badge premium';
    } else {
        badge.textContent = 'UNLIMITED ∞';
        badge.className = 'tier-badge unlimited';
    }
}

// Calculator Functions
function appendNumber(num) {
    if (currentValue === '0' || currentValue === 'ERROR') {
        currentValue = num === '.' ? '0.' : num;
    } else {
        if (num === '.' && currentValue.includes('.')) return;
        currentValue += num;
    }
    updateDisplay();
}

function setOperator(op) {
    if (operator && previousValue) {
        calculate();
    }
    operator = op;
    previousValue = currentValue;
    currentValue = '0';
}

function calculate() {
    if (!operator || !previousValue) return;

    const prev = parseFloat(previousValue);
    const current = parseFloat(currentValue);
    let result;

    switch(operator) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            result = current === 0 ? 'ERROR' : prev / current;
            break;
    }

    if (result === 'ERROR') {
        currentValue = 'ERROR';
        updateDisplay();
        return;
    }

    // Check tier limits
    const limit = tierLimits[userTier];
    if (Math.abs(result) >= limit) {
        showUpgradeModal(result);
        return;
    }

    currentValue = result.toString();
    operator = '';
    previousValue = '';
    updateDisplay();
}

function clearDisplay() {
    currentValue = '0';
    previousValue = '';
    operator = '';
    updateDisplay();
}

// Modal Functions
function showUpgradeModal(result) {
    const modal = document.getElementById('upgradeModal');
    modal.classList.add('active');
    
    const message = document.createElement('div');
    message.className = 'error-message';
    
    if (userTier === 'free') {
        message.textContent = `Result (${result.toFixed(2)}) exceeds free tier limit of 1,000. Upgrade to Premium or Unlimited!`;
    } else if (userTier === 'premium') {
        message.textContent = `Result (${result.toFixed(2)}) exceeds premium tier limit of 10,000. Upgrade to Unlimited!`;
    }
    
    const modalContent = document.querySelector('.modal-content');
    const existingMessage = modalContent.querySelector('.error-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    modalContent.insertBefore(message, modalContent.querySelector('.billing-toggle'));
}

function closeModal() {
    document.getElementById('upgradeModal').classList.remove('active');
    document.getElementById('paymentSection').classList.remove('active');
    clearDisplay();
}

// Billing Functions
function toggleBilling(cycle) {
    billingCycle = cycle;
    document.getElementById('monthlyBtn').classList.toggle('active', cycle === 'monthly');
    document.getElementById('annualBtn').classList.toggle('active', cycle === 'annual');
    
    updatePricing();
}

function updatePricing() {
    if (billingCycle === 'monthly') {
        document.getElementById('premiumPrice').textContent = '$50/mo';
        document.getElementById('unlimitedPrice').textContent = '$150/mo';
    } else {
        const premiumAnnual = pricing.premium.annual.toFixed(2);
        const unlimitedAnnual = pricing.unlimited.annual.toFixed(2);
        document.getElementById('premiumPrice').textContent = `${premiumAnnual}/yr`;
        document.getElementById('unlimitedPrice').textContent = `${unlimitedAnnual}/yr`;
    }
}

// Payment Method Selection
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    document.getElementById('gcashCard').classList.remove('selected');
    document.getElementById('mayaCard').classList.remove('selected');
    
    if (method === 'gcash') {
        document.getElementById('gcashCard').classList.add('selected');
    } else {
        document.getElementById('mayaCard').classList.add('selected');
    }
    
    // Show payment details
    document.getElementById('paymentDetails').style.display = 'block';
    
    // Update account details
    const account = paymentAccounts[method];
    document.getElementById('accountNumber').textContent = account.number;
    document.getElementById('accountName').textContent = account.name;
}

// Plan Selection
function selectPlan(plan) {
    selectedPlan = plan;
    selectedPaymentMethod = '';
    
    document.getElementById('premiumCard').classList.remove('selected');
    document.getElementById('unlimitedCard').classList.remove('selected');
    
    if (plan === 'premium') {
        document.getElementById('premiumCard').classList.add('selected');
    } else {
        document.getElementById('unlimitedCard').classList.add('selected');
    }
    
    document.getElementById('paymentSection').classList.add('active');
    document.getElementById('paymentDetails').style.display = 'none';
    
    // Reset payment method selection
    document.getElementById('gcashCard').classList.remove('selected');
    document.getElementById('mayaCard').classList.remove('selected');
    
    const amountUSD = billingCycle === 'monthly' 
        ? pricing[plan].monthly 
        : pricing[plan].annual;
    
    const amountPHP = (amountUSD * USD_TO_PHP).toFixed(2);
    
    document.getElementById('confirmAmount').value = `₱${amountPHP} (${billingCycle}) - ${amountUSD.toFixed(2)}`;
}

// Payment Processing
function processPayment() {
    const senderName = document.getElementById('senderName').value;
    const senderNumber = document.getElementById('senderNumber').value;
    const email = document.getElementById('email').value;
    
    if (!selectedPaymentMethod) {
        alert('Please select a payment method (GCash or Maya)');
        return;
    }
    
    if (!senderName || !senderNumber || !email) {
        alert('Please fill in all required information');
        return;
    }
    
    if (senderNumber.length !== 11 || !senderNumber.startsWith('09')) {
        alert('Please enter a valid Philippine mobile number (09XX XXX XXXX)');
        return;
    }
    
    const amountUSD = billingCycle === 'monthly' 
        ? pricing[selectedPlan].monthly 
        : pricing[selectedPlan].annual;
    const amountPHP = (amountUSD * USD_TO_PHP).toFixed(2);
    const account = paymentAccounts[selectedPaymentMethod];
    
    // Simulate payment confirmation
    alert(`Payment Confirmation\n\n` +
          `Plan: ${selectedPlan.toUpperCase()}\n` +
          `Billing: ${billingCycle}\n` +
          `Amount: ₱${amountPHP} (${amountUSD.toFixed(2)})\n\n` +
          `Payment Method: ${selectedPaymentMethod.toUpperCase()}\n` +
          `Send to: ${account.number}\n\n` +
          `Sender: ${senderName}\n` +
          `Contact: ${senderNumber}\n\n` +
          `Please send the payment to the account above and our team will verify your payment within 24 hours. You will receive a confirmation email at ${email}.`);
    
    // Upgrade user tier
    userTier = selectedPlan;
    closeModal();
    
    // Clear form
    document.getElementById('senderName').value = '';
    document.getElementById('senderNumber').value = '';
    document.getElementById('email').value = '';
}

// Initialize
updateDisplay();