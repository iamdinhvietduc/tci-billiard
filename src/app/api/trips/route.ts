import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { BilliardTrip } from '@/types';

interface TripResult {
  id: string;
  date: string;
  total_amount: number;
  payer_id: string;
  status: 'active' | 'cancelled';
  created_at: string;
  participants: string;
  payment_status: string;
}

export async function GET() {
  try {
    const trips = await db.query<TripResult>(`
      SELECT t.*, 
             GROUP_CONCAT(tp.member_id) as participants,
             GROUP_CONCAT(tp.has_paid) as payment_status
      FROM trips t
      LEFT JOIN trip_participants tp ON t.id = tp.trip_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    // Process the results to format participants and payment status
    const formattedTrips: BilliardTrip[] = trips.map(trip => ({
      id: trip.id,
      date: trip.date,
      total_amount: trip.total_amount,
      payer_id: trip.payer_id,
      status: trip.status,
      created_at: trip.created_at,
      participants: trip.participants ? trip.participants.split(',') : [],
      payments: trip.payment_status ? 
        Object.fromEntries(
          trip.participants.split(',').map((id, index) => [
            id,
            trip.payment_status.split(',')[index] === '1'
          ])
        ) : {}
    }));

    return NextResponse.json(formattedTrips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, total_amount, payer_id, participants } = await request.json();
    const id = uuidv4();

    // Insert trip
    await db.query(
      `INSERT INTO trips (id, date, total_amount, payer_id)
       VALUES (?, ?, ?, ?)`,
      [id, date, total_amount, payer_id]
    );

    // Insert participants
    for (const participantId of participants) {
      await db.query(
        `INSERT INTO trip_participants (trip_id, member_id)
         VALUES (?, ?)`,
        [id, participantId]
      );
    }

    const [trip] = await db.query<TripResult>(`
      SELECT t.*, 
             GROUP_CONCAT(tp.member_id) as participants,
             GROUP_CONCAT(tp.has_paid) as payment_status
      FROM trips t
      LEFT JOIN trip_participants tp ON t.id = tp.trip_id
      WHERE t.id = ?
      GROUP BY t.id
    `, [id]);

    const formattedTrip: BilliardTrip = {
      id: trip.id,
      date: trip.date,
      total_amount: trip.total_amount,
      payer_id: trip.payer_id,
      status: trip.status,
      created_at: trip.created_at,
      participants: trip.participants ? trip.participants.split(',') : [],
      payments: trip.payment_status ? 
        Object.fromEntries(
          trip.participants.split(',').map((id, index) => [
            id,
            trip.payment_status.split(',')[index] === '1'
          ])
        ) : {}
    };

    return NextResponse.json(formattedTrip);
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();

    await db.query(
      'UPDATE trips SET status = ? WHERE id = ?',
      [status, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    // Delete participants first
    await db.query(
      'DELETE FROM trip_participants WHERE trip_id = ?',
      [id]
    );

    // Then delete the trip
    await db.query(
      'DELETE FROM trips WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  }
} 