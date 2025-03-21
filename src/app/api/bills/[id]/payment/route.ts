import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const billId = parseInt(params.id);
    const body = await request.json();
    const { participantId, status } = body;

    if (!participantId || typeof status !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Kiểm tra bill tồn tại
    const billExists = await query(
      'SELECT id FROM bills WHERE id = ?',
      [billId]
    );

    if (billExists.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Bill not found' },
        { status: 404 }
      );
    }

    // Cập nhật trạng thái thanh toán
    await query(
      'UPDATE bill_participants SET has_paid = ? WHERE bill_id = ? AND member_id = ?',
      [status ? 1 : 0, billId, participantId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update payment status' },
      { status: 500 }
    );
  }
} 