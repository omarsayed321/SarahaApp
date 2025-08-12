export const asyncHandler = (fn) => {
  return async (req, res, next) => {
    await fn(req, res, next).catch((error) => {
      error.statusCode = error.statusCode || 500;
      return next(error);
    });
  };
};

export const successResponse = ({
  res,
  message = "Done",
  status = 200,
  data = {},
} = {}) => {
  return res.status(status).json({ message, data });
};

export const globalErrorHandling = (error, req, res, next) => {
  return res.status(error.statusCode || 400).json({ 
    message: error.message ,
    error,
    stack:process.env.MOOD==="DEV" ? error.stack : undefined
  });
};
