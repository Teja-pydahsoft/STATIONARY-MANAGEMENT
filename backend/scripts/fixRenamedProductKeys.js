/**
 * Script to fix all records after a product was renamed
 * Updates: Student items, Transactions, and Set compositions
 * 
 * Usage: 
 *   1. Update OLD_NAME and NEW_NAME below with your actual values
 *   2. Run: node scripts/fixRenamedProductKeys.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const { User } = require('../models/userModel');
const { Transaction } = require('../models/transactionModel');
const { Product } = require('../models/productModel');

// ========== CONFIGURE THESE VALUES ==========
// Use the EXACT product names (not the key format)

const OLD_NAME = 'Diploma 3rd Year Sem 2 ECE - KIT';   // Old product name
const NEW_NAME = 'DECE - III YEAR SEM - 2 KIT';        // New product name

// ============================================

// Helper to convert product name to items key format
const nameToKey = (name) => name?.toLowerCase().replace(/\s+/g, '_') || '';

async function fixRenamedProduct() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stationery';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    if (!OLD_NAME || !NEW_NAME) {
      console.error('❌ Please configure OLD_NAME and NEW_NAME in this script first!');
      process.exit(1);
    }

    const oldKey = nameToKey(OLD_NAME);
    const newKey = nameToKey(NEW_NAME);
    
    console.log('🔄 Product Rename Fix:');
    console.log(`   OLD NAME: "${OLD_NAME}"`);
    console.log(`   NEW NAME: "${NEW_NAME}"`);
    console.log(`   OLD KEY:  "${oldKey}"`);
    console.log(`   NEW KEY:  "${newKey}"`);
    console.log('');

    // ===== 1. FIX STUDENT ITEMS =====
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 STEP 1: Fixing Student Items Keys...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const usersWithOldKey = await User.find({ [`items.${oldKey}`]: { $exists: true } });
    console.log(`   Found ${usersWithOldKey.length} students with old key`);

    if (usersWithOldKey.length > 0) {
      for (const user of usersWithOldKey) {
        const oldValue = user.items[oldKey];
        await User.updateOne(
          { _id: user._id },
          { 
            $unset: { [`items.${oldKey}`]: "" },
            $set: { [`items.${newKey}`]: oldValue }
          }
        );
      }
      console.log(`   ✅ Updated ${usersWithOldKey.length} students\n`);
    } else {
      console.log('   ℹ️  No students to update\n');
    }

    // ===== 2. FIX TRANSACTION ITEMS =====
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 STEP 2: Fixing Transaction Items...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Find transactions with the old product name in items
    const transactionsWithOldName = await Transaction.find({ 'items.name': OLD_NAME });
    console.log(`   Found ${transactionsWithOldName.length} transactions with old name`);

    if (transactionsWithOldName.length > 0) {
      const result = await Transaction.updateMany(
        { 'items.name': OLD_NAME },
        { $set: { 'items.$[item].name': NEW_NAME } },
        { arrayFilters: [{ 'item.name': OLD_NAME }] }
      );
      console.log(`   ✅ Updated ${result.modifiedCount} transactions\n`);
    } else {
      console.log('   ℹ️  No transactions to update\n');
    }

    // ===== 3. FIX SET COMPONENTS IN TRANSACTIONS =====
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 STEP 3: Fixing Set Components in Transactions...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Find transactions with the old name in setComponents
    const transactionsWithOldSetComponent = await Transaction.find({ 'items.setComponents.name': OLD_NAME });
    console.log(`   Found ${transactionsWithOldSetComponent.length} transactions with old set component name`);

    if (transactionsWithOldSetComponent.length > 0) {
      const result = await Transaction.updateMany(
        { 'items.setComponents.name': OLD_NAME },
        { $set: { 'items.$[].setComponents.$[comp].name': NEW_NAME } },
        { arrayFilters: [{ 'comp.name': OLD_NAME }] }
      );
      console.log(`   ✅ Updated ${result.modifiedCount} transactions\n`);
    } else {
      console.log('   ℹ️  No set components to update\n');
    }

    // ===== 4. FIX PRODUCT SET SNAPSHOTS =====
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎁 STEP 4: Fixing Product Set Snapshots...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Find products (sets) that have this product with old snapshot name
    const productsWithOldSnapshot = await Product.find({ 'setItems.productNameSnapshot': OLD_NAME });
    console.log(`   Found ${productsWithOldSnapshot.length} products with old snapshot name`);

    if (productsWithOldSnapshot.length > 0) {
      const result = await Product.updateMany(
        { 'setItems.productNameSnapshot': OLD_NAME },
        { $set: { 'setItems.$[item].productNameSnapshot': NEW_NAME } },
        { arrayFilters: [{ 'item.productNameSnapshot': OLD_NAME }] }
      );
      console.log(`   ✅ Updated ${result.modifiedCount} products\n`);
    } else {
      console.log('   ℹ️  No product snapshots to update\n');
    }

    // ===== SUMMARY =====
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL DONE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Product "${OLD_NAME}" has been renamed to "${NEW_NAME}" everywhere!`);
    console.log('');
    console.log('Updated:');
    console.log(`  • ${usersWithOldKey.length} student item keys`);
    console.log(`  • ${transactionsWithOldName.length} transaction items`);
    console.log(`  • ${transactionsWithOldSetComponent.length} set components in transactions`);
    console.log(`  • ${productsWithOldSnapshot.length} product set snapshots`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

fixRenamedProduct();

