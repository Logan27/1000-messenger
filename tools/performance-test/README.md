# Performance Testing

Load testing tools for the 1000-Messenger application.

## Setup

```bash
cd tools/performance-test
npm install
```

## Running Tests

### Basic Test (100 users, 10 msg/s, 60 seconds)

```bash
npm run test:load
```

### Custom Configuration

```bash
# Test with 1000 users
NUM_USERS=1000 npm run test:load

# Test with higher message rate
NUM_USERS=500 MESSAGE_RATE=100 npm run test:load

# Full scale test (5 minutes)
NUM_USERS=1000 MESSAGE_RATE=100 DURATION=300 npm run test:load

# Test against production
API_URL=https://api.your-domain.com WS_URL=wss://api.your-domain.com npm run test:load
```

## Performance Targets

- **Concurrent Users**: 1000+
- **Message Rate**: 50-100 msg/s sustained
- **P95 Latency**: < 300ms
- **P99 Latency**: < 500ms
- **Error Rate**: < 1%

## Interpreting Results

### Passing Test
```
✓ PASS - Target message rate (50-100 msg/s): 75.32 msg/s
✓ PASS - P95 latency < 300ms: 245ms
✓ PASS - P99 latency < 500ms: 387ms
✓ PASS - Error rate < 1%: 0.12%
✓ PASS - All users connected: 1000/1000

✓ ALL CHECKS PASSED
```

### Failing Test
```
✗ FAIL - P95 latency < 300ms: 456ms
✗ FAIL - Error rate < 1%: 3.45%

✗ SOME CHECKS FAILED
```

## Troubleshooting

### Connection Errors

Increase system limits:

```bash
# Linux
ulimit -n 65536

# macOS
sudo launchctl limit maxfiles 65536 200000
```

### Memory Issues

Increase Node.js memory:

```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run test:load
```

### Database Bottlenecks

Monitor database during test:

```sql
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Test
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run load test
        run: |
          docker-compose up -d
          cd tools/performance-test
          npm install
          npm run test:load
```
