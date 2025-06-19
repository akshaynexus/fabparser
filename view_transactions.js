const { readFileSync } = require('fs');

// Load the transaction data
const data = JSON.parse(readFileSync('./transaction_summary.json', 'utf8'));

console.log('=== FAB TRANSACTION VIEWER ===');
console.log(`Total Transactions: ${data.totalTransactions}`);
console.log(`Generated: ${new Date(data.generatedAt).toLocaleString()}`);

// Function to display transactions by category
function viewByCategory(category = null) {
    console.log('\n=== TRANSACTIONS BY CATEGORY ===');
    
    if (category) {
        const transactions = data.transactions.filter(t => t.category === category);
        console.log(`\n--- ${category.toUpperCase()} (${transactions.length} transactions) ---`);
        
        transactions.slice(0, 10).forEach(t => {
            console.log(`${new Date(t.date).toLocaleDateString()} | ${t.type} | ${t.amount.toFixed(2)} AED | ${t.merchant}`);
        });
        
        if (transactions.length > 10) {
            console.log(`... and ${transactions.length - 10} more transactions`);
        }
    } else {
        // Show summary of all categories
        const categories = {};
        data.transactions.forEach(t => {
            if (!categories[t.category]) {
                categories[t.category] = { count: 0, total: 0 };
            }
            categories[t.category].count++;
            categories[t.category].total += t.amount;
        });
        
        Object.entries(categories)
            .sort(([,a], [,b]) => b.total - a.total)
            .forEach(([cat, info]) => {
                console.log(`${cat}: ${info.count} transactions, ${info.total.toFixed(2)} AED`);
            });
    }
}

// Function to find uncategorized transactions for better categorization
function findUncategorizedMerchants(showAll = false) {
    console.log('\n=== UNCATEGORIZED MERCHANTS ===');
    if (!showAll) {
        console.log('(Add these to categories.json for better categorization)');
    }
    
    const uncategorized = data.transactions.filter(t => t.category === 'Uncategorized');
    const merchants = {};
    
    uncategorized.forEach(t => {
        const merchant = t.merchant;
        if (!merchants[merchant]) {
            merchants[merchant] = { count: 0, total: 0 };
        }
        merchants[merchant].count++;
        merchants[merchant].total += t.amount;
    });
    
    console.log(`\nTotal uncategorized merchants: ${Object.keys(merchants).length}`);
    console.log(`Total uncategorized transactions: ${uncategorized.length}`);
    console.log(`Total uncategorized amount: ${Object.values(merchants).reduce((sum, m) => sum + m.total, 0).toFixed(2)} AED\n`);
    
    const sortedMerchants = Object.entries(merchants)
        .sort(([,a], [,b]) => b.total - a.total);
    
    if (showAll) {
        // Show all merchants
        sortedMerchants.forEach(([merchant, info]) => {
            console.log(`"${merchant.toUpperCase()}": "Category Name", // ${info.count} transactions, ${info.total.toFixed(2)} AED`);
        });
    } else {
        // Show top 20
        sortedMerchants.slice(0, 20).forEach(([merchant, info]) => {
            console.log(`"${merchant.toUpperCase()}": "Category Name", // ${info.count} transactions, ${info.total.toFixed(2)} AED`);
        });
        
        if (sortedMerchants.length > 20) {
            console.log(`\n... and ${sortedMerchants.length - 20} more merchants`);
            console.log('Use "bun view_transactions.js uncategorized-all" to see all');
        }
    }
}

// Function to show monthly spending
function monthlyBreakdown() {
    console.log('\n=== MONTHLY BREAKDOWN ===');
    
    Object.entries(data.summary.byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([month, totals]) => {
            console.log(`\n${month}:`);
            console.log(`  Income:   ${totals.credit.toFixed(2)} AED`);
            console.log(`  Expenses: ${totals.debit.toFixed(2)} AED`);
            console.log(`  Net:      ${(totals.credit - totals.debit).toFixed(2)} AED`);
            console.log(`  Transactions: ${totals.count}`);
        });
}

// Function to show top spending categories
function topSpendingCategories() {
    console.log('\n=== TOP SPENDING CATEGORIES ===');
    
    Object.entries(data.summary.byCategory)
        .filter(([cat]) => cat !== 'Banking') // Exclude banking as it's mostly transfers
        .sort(([,a], [,b]) => b.debit - a.debit)
        .slice(0, 10)
        .forEach(([category, totals]) => {
            console.log(`${category}: ${totals.debit.toFixed(2)} AED (${totals.count} transactions)`);
        });
}

// Function to search transactions
function searchTransactions(searchTerm) {
    console.log(`\n=== SEARCH RESULTS FOR "${searchTerm}" ===`);
    
    const results = data.transactions.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.merchant.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`Found ${results.length} matching transactions:`);
    
    results.slice(0, 20).forEach(t => {
        console.log(`${new Date(t.date).toLocaleDateString()} | ${t.type} | ${t.amount.toFixed(2)} AED | ${t.category} | ${t.merchant}`);
    });
    
    if (results.length > 20) {
        console.log(`... and ${results.length - 20} more results`);
    }
}

// Function to export uncategorized merchants to a file
function exportUncategorizedMerchants() {
    const { writeFileSync } = require('fs');
    
    const uncategorized = data.transactions.filter(t => t.category === 'Uncategorized');
    const merchants = {};
    
    uncategorized.forEach(t => {
        const merchant = t.merchant;
        if (!merchants[merchant]) {
            merchants[merchant] = { 
                count: 0, 
                total: 0, 
                transactions: [] 
            };
        }
        merchants[merchant].count++;
        merchants[merchant].total += t.amount;
        merchants[merchant].transactions.push({
            date: t.date,
            amount: t.amount,
            description: t.description
        });
    });
    
    const exportData = {
        summary: {
            totalMerchants: Object.keys(merchants).length,
            totalTransactions: uncategorized.length,
            totalAmount: Object.values(merchants).reduce((sum, m) => sum + m.total, 0)
        },
        merchantsForCategorization: {},
        detailedTransactions: merchants
    };
    
    // Create the categorization template
    Object.entries(merchants)
        .sort(([,a], [,b]) => b.total - a.total)
        .forEach(([merchant, info]) => {
            exportData.merchantsForCategorization[merchant.toUpperCase()] = "Category Name"; // ${info.count} transactions, ${info.total.toFixed(2)} AED
        });
    
    writeFileSync('./uncategorized_merchants.json', JSON.stringify(exportData, null, 2));
    console.log('\n=== EXPORT COMPLETE ===');
    console.log('Uncategorized merchants exported to: uncategorized_merchants.json');
    console.log(`Total merchants to categorize: ${Object.keys(merchants).length}`);
    console.log(`Total amount: ${exportData.summary.totalAmount.toFixed(2)} AED`);
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'category':
        viewByCategory(args[1]);
        break;
    case 'uncategorized':
        findUncategorizedMerchants();
        break;
    case 'uncategorized-all':
        findUncategorizedMerchants(true);
        break;
    case 'monthly':
        monthlyBreakdown();
        break;
    case 'top':
        topSpendingCategories();
        break;
    case 'search':
        searchTransactions(args[1] || '');
        break;
    case 'export':
        exportUncategorizedMerchants();
        break;
    default:
        console.log('\n=== USAGE ===');
        console.log('bun view_transactions.js [command] [options]');
        console.log('');
        console.log('Commands:');
        console.log('  category [name]  - View transactions by category (or list all)');
        console.log('  uncategorized    - Show top uncategorized merchants for categorization');
        console.log('  uncategorized-all - Show all uncategorized merchants');
        console.log('  monthly          - Show monthly breakdown');
        console.log('  top              - Show top spending categories');
        console.log('  search [term]    - Search transactions by description/merchant');
        console.log('  export           - Export uncategorized merchants to a file');
        console.log('');
        console.log('Examples:');
        console.log('  bun view_transactions.js category Groceries');
        console.log('  bun view_transactions.js search starbucks');
        console.log('  bun view_transactions.js uncategorized');
        
        // Show quick summary
        console.log('\n=== QUICK SUMMARY ===');
        monthlyBreakdown();
        topSpendingCategories();
        break;
} 