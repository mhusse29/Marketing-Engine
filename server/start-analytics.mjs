import { startServer } from './analyticsGateway.mjs';

console.log('Starting analytics gateway...');
startServer().then((port) => {
  console.log(`✅ Analytics gateway listening on port ${port}`);
}).catch((error) => {
  console.error('❌ Failed to start:', error.message);
  process.exit(1);
});
