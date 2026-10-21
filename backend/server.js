require("dotenv")
  .config();


const express =
  require("express");

const cors =
  require("cors");


const {
  connectDB,
} =
  require("./config/db");


const {
  connectMQTT,
  resetLoadingActions,
} =
  require("./services/mqttService");


const authMiddleware =
  require("./middleware/authMiddleware");


const authRoutes =
  require("./routes/authRoutes");

const sensorRoutes =
  require("./routes/sensorRoutes");

const deviceRoutes =
  require("./routes/deviceRoutes");

const actionRoutes =
  require("./routes/actionRoutes");

const userRoutes =
  require("./routes/userRoutes");


const app =
  express();


/* ==========================================
   CONFIG
========================================== */

const PORT =
  Number(
    process.env.PORT ||
    3000
  );


/* ==========================================
   MIDDLEWARE
========================================== */

app.use(
  cors({
    origin:
      process.env
        .FRONTEND_URL ||
      "http://localhost:5173",

    credentials:
      true,
  })
);


app.use(
  express.json()
);


/* ==========================================
   HEALTH CHECK
========================================== */

app.get(
  "/",

  (
    req,
    res
  ) => {

    res.json({
      message:
        "IoT Manager Backend",
    });
  }
);


/* ==========================================
   PUBLIC ROUTES
========================================== */

app.use(
  "/api/auth",
  authRoutes
);


/* ==========================================
   AUTHENTICATION
========================================== */

app.use(
  authMiddleware
);


/* ==========================================
   PRIVATE ROUTES
========================================== */

app.use(
  "/api/sensors",
  sensorRoutes
);

app.use(
  "/api/devices",
  deviceRoutes
);

app.use(
  "/api/actions",
  actionRoutes
);

app.use(
  "/api/users",
  userRoutes
);


/* ==========================================
   START SERVER
========================================== */

async function startServer() {

  try {

    /* ======================================
       SQL SERVER
    ====================================== */

    await connectDB();


    /* ======================================
       OLD LOADING ACTIONS -> ERROR

       Ví dụ backend bị tắt giữa lúc
       đang chờ phần cứng.
    ====================================== */

    await resetLoadingActions();


    /* ======================================
       MQTT
    ====================================== */

    connectMQTT();


    /* ======================================
       EXPRESS
    ====================================== */

    app.listen(
      PORT,
      () => {

        console.log(
          `Backend running: http://localhost:${PORT}`
        );

      }
    );

  } catch (error) {

    console.error(
      "Start server error:",
      error
    );


    process.exit(
      1
    );
  }
}


startServer();