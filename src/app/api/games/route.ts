import { NextResponse } from 'next/server';
import db, { Game, GamePlayer } from '@/lib/db';

interface GameWithDetails extends Game {
  table_name: string;
  table_type: string;
  players: {
    id: number;
    name: string;
    is_winner: boolean;
    amount_to_pay: number;
    has_paid: boolean;
    payment_method?: string;
  }[];
}

// GET /api/games
export async function GET() {
  try {
    const games = await db.query<GameWithDetails>(`
      SELECT 
        g.*,
        t.name as table_name,
        t.type as table_type,
        json_group_array(
          json_object(
            'id', u.id,
            'name', u.name,
            'is_winner', gp.is_winner,
            'amount_to_pay', gp.amount_to_pay,
            'has_paid', gp.has_paid,
            'payment_method', gp.payment_method
          )
        ) as players
      FROM games g
      JOIN tables t ON g.table_id = t.id
      LEFT JOIN game_players gp ON g.id = gp.game_id
      LEFT JOIN users u ON gp.user_id = u.id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `);

    // Parse players JSON string
    const formattedGames = games.map(game => ({
      ...game,
      players: JSON.parse(game.players as unknown as string)
    }));

    return NextResponse.json(formattedGames);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

// POST /api/games
export async function POST(request: Request) {
  try {
    const game = await request.json();
    
    // Validate game data
    if (!game.table_id || !game.players || game.players.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return await db.executeTransaction(async (db) => {
      // Insert game
      const result = await db.run(`
        INSERT INTO games (table_id, start_time, status)
        VALUES (?, ?, 'active')
      `, [game.table_id, new Date().toISOString()]);

      const gameId = result.lastID;

      // Insert game players
      for (const playerId of game.players) {
        await db.run(`
          INSERT INTO game_players (game_id, user_id, amount_to_pay)
          VALUES (?, ?, 0)
        `, [gameId, playerId]);
      }

      // Update table status
      await db.run(`
        UPDATE tables
        SET status = 'occupied'
        WHERE id = ?
      `, [game.table_id]);

      return NextResponse.json({ 
        success: true,
        message: 'Game created successfully',
        gameId
      });
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}

// PATCH /api/games/:id
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    return await db.executeTransaction(async (db) => {
      // Get game details
      const game = await db.get<Game>('SELECT * FROM games WHERE id = ?', [id]);
      if (!game) {
        return NextResponse.json(
          { error: 'Game not found' },
          { status: 404 }
        );
      }

      // Update game
      await db.run(`
        UPDATE games 
        SET status = ?, end_time = ?, total_amount = ?
        WHERE id = ?
      `, [
        updates.status || game.status,
        updates.end_time || game.end_time,
        updates.total_amount || game.total_amount,
        id
      ]);

      // If game is completed or cancelled, update table status
      if (updates.status === 'completed' || updates.status === 'cancelled') {
        await db.run(`
          UPDATE tables
          SET status = 'available'
          WHERE id = ?
        `, [game.table_id]);
      }

      // Update player payments if provided
      if (updates.players) {
        for (const player of updates.players) {
          await db.run(`
            UPDATE game_players
            SET amount_to_pay = ?, has_paid = ?, payment_method = ?, paid_at = ?
            WHERE game_id = ? AND user_id = ?
          `, [
            player.amount_to_pay,
            player.has_paid,
            player.payment_method,
            player.has_paid ? new Date().toISOString() : null,
            id,
            player.id
          ]);

          // If player has paid, create payment record
          if (player.has_paid) {
            await db.run(`
              INSERT INTO payments (game_id, user_id, amount, payment_method, status)
              VALUES (?, ?, ?, ?, 'completed')
            `, [id, player.id, player.amount_to_pay, player.payment_method]);
          }
        }
      }

      return NextResponse.json({ 
        success: true,
        message: 'Game updated successfully'
      });
    });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    );
  }
} 