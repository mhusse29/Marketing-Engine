// Simple test endpoint - NO auth, NO dependencies
export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: "API is working!",
    timestamp: new Date().toISOString(),
    method: req.method
  });
}
