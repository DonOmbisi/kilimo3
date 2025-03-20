// 404.js - Serverless function to handle unmatched routes
module.exports = (req, res) => {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Allow common HTTP methods
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  // Allow common headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS method for preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return 404 with a meaningful error message
  return res.status(404).json({
    success: false,
    error: 'Resource Not Found',
    message: `The requested endpoint '${req.url}' does not exist on this server.`,
    documentation: 'Please refer to the API documentation for available endpoints.',
  });
};

