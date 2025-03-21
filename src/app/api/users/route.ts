import { NextResponse } from 'next/server';
import db, { User } from '@/lib/db';

// GET /api/users
export async function GET() {
  try {
    const users = await db.query<User>(`
      SELECT * FROM users
      ORDER BY name ASC
    `);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(request: Request) {
  try {
    const user = await request.json();
    
    // Validate user data
    if (!user.name || !user.phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingUser = await db.queryOne<User>(
      'SELECT id FROM users WHERE phone = ?',
      [user.phone]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 400 }
      );
    }

    // Insert user
    await db.query(
      `INSERT INTO users (name, phone, avatar, payment_qr)
       VALUES (?, ?, ?, ?)`,
      [
        user.name,
        user.phone,
        user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
        user.payment_qr || null
      ]
    );

    return NextResponse.json({ 
      success: true,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/:id
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if phone number already exists for another user
    if (updates.phone) {
      const existingUser = await db.queryOne<User>(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [updates.phone, id]
      );

      if (existingUser) {
        return NextResponse.json(
          { error: 'Phone number already exists' },
          { status: 400 }
        );
      }
    }

    // Update user
    await db.query(
      `UPDATE users 
       SET name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           avatar = COALESCE(?, avatar),
           payment_qr = COALESCE(?, payment_qr)
       WHERE id = ?`,
      [
        updates.name,
        updates.phone,
        updates.avatar,
        updates.payment_qr,
        id
      ]
    );

    return NextResponse.json({ 
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 