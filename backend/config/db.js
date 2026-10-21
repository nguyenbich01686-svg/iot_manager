const sql = require("mssql");


/* ==========================================
   DATABASE CONFIG
========================================== */

const dbConfig = {
  user:
    process.env.DB_USER,

  password:
    process.env.DB_PASSWORD,

  server:
    process.env.DB_SERVER,

  database:
    process.env.DB_DATABASE,

  options: {
    encrypt: false,

    trustServerCertificate:
      true,

    enableArithAbort:
      true,
  },


  /*
    QUAN TRỌNG:

    Project này không cần nhiều
    SQL connection song song.

    max = 1:
    mọi request sẽ xếp hàng dùng
    chung 1 connection.

    Cách này phù hợp project IoT nhỏ
    và tránh ECONNRESET khi Dashboard
    + MQTT cùng query DB.
  */

  pool: {
    max: 1,

    min: 1,

    idleTimeoutMillis:
      600000,
  },


  connectionTimeout:
    15000,

  requestTimeout:
    30000,
};


/* ==========================================
   INSTANCE / PORT
========================================== */

if (
  process.env.DB_INSTANCE &&
  process.env.DB_INSTANCE.trim()
) {

  dbConfig.options.instanceName =
    process.env.DB_INSTANCE.trim();

} else {

  dbConfig.port =
    Number(
      process.env.DB_PORT ||
      1433
    );
}


/* ==========================================
   CURRENT POOL
========================================== */

let activePool =
  null;


let connectingPromise =
  null;


/* ==========================================
   CHECK CONNECTION ERROR
========================================== */

function isConnectionError(
  error
) {

  const code =
    String(
      error?.code || ""
    ).toUpperCase();


  const message =
    String(
      error?.message || ""
    ).toUpperCase();


  return (
    code === "ESOCKET" ||

    code === "ECONNCLOSED" ||

    code === "ETIMEOUT" ||

    message.includes(
      "ECONNRESET"
    ) ||

    message.includes(
      "CONNECTION LOST"
    ) ||

    message.includes(
      "CONNECTION CLOSED"
    ) ||

    message.includes(
      "SOCKET HANG UP"
    )
  );
}


/* ==========================================
   CLOSE OLD POOL
========================================== */

async function destroyPool(
  pool
) {

  if (!pool) {
    return;
  }


  if (
    activePool === pool
  ) {

    activePool =
      null;
  }


  try {

    await pool.close();

  } catch {

    /*
      Pool đã chết rồi thì close
      có thể lỗi.

      Không cần xử lý thêm.
    */
  }
}


/* ==========================================
   CREATE NEW POOL
========================================== */

async function createPool() {

  const newPool =
    new sql.ConnectionPool(
      dbConfig
    );


  /* ======================================
     POOL ERROR
  ====================================== */

  newPool.on(
    "error",

    (
      error
    ) => {

      console.error(
        "SQL Pool error:",
        error.message
      );


      /*
        Không cho request sau
        tiếp tục dùng pool đã lỗi.
      */

      if (
        activePool ===
        newPool
      ) {

        activePool =
          null;
      }
    }
  );


  /* ======================================
     CONNECT
  ====================================== */

  await newPool.connect();


  activePool =
    newPool;


  console.log(
    "SQL Server connected."
  );


  return newPool;
}


/* ==========================================
   GET POOL
========================================== */

async function getPool() {

  /*
    Connection còn sống
    -> dùng lại.
  */

  if (
    activePool &&
    activePool.connected
  ) {

    return activePool;
  }


  /*
    Có request khác đang connect
    -> chờ request đó.

    Không mở thêm connection.
  */

  if (
    connectingPromise
  ) {

    return connectingPromise;
  }


  connectingPromise =
    createPool()

      .catch(
        (
          error
        ) => {

          activePool =
            null;


          console.error(
            "SQL Server connection error:",
            error.message
          );


          throw error;
        }
      )

      .finally(
        () => {

          connectingPromise =
            null;
        }
      );


  return connectingPromise;
}


/* ==========================================
   CONNECT DATABASE
========================================== */

async function connectDB() {

  return getPool();
}


/* ==========================================
   DATABASE HELPER
========================================== */

async function withDb(
  work,
  options = {}
) {

  const retry =
    options.retry !== false;


  const firstPool =
    await getPool();


  try {

    return await work(
      firstPool
    );

  } catch (error) {

    /*
      Query SQL sai chẳng hạn
      -> không reconnect vô ích.
    */

    if (
      !retry ||
      !isConnectionError(
        error
      )
    ) {

      throw error;
    }


    console.warn(
      "SQL connection lost. Reconnecting once..."
    );


    /* ======================================
       REMOVE DEAD CONNECTION
    ====================================== */

    await destroyPool(
      firstPool
    );


    /*
      Chờ một chút cho socket cũ
      đóng hoàn toàn.
    */

    await new Promise(
      (
        resolve
      ) => {

        setTimeout(
          resolve,
          300
        );
      }
    );


    /* ======================================
       NEW CONNECTION
    ====================================== */

    const secondPool =
      await getPool();


    console.log(
      "SQL reconnected. Retrying query..."
    );


    /*
      Retry đúng 1 lần.
    */

    return work(
      secondPool
    );
  }
}


/* ==========================================
   CLOSE DB
========================================== */

async function closeDB() {

  const pool =
    activePool;


  activePool =
    null;

  connectingPromise =
    null;


  if (!pool) {
    return;
  }


  try {

    await pool.close();

  } catch {

    // Ignore shutdown error.
  }
}


/* ==========================================
   EXPORT
========================================== */

module.exports = {
  sql,

  connectDB,

  getPool,

  withDb,

  closeDB,

  isConnectionError,
};