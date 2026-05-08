export const getHealth = (req, res) => {
  res.json({
    success: true,
    message: "API funcionando",
    environment: process.env.NODE_ENV || "development",
  });
};
