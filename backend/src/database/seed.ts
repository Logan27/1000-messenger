/**
 * Database Seed Script
 * 
 * This script seeds the database with initial test data for development.
 * 
 * Usage:
 *   npm run seed
 *   or: node -r ts-node/register src/database/seed.ts
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

async function seedDatabase() {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🌱 Starting database seeding...');
  console.log('📍 Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Check if data already exists
    const { rows } = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(rows[0].count);

    if (userCount > 0) {
      console.log(`⚠️  Database already contains ${userCount} users`);
      console.log('⏭️  Skipping seed to avoid duplicates');
      client.release();
      await pool.end();
      return;
    }

    console.log('📝 Creating test users...');

    // Hash passwords
    const password = await bcrypt.hash('password123', 12);

    // Create test users
    const testUsers = [
      {
        username: 'alice',
        display_name: 'Alice Johnson',
        status: 'online',
      },
      {
        username: 'bob',
        display_name: 'Bob Smith',
        status: 'online',
      },
      {
        username: 'charlie',
        display_name: 'Charlie Brown',
        status: 'offline',
      },
      {
        username: 'diana',
        display_name: 'Diana Prince',
        status: 'away',
      },
    ];

    const userIds: string[] = [];

    for (const user of testUsers) {
      const result = await client.query(
        `INSERT INTO users (username, password_hash, display_name, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [user.username, password, user.display_name, user.status]
      );
      userIds.push(result.rows[0].id);
      console.log(`✅ Created user: ${user.username}`);
    }

    console.log('🤝 Creating contact relationships...');

    // Create contact relationships (Alice <-> Bob, Alice <-> Charlie, Bob <-> Diana)
    const contacts = [
      { user1: 0, user2: 1 }, // Alice <-> Bob
      { user1: 0, user2: 2 }, // Alice <-> Charlie
      { user1: 1, user2: 3 }, // Bob <-> Diana
    ];

    for (const contact of contacts) {
      const userId1 = userIds[contact.user1];
      const userId2 = userIds[contact.user2];

      // Create bidirectional contact relationship
      await client.query(
        `INSERT INTO contacts (user_id, contact_id, status, requested_by, accepted_at)
         VALUES ($1, $2, 'accepted', $1, CURRENT_TIMESTAMP),
                ($2, $1, 'accepted', $1, CURRENT_TIMESTAMP)`,
        [userId1, userId2]
      );

      console.log(
        `✅ Created contact: ${testUsers[contact.user1].username} <-> ${testUsers[contact.user2].username}`
      );
    }

    console.log('💬 Creating direct chats...');

    // Create direct chats for each contact pair
    for (const contact of contacts) {
      const userId1 = userIds[contact.user1];
      const userId2 = userIds[contact.user2];

      // Create chat
      const chatResult = await client.query(
        `INSERT INTO chats (type, slug, last_message_at)
         VALUES ('direct', $1, CURRENT_TIMESTAMP)
         RETURNING id`,
        [`direct-${userId1}-${userId2}`]
      );
      const chatId = chatResult.rows[0].id;

      // Add participants
      await client.query(
        `INSERT INTO chat_participants (chat_id, user_id, role)
         VALUES ($1, $2, 'member'), ($1, $3, 'member')`,
        [chatId, userId1, userId2]
      );

      console.log(
        `✅ Created chat: ${testUsers[contact.user1].username} <-> ${testUsers[contact.user2].username}`
      );

      // Add a sample message
      const senderIdx = contact.user1;
      const messageResult = await client.query(
        `INSERT INTO messages (chat_id, sender_id, content, content_type)
         VALUES ($1, $2, $3, 'text')
         RETURNING id`,
        [
          chatId,
          userIds[senderIdx],
          `Hi ${testUsers[contact.user2].display_name}! This is a test message.`,
        ]
      );
      const messageId = messageResult.rows[0].id;

      // Create delivery status for recipient
      const recipientIdx = contact.user2;
      await client.query(
        `INSERT INTO message_delivery (message_id, user_id, status, delivered_at)
         VALUES ($1, $2, 'delivered', CURRENT_TIMESTAMP)`,
        [messageId, userIds[recipientIdx]]
      );

      console.log(`  └─ Added sample message`);
    }

    console.log('👥 Creating a group chat...');

    // Create a group chat with Alice, Bob, and Charlie
    const groupResult = await client.query(
      `INSERT INTO chats (type, name, slug, owner_id, last_message_at)
       VALUES ('group', 'Team Chat', 'team-chat', $1, CURRENT_TIMESTAMP)
       RETURNING id`,
      [userIds[0]] // Alice is owner
    );
    const groupChatId = groupResult.rows[0].id;

    // Add participants (Alice, Bob, Charlie)
    await client.query(
      `INSERT INTO chat_participants (chat_id, user_id, role)
       VALUES ($1, $2, 'owner'), ($1, $3, 'member'), ($1, $4, 'member')`,
      [groupChatId, userIds[0], userIds[1], userIds[2]]
    );

    console.log('✅ Created group chat: Team Chat');

    // Add a welcome message
    const groupMessageResult = await client.query(
      `INSERT INTO messages (chat_id, sender_id, content, content_type)
       VALUES ($1, $2, 'Welcome to the team chat!', 'text')
       RETURNING id`,
      [groupChatId, userIds[0]]
    );
    const groupMessageId = groupMessageResult.rows[0].id;

    // Create delivery status for all recipients (Bob and Charlie)
    await client.query(
      `INSERT INTO message_delivery (message_id, user_id, status, delivered_at)
       VALUES ($1, $2, 'delivered', CURRENT_TIMESTAMP),
              ($1, $3, 'delivered', CURRENT_TIMESTAMP)`,
      [groupMessageId, userIds[1], userIds[2]]
    );

    console.log('  └─ Added welcome message');

    client.release();
    await pool.end();

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Test credentials (all passwords: password123):');
    console.log('  - alice / password123');
    console.log('  - bob / password123');
    console.log('  - charlie / password123');
    console.log('  - diana / password123');
    console.log('');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { seedDatabase };
