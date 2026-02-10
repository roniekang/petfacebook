export const appConfig = () => ({
  port: parseInt(process.env.API_PORT || "4000", 10),
  jwt: {
    secret: process.env.JWT_SECRET || "pettopia-jwt-secret",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || "pettopia-jwt-refresh-secret",
    expiresIn: "1h",
    refreshExpiresIn: "7d",
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT,
    bucket: process.env.STORAGE_BUCKET,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
  },
  geoIp: {
    apiKey: process.env.GEO_IP_API_KEY,
  },
});
