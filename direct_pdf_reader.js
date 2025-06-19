const fs = require('fs');
const path = require('path');

// Try multiple PDF reading approaches
async function readPdfDirect() {
    const statementsDir = './statements';
    const pdfFiles = fs.readdirSync(statementsDir)
        .filter(file => file.toLowerCase().endsWith('.pdf'))
        .map(file => path.join(statementsDir, file));

    console.log(`Found ${pdfFiles.length} PDF files to analyze`);
    
    for (const pdfFile of pdfFiles) {
        console.log(`\n=== ANALYZING: ${path.basename(pdfFile)} ===`);
        
        try {
            // Method 1: Try pdf-parse
            await tryPdfParse(pdfFile);
        } catch (error) {
            console.log('pdf-parse failed:', error.message);
        }
        
        try {
            // Method 2: Try pdf2pic or other methods
            await tryPdfjs(pdfFile);
        } catch (error) {
            console.log('pdfjs failed:', error.message);
        }
        
        // Only process first file for now
        break;
    }
}

async function tryPdfParse(pdfFile) {
    try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(pdfFile);
        const data = await pdfParse(dataBuffer);
        
        console.log('\n--- PDF-PARSE EXTRACTION ---');
        console.log(`Pages: ${data.numpages}`);
        console.log(`Text length: ${data.text.length}`);
        
        // Save the extracted text
        const outputFile = pdfFile.replace('.pdf', '_direct_extract.txt');
        fs.writeFileSync(outputFile, data.text);
        console.log(`Saved direct extraction to: ${outputFile}`);
        
        // Analyze transaction patterns
        analyzeTransactionPatterns(data.text, 'pdf-parse');
        
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.log('pdf-parse not installed, trying alternative...');
            // Try to install it
            const { execSync } = require('child_process');
            try {
                console.log('Installing pdf-parse...');
                execSync('bun add pdf-parse', { stdio: 'inherit' });
                // Retry
                const pdfParse = require('pdf-parse');
                const dataBuffer = fs.readFileSync(pdfFile);
                const data = await pdfParse(dataBuffer);
                
                console.log('\n--- PDF-PARSE EXTRACTION ---');
                console.log(`Pages: ${data.numpages}`);
                console.log(`Text length: ${data.text.length}`);
                
                // Save the extracted text
                const outputFile = pdfFile.replace('.pdf', '_direct_extract.txt');
                fs.writeFileSync(outputFile, data.text);
                console.log(`Saved direct extraction to: ${outputFile}`);
                
                analyzeTransactionPatterns(data.text, 'pdf-parse');
            } catch (installError) {
                console.log('Could not install pdf-parse:', installError.message);
            }
        } else {
            throw error;
        }
    }
}

async function tryPdfjs(pdfFile) {
    try {
        // Try pdfjs-dist (same as statement parser uses)
        const pdf = require('pdfjs-dist/legacy/build/pdf.js');
        
        const dataBuffer = fs.readFileSync(pdfFile);
        const loadingTask = pdf.getDocument({data: dataBuffer});
        const pdfDocument = await loadingTask.promise;
        
        console.log('\n--- PDFJS-DIST EXTRACTION (same as statement parser) ---');
        console.log(`Pages: ${pdfDocument.numPages}`);
        
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Method 1: Direct item concatenation (like statement parser might do)
            let pageText1 = '';
            textContent.items.forEach(item => {
                pageText1 += item.str + '\n';
            });
            
            // Method 2: Try to preserve positioning
            let pageText2 = '';
            textContent.items.forEach(item => {
                if (item.str.trim()) {
                    pageText2 += item.str.trim() + '\n';
                }
            });
            
            // Method 3: Group by Y position (might preserve table structure better)
            const itemsByY = {};
            textContent.items.forEach(item => {
                const y = Math.round(item.transform[5]);
                if (!itemsByY[y]) itemsByY[y] = [];
                itemsByY[y].push(item);
            });
            
            let pageText3 = '';
            Object.keys(itemsByY)
                .sort((a, b) => b - a) // Sort by Y descending (top to bottom)
                .forEach(y => {
                    const lineItems = itemsByY[y].sort((a, b) => a.transform[4] - b.transform[4]); // Sort by X
                    const lineText = lineItems.map(item => item.str).join(' ').trim();
                    if (lineText) {
                        pageText3 += lineText + '\n';
                    }
                });
            
            fullText += pageText3; // Use the positioned method
            
            // Save different extraction methods for comparison
            if (pageNum === 1) {
                fs.writeFileSync(pdfFile.replace('.pdf', '_pdfjs_method1.txt'), pageText1);
                fs.writeFileSync(pdfFile.replace('.pdf', '_pdfjs_method2.txt'), pageText2);
                fs.writeFileSync(pdfFile.replace('.pdf', '_pdfjs_method3.txt'), pageText3);
                console.log('Saved different extraction methods for page 1');
            }
        }
        
        // Save full text
        const outputFile = pdfFile.replace('.pdf', '_pdfjs_extract.txt');
        fs.writeFileSync(outputFile, fullText);
        console.log(`Saved pdfjs extraction to: ${outputFile}`);
        
        analyzeTransactionPatterns(fullText, 'pdfjs-dist');
        
    } catch (error) {
        throw error;
    }
}

function analyzeTransactionPatterns(text, method) {
    console.log(`\n--- TRANSACTION PATTERN ANALYSIS (${method}) ---`);
    
    // Look for transaction-like patterns
    const lines = text.split('\n').filter(line => line.trim());
    
    // Count date patterns
    const datePattern = /\d{2} \w{3} \d{4}/;
    const dateLines = lines.filter(line => datePattern.test(line));
    console.log(`Lines with dates: ${dateLines.length}`);
    
    // Count lines with "POS Settlement"
    const posLines = lines.filter(line => line.includes('POS Settlement'));
    console.log(`Lines with "POS Settlement": ${posLines.length}`);
    
    // Count lines with amounts (decimal numbers)
    const amountPattern = /[\d,]+\.\d{2}/;
    const amountLines = lines.filter(line => amountPattern.test(line));
    console.log(`Lines with decimal amounts: ${amountLines.length}`);
    
    // Look for complete transaction lines (date + description + amount)
    const completeTransactionPattern = /^\d{2} \w{3} \d{4}.*\d{2} \w{3} \d{4}.*[\d,]+\.\d{2}$/;
    const completeTransactions = lines.filter(line => completeTransactionPattern.test(line));
    console.log(`Complete transaction lines: ${completeTransactions.length}`);
    
    // Show sample transaction patterns
    console.log('\nSample transaction-like lines:');
    const sampleTransactions = lines
        .filter(line => line.includes('POS Settlement') || (datePattern.test(line) && amountPattern.test(line)))
        .slice(0, 10);
    
    sampleTransactions.forEach((line, index) => {
        console.log(`${index + 1}: ${line}`);
    });
    
    // Compare with statement totals if found
    const totalDebitsMatch = text.match(/Total Debit Txns\s*:\s*(\d+)/);
    const totalCreditsMatch = text.match(/Total Credit Txns\s*:\s*(\d+)/);
    
    if (totalDebitsMatch && totalCreditsMatch) {
        const expectedTotal = parseInt(totalDebitsMatch[1]) + parseInt(totalCreditsMatch[1]);
        console.log(`\nExpected total transactions: ${expectedTotal}`);
        console.log(`Found complete transaction lines: ${completeTransactions.length}`);
        console.log(`Missing: ${expectedTotal - completeTransactions.length}`);
    }
}

// Run the analysis
readPdfDirect().catch(console.error); 