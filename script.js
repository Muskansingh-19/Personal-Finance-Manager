// Personal Finance Manager - JavaScript Code

// Global Variables
let transactions = [];
let expenseChart = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    setDefaultDate();
    initChart();
    updateStats();
    updateChart();
    renderTransactions();
    setupEventListeners();
    
    // Load sample data after 2 seconds for demonstration
    setTimeout(() => {
        if (transactions.length === 0) {
            addSampleData();
        }
    }, 2000);
}

// Set today's date as default in the date input
function setDefaultDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
}

// Initialize Chart.js expense breakdown chart
function initChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    expenseChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
                    '#FECA57', '#FF8787', '#DDA0DD', '#98D8C8',
                    '#F8B500', '#6C7B7F', '#9B59B6', '#E67E22'
                ],
                borderWidth: 0,
                hoverBorderWidth: 3,
                hoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

// Update statistics cards with current data
function updateStats() {
    const income = calculateTotalIncome();
    const expenses = calculateTotalExpenses();
    const savings = income - expenses;

    // Update UI elements
    updateElement('totalIncome', `₹${formatNumber(income)}`);
    updateElement('totalExpenses', `₹${formatNumber(expenses)}`);
    updateElement('netSavings', `₹${formatNumber(savings)}`);

    // Update savings card color based on positive/negative balance
    updateSavingsCardColor(savings);
}

// Calculate total income from transactions
function calculateTotalIncome() {
    return transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
}

// Calculate total expenses from transactions
function calculateTotalExpenses() {
    return transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
}

// Update savings card color based on positive/negative value
function updateSavingsCardColor(savings) {
    const savingsElement = document.getElementById('netSavings')?.parentElement;
    if (savingsElement) {
        if (savings >= 0) {
            savingsElement.style.background = 'linear-gradient(135deg, #4ecdc4, #44a08d)';
        } else {
            savingsElement.style.background = 'linear-gradient(135deg, #ff6b6b, #ff8787)';
        }
    }
}

// Update chart with expense category breakdown
function updateChart() {
    if (!expenseChart) return;

    const expenseCategories = calculateExpensesByCategory();
    const labels = Object.keys(expenseCategories);
    const data = Object.values(expenseCategories);

    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = data;
    expenseChart.update('active');
}

// Calculate expenses grouped by category
function calculateExpensesByCategory() {
    const categories = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });
    return categories;
}

// Render all transactions in the transaction list
function renderTransactions() {
    const listElement = document.getElementById('transactionList');
    if (!listElement) return;

    if (transactions.length === 0) {
        listElement.innerHTML = '<div class="no-transactions">No transactions yet. Add your first transaction above!</div>';
        return;
    }

    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    listElement.innerHTML = sortedTransactions
        .map(transaction => createTransactionHTML(transaction))
        .join('');
}

// Create HTML for a single transaction item
function createTransactionHTML(transaction) {
    const formattedDate = formatDate(transaction.date);
    const formattedAmount = formatNumber(transaction.amount);
    const sign = transaction.type === 'income' ? '+' : '-';
    
    return `
        <div class="transaction-item ${transaction.type}" data-id="${transaction.id}">
            <div class="transaction-info">
                <h4>${escapeHtml(transaction.description)}</h4>
                <p>${escapeHtml(transaction.category)} • ${formattedDate}</p>
            </div>
            <div>
                <span class="transaction-amount ${transaction.type}">
                    ${sign}₹${formattedAmount}
                </span>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})" title="Delete transaction">
                    Delete
                </button>
            </div>
        </div>
    `;
}

// Add new transaction (income or expense)
function addTransaction(type) {
    const transactionData = getFormData();
    
    if (!validateTransactionData(transactionData)) {
        return;
    }

    const transaction = {
        id: generateUniqueId(),
        type: type,
        description: transactionData.description.trim(),
        amount: parseFloat(transactionData.amount),
        category: transactionData.category,
        date: transactionData.date,
        timestamp: new Date().toISOString()
    };

    transactions.push(transaction);
    
    // Clear form and reset to today's date
    clearForm();
    
    // Update all UI components
    updateStats();
    updateChart();
    renderTransactions();
    
    // Show success message
    showNotification(`${type === 'income' ? 'Income' : 'Expense'} added successfully!`, 'success');
}

// Get form data from the transaction form
function getFormData() {
    return {
        description: document.getElementById('description')?.value || '',
        amount: document.getElementById('amount')?.value || '',
        category: document.getElementById('category')?.value || '',
        date: document.getElementById('date')?.value || ''
    };
}

// Validate transaction form data
function validateTransactionData(data) {
    if (!data.description.trim()) {
        showNotification('Please enter a description', 'error');
        return false;
    }
    
    if (!data.amount || parseFloat(data.amount) <= 0) {
        showNotification('Please enter a valid amount greater than 0', 'error');
        return false;
    }
    
    if (!data.category) {
        showNotification('Please select a category', 'error');
        return false;
    }
    
    if (!data.date) {
        showNotification('Please select a date', 'error');
        return false;
    }
    
    return true;
}

// Clear the transaction form
function clearForm() {
    const form = document.getElementById('transactionForm');
    if (form) {
        form.reset();
        setDefaultDate();
    }
}

// Delete a transaction by ID
function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }

    const initialLength = transactions.length;
    transactions = transactions.filter(t => t.id !== id);
    
    if (transactions.length < initialLength) {
        updateStats();
        updateChart();
        renderTransactions();
        showNotification('Transaction deleted successfully!', 'success');
    } else {
        showNotification('Transaction not found!', 'error');
    }
}

// Setup event listeners for form submission and other interactions
function setupEventListeners() {
    const form = document.getElementById('transactionForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    const clickedButton = e.submitter;
    if (clickedButton && clickedButton.dataset.type) {
        const type = clickedButton.dataset.type;
        addTransaction(type);
    }
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter to add income
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        addTransaction('income');
    }
    // Ctrl/Cmd + Shift + Enter to add expense
    else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addTransaction('expense');
    }
}

// Utility function to generate unique IDs
function generateUniqueId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Utility function to format numbers with commas
function formatNumber(num) {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Utility function to update DOM elements safely
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    }
}

// Utility function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Show notification messages to user
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 300px;
        `;
        document.body.appendChild(notification);
    }

    // Set notification style based on type
    const colors = {
        success: 'linear-gradient(135deg, #48c774, #06d6a0)',
        error: 'linear-gradient(135deg, #ff6b6b, #ff8787)',
        info: 'linear-gradient(135deg, #667eea, #764ba2)'
    };

    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.opacity = '1';

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}

// Add sample data for demonstration purposes
function addSampleData() {
    const sampleTransactions = [
        {
            id: generateUniqueId(),
            type: 'income',
            description: 'Monthly Salary',
            amount: 50000,
            category: 'Salary',
            date: '2025-07-01',
            timestamp: new Date('2025-07-01').toISOString()
        },
        {
            id: generateUniqueId(),
            type: 'expense',
            description: 'Grocery Shopping',
            amount: 3500,
            category: 'Food',
            date: '2025-07-15',
            timestamp: new Date('2025-07-15').toISOString()
        },
        {
            id: generateUniqueId(),
            type: 'expense',
            description: 'Electricity Bill',
            amount: 1200,
            category: 'Utilities',
            date: '2025-07-10',
            timestamp: new Date('2025-07-10').toISOString()
        },
        {
            id: generateUniqueId(),
            type: 'income',
            description: 'Freelance Project',
            amount: 15000,
            category: 'Freelance',
            date: '2025-07-20',
            timestamp: new Date('2025-07-20').toISOString()
        },
        {
            id: generateUniqueId(),
            type: 'expense',
            description: 'Movie Tickets',
            amount: 800,
            category: 'Entertainment',
            date: '2025-07-22',
            timestamp: new Date('2025-07-22').toISOString()
        },
        {
            id: generateUniqueId(),
            type: 'expense',
            description: 'Fuel',
            amount: 2000,
            category: 'Transportation',
            date: '2025-07-18',
            timestamp: new Date('2025-07-18').toISOString()
        }
    ];

    transactions = sampleTransactions;
    updateStats();
    updateChart();
    renderTransactions();
    showNotification('Sample data loaded!', 'info');
}

// Export functions for potential future features
window.FinanceManager = {
    addTransaction,
    deleteTransaction,
    updateStats,
    updateChart,
    renderTransactions,
    exportData: () => JSON.stringify(transactions, null, 2),
    importData: (jsonData) => {
        try {
            const importedTransactions = JSON.parse(jsonData);
            if (Array.isArray(importedTransactions)) {
                transactions = importedTransactions;
                updateStats();
                updateChart();
                renderTransactions();
                showNotification('Data imported successfully!', 'success');
            }
        } catch (error) {
            showNotification('Invalid data format!', 'error');
        }
    },
    clearAllData: () => {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            transactions = [];
            updateStats();
            updateChart();
            renderTransactions();
            showNotification('All data cleared!', 'info');
        }
    }
};
