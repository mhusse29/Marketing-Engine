#!/usr/bin/env node

import { startServer } from './analyticsGateway.mjs';

// Start the server
startServer().catch((error) => {
  console.error('Failed to start gateway:', error.message);
  process.exit(1);
});
