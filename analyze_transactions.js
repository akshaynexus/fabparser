const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./transaction_summary.json', 'utf8'));

// Function to check if transaction should be internal
function shouldBeFiltered(t) {
    const desc = t.description.toLowerCase();
    
    // Check keywords first
    const keywords = [
        'reverse charges', 'fee reversal', 'charge reversal', 'balance adjustment',
        'atm cash deposit', 'cash deposit', 'switch transaction', 'inward ipp payment',
        'outward cheque returned', 'sw wdl chgs', 'vat aed', 'pos settlement  vat',
        'balance brought forward', 'balance carried forward', 'cash withdrawal',
        'ipp transfer instant payment'
    ];
    
    if (keywords.some(keyword => desc.includes(keyword))) {
        return true;
    }
    
    // Check transfer patterns
    const patterns = ['transfer', 'outward transfer', 'internal transfer', 'self transfer', 'account transfer'];
    const excludes = ['inward telex transfer', 'inward transfer', 'salary transfer', 'payment transfer'];
    
    const matchesInternalPattern = patterns.some(pattern => desc.includes(pattern));
    const matchesExcludePattern = excludes.some(exclude => desc.includes(exclude));
    
    if (matchesInternalPattern && !matchesExcludePattern) {
        return true;
    }
    
    // Check small credit rule
    if (t.type === 'Credit' && t.amount < 5) {
        return true;
    }
    
    return false;
}

// Find unfiltered transactions
const unfiltered = data.transactions.filter(t => !shouldBeFiltered(t));

// Sort by amount and show top 10
const topUnfiltered = unfiltered
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 15);

console.log('TOP 15 UNFILTERED TRANSACTIONS:');
topUnfiltered.forEach((t, i) => {
    console.log(`${i+1}. ${t.type} ${t.amount} AED - ${t.description}`);
});

// Show summary
const unfilteredCredits = unfiltered.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
const unfilteredDebits = unfiltered.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);

console.log(`\nUNFILTERED SUMMARY:`);
console.log(`Credits: ${unfilteredCredits.toFixed(2)} AED`);
console.log(`Debits: ${unfilteredDebits.toFixed(2)} AED`);
console.log(`Net: ${(unfilteredCredits - unfilteredDebits).toFixed(2)} AED`); 