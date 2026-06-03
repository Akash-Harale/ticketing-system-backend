// sendResponse.js
export const sendResponse = (
  res,
  status,
  success,
  message,
  data = null,
  error = null,
  req = null
) => {
  const response = {
    success,
    status,
    message,
    data,
    error,
    requestId: req?.requestId || "N/A",
    timestamp: new Date().toISOString(),
    path: req?.originalUrl || null
  };

  return res.status(status).json(response);
};

