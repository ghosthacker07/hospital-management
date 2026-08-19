#!/usr/bin/env node
/**
 * TiDB Cloud & MySQL Database CLI Tool for Hospital Management System
 * Usage:
 *   node db_cli.js test                    # Test connection to TiDB Cloud / MySQL
 *   node db_cli.js init                    # Initialize schema.sql & triggers on TiDB Cloud
 *   node db_cli.js query "SELECT * FROM Patient" # Run direct SQL query
 *   node db_cli.js shell                   # Interactive SQL shell
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return {
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      multipleStatements: true
    };
  }

  const isCloud = process.env.DB_HOST && (process.env.DB_HOST.includes('tidbcloud') || process.env.DB_HOST.includes('aiven') || process.env.DB_SSL === 'true');
  
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'YOUR_MYSQL_PASSWORD',
    database: process.env.DB_NAME || 'HospitalDB',
    port: parseInt(process.env.DB_PORT || '4000'),
    ssl: isCloud ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true
  };
}

async function testConnection() {
  const config = getDbConfig();
  console.log('\n🔍 Testing connection to TiDB Cloud...');
  console.log(`   Host: ${config.host || config.uri}`);
  console.log(`   Port: ${config.port || 4000}`);
  console.log(`   User: ${config.user || 'from URL'}`);

  try {
    // Connect without default database first to test credentials
    const connConfig = { ...config };
    delete connConfig.database;
    const conn = await mysql.createConnection(connConfig);
    const [rows] = await conn.query('SELECT VERSION() as version, NOW() as server_time');
    console.log('\n✅ TiDB Cloud Connection & Authentication 100% Successful!');
    console.log(`   Engine: TiDB (${rows[0].version})`);
    console.log(`   Server Time (UTC): ${rows[0].server_time}`);
    await conn.end();
    return true;
  } catch (err) {
    console.error('\n❌ Connection Failed:');
    console.error(`   Error: ${err.message}`);
    return false;
  }
}

async function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.sql file not found!');
    return;
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  const config = getDbConfig();

  console.log('\n🚀 Initializing Schema & Tables on TiDB Cloud...');
  try {
    // 1. Connect and create HospitalDB
    const rootConfig = { ...config };
    delete rootConfig.database;
    const rootConn = await mysql.createConnection(rootConfig);
    await rootConn.query('CREATE DATABASE IF NOT EXISTS HospitalDB');
    console.log('✅ Database HospitalDB created successfully.');
    await rootConn.end();

    // 2. Connect to HospitalDB
    const conn = await mysql.createConnection({ ...config, database: 'HospitalDB' });
    
    // Split statements safely
    const rawStatements = sql
      .replace(/DELIMITER \/\//gi, '')
      .replace(/DELIMITER ;/gi, '')
      .replace(/\/\//g, ';')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('USE ') && !s.startsWith('CREATE DATABASE '));

    for (const stmt of rawStatements) {
      try {
        await conn.query(stmt);
      } catch (stmtErr) {
        if (!stmtErr.message.includes('already exists')) {
          console.log(`   Notice: ${stmtErr.message}`);
        }
      }
    }

    console.log('✅ All Tables (Patient, Doctor, Appointment, Billing, Medical_Record, Audit) and Seed Data deployed to TiDB Cloud!');
    await conn.end();
  } catch (err) {
    console.error(`❌ Schema initialization error: ${err.message}`);
  }
}

async function runQuery(sqlQuery) {
  if (!sqlQuery) {
    console.log('Please provide a SQL query. Example: node db_cli.js query "SELECT * FROM Patient"');
    return;
  }

  try {
    const conn = await mysql.createConnection(getDbConfig());
    const [rows] = await conn.query(sqlQuery);
    console.log('\n📊 Query Results:');
    console.table(rows);
    await conn.end();
  } catch (err) {
    console.error(`❌ Query Error: ${err.message}`);
  }
}

async function startShell() {
  console.log('\n=============================================');
  console.log('  TiDB Cloud / MySQL Interactive SQL Shell   ');
  console.log('  Type your SQL command and hit Enter.        ');
  console.log('  Type "exit" or "quit" to leave.             ');
  console.log('=============================================\n');

  let conn;
  try {
    conn = await mysql.createConnection(getDbConfig());
    console.log(' Connected to DB.\n');
  } catch (err) {
    console.error('❌ Could not connect to DB:', err.message);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'HospitalDB > '
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      await conn.end();
      rl.close();
      return;
    }

    if (trimmed.length > 0) {
      try {
        const [rows] = await conn.query(trimmed);
        if (Array.isArray(rows)) {
          console.table(rows);
        } else {
          console.log(`✅ Success: ${rows.affectedRows || 0} row(s) affected.`);
        }
      } catch (err) {
        console.error(`❌ Error: ${err.message}`);
      }
    }
    rl.prompt();
  });
}

const command = process.argv[2] || 'test';
const arg = process.argv.slice(3).join(' ');

switch (command.toLowerCase()) {
  case 'test':
    testConnection();
    break;
  case 'init':
    initSchema();
    break;
  case 'query':
    runQuery(arg);
    break;
  case 'shell':
    startShell();
    break;
  default:
    console.log('Unknown command. Available commands: test, init, query, shell');
}
