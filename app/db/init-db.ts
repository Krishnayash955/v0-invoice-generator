"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function initializeDatabase() {
  try {
    // Check if tables already exist
    const tablesExist = await checkTablesExist()

    if (!tablesExist) {
      // Create invoices table
      await sql`
        CREATE TABLE IF NOT EXISTS invoices (
          id SERIAL PRIMARY KEY,
          invoice_number VARCHAR(50) NOT NULL,
          invoice_date DATE NOT NULL,
          due_date DATE NOT NULL,
          
          -- Company information
          company_name VARCHAR(255) NOT NULL,
          company_address TEXT NOT NULL,
          company_email VARCHAR(255) NOT NULL,
          company_phone VARCHAR(50) NOT NULL,
          
          -- Client information
          client_name VARCHAR(255) NOT NULL,
          client_address TEXT NOT NULL,
          client_email VARCHAR(255) NOT NULL,
          
          -- Additional information
          notes TEXT,
          total_amount DECIMAL(10, 2) NOT NULL,
          status VARCHAR(50) DEFAULT 'draft',
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Create line_items table
      await sql`
        CREATE TABLE IF NOT EXISTS line_items (
          id SERIAL PRIMARY KEY,
          invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
          description TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10, 2) NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Create index for faster lookups
      await sql`
        CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON line_items(invoice_id)
      `

      return { success: true, message: "Database tables created successfully" }
    }

    return { success: true, message: "Database tables already exist" }
  } catch (error) {
    console.error("Error initializing database:", error)
    return { success: false, message: "Failed to initialize database", error }
  }
}

async function checkTablesExist() {
  try {
    // Check if invoices table exists
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'invoices'
      )
    `
    return result[0].exists
  } catch (error) {
    console.error("Error checking if tables exist:", error)
    return false
  }
}
