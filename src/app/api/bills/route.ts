import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Lấy danh sách bills với thông tin người trả tiền
    const bills = await query(`
      SELECT 
        b.*,
        m.name as organizer_name,
        m.avatar as organizer_avatar,
        m.payment_qr as organizer_payment_qr,
        GROUP_CONCAT(bp.member_id) as participant_ids,
        GROUP_CONCAT(bp.has_paid) as payment_statuses
      FROM bills b
      JOIN members m ON b.payer_id = m.id
      LEFT JOIN bill_participants bp ON b.id = bp.bill_id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);

    // Format lại dữ liệu
    const formattedBills = bills.map((bill: any) => {
      const participantIds = bill.participant_ids ? bill.participant_ids.split(',').map(Number) : [];
      const paymentStatuses = bill.payment_statuses ? bill.payment_statuses.split(',').map(Number) : [];
      
      const payments: Record<number, boolean> = {};
      participantIds.forEach((id: number, index: number) => {
        payments[id] = Boolean(paymentStatuses[index]);
      });

      return {
        ...bill,
        participants: participantIds,
        payments,
        organizer: {
          id: bill.payer_id,
          name: bill.organizer_name,
          avatar: bill.organizer_avatar,
          payment_qr: bill.organizer_payment_qr
        }
      };
    });

    return NextResponse.json(formattedBills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, total_amount, table_number, status, start_time, end_time, notes, payer_id, participants } = body;

    if (!date || !total_amount || !table_number || !payer_id || !participants?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Thêm bill mới
    const result = await query(
      `INSERT INTO bills (date, total_amount, table_number, status, start_time, end_time, notes, payer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
      [date, total_amount, table_number, status || 'active', start_time, end_time || null, notes || null, payer_id]
    );

    const billId = result[0].id;

    // Thêm người chơi vào bill
    for (const participantId of participants) {
      await query(
        'INSERT INTO bill_participants (bill_id, member_id, has_paid) VALUES (?, ?, ?)',
        [billId, participantId, participantId === payer_id ? 1 : 0]
      );
    }

    return NextResponse.json({ billId });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE bills SET status = ? WHERE id = ? RETURNING *',
      [status, id]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ bill: result[0] });
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: 'Failed to update bill' },
      { status: 500 }
    );
  }
} 