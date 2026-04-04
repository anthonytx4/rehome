export const errorHandler = (err, req, res, _next) => {
  const statusCode = Number(err.status || err.statusCode || 500);
  const requestId = res.locals.requestId;

  console.error(`[${requestId || 'request'}] Error:`, err.message);
  console.error(err.stack);

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  return res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal server error' : (err.message || 'Request failed'),
    ...(requestId ? { requestId } : {}),
  });
};
