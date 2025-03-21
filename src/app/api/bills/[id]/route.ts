import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const billId = parseInt(params.id);
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
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

    // Cập nhật trạng thái bill
    await query(
      'UPDATE bills SET status = ? WHERE id = ?',
      [status, billId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating bill status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update bill status' },
      { status: 500 }
    );
  }
} 