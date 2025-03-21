import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/members
export async function GET() {
  try {
    const members = await query('SELECT * FROM members ORDER BY name ASC');
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/members
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, avatar, payment_qr } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO members (name, phone, avatar, payment_qr) VALUES (?, ?, ?, ?) RETURNING *',
      [name, phone || null, avatar || null, payment_qr || null]
    );

    return NextResponse.json({ member: result[0] });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}

// PUT /api/members/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, phone, avatar, payment_qr } = body;
    const id = parseInt(params.id);

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE members SET name = ?, phone = ?, avatar = ?, payment_qr = ? WHERE id = ? RETURNING *',
      [name, phone, avatar || null, payment_qr || null, id]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ member: result[0] });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/members/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const result = await query('DELETE FROM members WHERE id = ? RETURNING *', [id]);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 