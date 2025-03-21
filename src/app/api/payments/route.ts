import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const { tripId, memberId, hasPaid } = await request.json();

    await db.query(
      `UPDATE trip_participants 
       SET has_paid = ?
       WHERE trip_id = ? AND member_id = ?`,
      [hasPaid ? 1 : 0, tripId, memberId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
  }
} 