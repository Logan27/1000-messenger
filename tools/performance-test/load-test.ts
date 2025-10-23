import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { faker } from '@faker-js/faker';

interface TestConfig {
  baseUrl: string;
  wsUrl: string;
  numberOfUsers: number;
  messagesPerSecond: number;
  testDurationSeconds: number;
}

interface Metrics {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  averageLatency: number;
  successRate: number;
  errors: number;
  connectionErrors: number;
}

class LoadTester {
  private config: TestConfig;
  private users: Array<{
    id: string;
    username: string;
    token: string;
    socket: Socket;
  }> = [];
  private metrics: Metrics = {
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    averageLatency: 0,
    successRate: 0,
    errors: 0,
    connectionErrors: 0,
  };
  private latencies: number[] = [];

  constructor(config: TestConfig) {
    this.config = config;
  }

  async run() {
    console.log('🚀 Starting load test...');
    console.log(`👥 Simulating ${this.config.numberOfUsers} users`);
    console.log(`📨 Target: ${this.config.messagesPerSecond} messages/second`);
    console.log(`⏱️  Duration: ${this.config.testDurationSeconds} seconds\n`);

    try {
      // Phase 1: Register and authenticate users
      await this.createUsers();

      // Phase 2: Connect users via WebSocket
      await this.connectUsers();

      // Phase 3: Create test chats
      const chatId = await this.createTestChat();

      // Phase 4: Simulate message sending
      await this.simulateMessaging(chatId);

      // Phase 5: Cleanup
      await this.cleanup();

      // Display results
      this.displayResults();
    } catch (error) {
      console.error('❌ Load test failed:', error);
    }
  }

  private async createUsers() {
    console.log('📝 Creating users...');
    const startTime = Date.now();

    const createPromises = Array.from({ length: this.config.numberOfUsers }, async (_, i) => {
      const username = `testuser_${i}_${faker.string.alphanumeric(6)}`;
      const password = 'Test123!';

      try {
        const response = await axios.post(`${this.config.baseUrl}/api/auth/register`, {
          username,
          password,
          passwordConfirm: password,
        });

        const loginResponse = await axios.post(`${this.config.baseUrl}/api/auth/login`, {
          username,
          password,
        });

        this.users.push({
          id: loginResponse.data.user.id,
          username,
          token: loginResponse.data.accessToken,
          socket: null as any,
        });
      } catch (error) {
        console.error(`Failed to create user ${username}:`, error);
        this.metrics.errors++;
      }
    });

    await Promise.all(createPromises);

    const duration = Date.now() - startTime;
    console.log(`✅ Created ${this.users.length} users in ${duration}ms\n`);
  }

  private async connectUsers() {
    console.log('🔌 Connecting users via WebSocket...');
    const startTime = Date.now();

    const connectPromises = this.users.map((user) => {
      return new Promise<void>((resolve, reject) => {
        const socket = io(this.config.wsUrl, {
          auth: { token: user.token },
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          user.socket = socket;
          resolve();
        });

        socket.on('connect_error', (error) => {
          console.error(`Connection error for ${user.username}:`, error);
          this.metrics.connectionErrors++;
          reject(error);
        });

        socket.on('message:new', (message) => {
          this.metrics.totalMessagesReceived++;
          
          // Calculate latency
          const sentAt = message.metadata?.sentAt;
          if (sentAt) {
            const latency = Date.now() - sentAt;
            this.latencies.push(latency);
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });
    });

    try {
      await Promise.all(connectPromises);
      const duration = Date.now() - startTime;
      console.log(`✅ Connected ${this.users.length} users in ${duration}ms\n`);
    } catch (error) {
      console.error('Some users failed to connect');
    }
  }

  private async createTestChat(): Promise<string> {
    console.log('💬 Creating test group chat...');

    const owner = this.users[0];
    const participantIds = this.users.slice(1, 50).map(u => u.id); // Group of 50

    const response = await axios.post(
      `${this.config.baseUrl}/api/chats/group`,
      {
        name: 'Load Test Group',
        participantIds,
      },
      {
        headers: { Authorization: `Bearer ${owner.token}` },
      }
    );

    console.log(`✅ Created chat: ${response.data.chat.id}\n`);
    return response.data.chat.id;
  }

  private async simulateMessaging(chatId: string) {
    console.log('📤 Starting message simulation...');
    
    const interval = 1000 / this.config.messagesPerSecond;
    const totalMessages = this.config.messagesPerSecond * this.config.testDurationSeconds;

    let messagesSent = 0;
    const startTime = Date.now();

    return new Promise<void>((resolve) => {
      const intervalId = setInterval(() => {
        if (messagesSent >= totalMessages) {
          clearInterval(intervalId);
          const duration = Date.now() - startTime;
          console.log(`\n✅ Sent ${messagesSent} messages in ${duration}ms`);
          resolve();
          return;
        }

        // Pick random user
        const user = this.users[Math.floor(Math.random() * this.users.length)];
        
        if (user.socket && user.socket.connected) {
          const message = {
            chatId,
            content: faker.lorem.sentence(),
            metadata: { sentAt: Date.now() },
          };

          user.socket.emit('message:send', message);
          this.metrics.totalMessagesSent++;
          messagesSent++;

          // Progress indicator
          if (messagesSent % 100 === 0) {
            process.stdout.write(`\r📨 Sent: ${messagesSent}/${totalMessages} messages`);
          }
        }
      }, interval);
    });
  }

  private async cleanup() {
    console.log('\n🧹 Cleaning up...');

    // Disconnect all sockets
    this.users.forEach(user => {
      if (user.socket) {
        user.socket.disconnect();
      }
    });

    console.log('✅ Cleanup complete\n');
  }

  private displayResults() {
    // Calculate metrics
    this.metrics.averageLatency = this.latencies.length > 0
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
      : 0;

    this.metrics.successRate = this.metrics.totalMessagesSent > 0
      ? (this.metrics.totalMessagesReceived / this.metrics.totalMessagesSent) * 100
      : 0;

    const p50 = this.percentile(this.latencies, 0.5);
    const p95 = this.percentile(this.latencies, 0.95);
    const p99 = this.percentile(this.latencies, 0.99);

    console.log('═══════════════════════════════════════════════════════');
    console.log('                    TEST RESULTS                       ');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`👥 Total Users:              ${this.config.numberOfUsers}`);
    console.log(`📤 Messages Sent:            ${this.metrics.totalMessagesSent}`);
    console.log(`📥 Messages Received:        ${this.metrics.totalMessagesReceived}`);
    console.log(`✅ Success Rate:             ${this.metrics.successRate.toFixed(2)}%`);
    console.log(`❌ Errors:                   ${this.metrics.errors}`);
    console.log(`🔌 Connection Errors:        ${this.metrics.connectionErrors}`);
    console.log('───────────────────────────────────────────────────────');
    console.log('                      LATENCY                          ');
    console.log('───────────────────────────────────────────────────────');
    console.log(`⏱️  Average:                 ${this.metrics.averageLatency.toFixed(2)}ms`);
    console.log(`📊 P50 (median):             ${p50.toFixed(2)}ms`);
    console.log(`📊 P95:                      ${p95.toFixed(2)}ms`);
    console.log(`📊 P99:                      ${p99.toFixed(2)}ms`);
    console.log(`📊 Min:                      ${Math.min(...this.latencies).toFixed(2)}ms`);
    console.log(`📊 Max:                      ${Math.max(...this.latencies).toFixed(2)}ms`);
    console.log('═══════════════════════════════════════════════════════\n');
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// Run the test
const config: TestConfig = {
  baseUrl: process.env.API_URL || 'http://localhost:3000',
  wsUrl: process.env.WS_URL || 'http://localhost:3000',
  numberOfUsers: parseInt(process.env.NUM_USERS || '1000'),
  messagesPerSecond: parseInt(process.env.MSG_PER_SEC || '50'),
  testDurationSeconds: parseInt(process.env.DURATION || '60'),
};

const tester = new LoadTester(config);
tester.run().catch(console.error);
