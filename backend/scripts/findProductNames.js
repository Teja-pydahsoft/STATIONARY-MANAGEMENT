/**
 * Diagnostic script to find all unique product names in transactions
 * Run this to see the exact names stored in your database
 */

const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Transaction } = require('../models/transactionModel');

async function findProductNames() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stationery';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Search for transactions containing "diploma" or "dece" (case insensitive)
    const searchTerms = ['diploma', 'dece', 'ece', 'kit'];
    
    console.log('🔍 Searching for transactions with product names containing:');
    console.log(`   ${searchTerms.join(', ')}\n`);

    // Get all unique product names from transactions
    const allTransactions = await Transaction.find({}).select('items transactionId transactionDate');
    
    const productNames = new Map();
    
    for (const txn of allTransactions) {
      for (const item of txn.items || []) {
        const name = item.name;
        if (name) {
          // Check if name contains any search term
          const lowerName = name.toLowerCase();
          if (searchTerms.some(term => lowerName.includes(term))) {
            if (!productNames.has(name)) {
              productNames.set(name, []);
            }
            productNames.get(name).push({
              transactionId: txn.transactionId,
              date: txn.transactionDate
            });
          }
        }
        
        // Also check set components
        for (const comp of item.setComponents || []) {
          const compName = comp.name;
          if (compName) {
            const lowerName = compName.toLowerCase();
            if (searchTerms.some(term => lowerName.includes(term))) {
              const key = `[SetComponent] ${compName}`;
              if (!productNames.has(key)) {
                productNames.set(key, []);
              }
              productNames.get(key).push({
                transactionId: txn.transactionId,
                date: txn.transactionDate
              });
            }
          }
        }
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 PRODUCT NAMES FOUND IN TRANSACTIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (productNames.size === 0) {
      console.log('❌ No matching product names found in transactions.');
      console.log('\nLet me show ALL unique product names instead:\n');
      
      const allNames = new Set();
      for (const txn of allTransactions) {
        for (const item of txn.items || []) {
          if (item.name) allNames.add(item.name);
        }
      }
      
      console.log('All product names in transactions:');
      for (const name of allNames) {
        console.log(`  • "${name}"`);
      }
    } else {
      for (const [name, transactions] of productNames) {
        console.log(`📦 "${name}"`);
        console.log(`   Found in ${transactions.length} transaction(s)`);
        // Show first 3 transactions as examples
        for (const txn of transactions.slice(0, 3)) {
          const date = new Date(txn.date).toLocaleDateString();
          console.log(`   - ${txn.transactionId} (${date})`);
        }
        console.log('');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 COPY THE EXACT NAME from above to use in the fix script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

findProductNames();

