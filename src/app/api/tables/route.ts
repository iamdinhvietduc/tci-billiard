import { NextResponse } from 'next/server';
import db, { Table } from '@/lib/db';

// GET /api/tables
export async function GET() {
  try {
    const tables = await db.query<Table>(`
      SELECT * FROM tables
      ORDER BY name ASC
    `);

    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

// POST /api/tables
export async function POST(request: Request) {
  try {
    const table = await request.json();
    
    // Validate table data
    if (!table.name || !table.type || !table.hourly_rate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert table
    await db.query(
      `INSERT INTO tables (name, type, hourly_rate, status)
       VALUES (?, ?, ?, ?)`,
      [table.name, table.type, table.hourly_rate, table.status || 'available']
    );

    return NextResponse.json({ 
      success: true,
      message: 'Table created successfully'
    });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
}

// PATCH /api/tables/:id
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Table ID is required' },
        { status: 400 }
      );
    }

    await db.query(
      `UPDATE tables 
       SET name = ?, type = ?, hourly_rate = ?, status = ?
       WHERE id = ?`,
      [updates.name, updates.type, updates.hourly_rate, updates.status, id]
    );

    return NextResponse.json({ 
      success: true,
      message: 'Table updated successfully'
    });
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    );
  }
} 