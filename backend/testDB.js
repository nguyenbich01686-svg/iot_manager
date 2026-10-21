require("dotenv")
  .config({
    quiet:
      true,
  });


const {
  withDb,
  closeDB,
} =
  require("./config/db");


async function main() {

  try {

    /* ======================================
       DEVICES
    ====================================== */

    const devices =
      await withDb(
        (pool) =>

          pool
            .request()
            .query(`
              SELECT

                id,
                code,
                name,
                current_status

              FROM devices

              ORDER BY
                id ASC;
            `)
      );


    /* ======================================
       SENSORS
    ====================================== */

    const sensors =
      await withDb(
        (pool) =>

          pool
            .request()
            .query(`
              SELECT

                id,
                name,
                create_at

              FROM sensors

              ORDER BY
                id ASC;
            `)
      );


    /* ======================================
       USERS
    ====================================== */

    const users =
      await withDb(
        (pool) =>

          pool
            .request()
            .query(`
              SELECT

                id,
                student_id,
                name,
                email,
                role

              FROM users

              ORDER BY
                id ASC;
            `)
      );


    /* ======================================
       SENSOR DATA
    ====================================== */

    const latest =
      await withDb(
        (pool) =>

          pool
            .request()
            .query(`
              SELECT TOP 10

                id,
                sensor_id,
                value,
                unit,
                create_at

              FROM data_sensor

              ORDER BY
                id DESC;
            `)
      );


    console.log(
      "\nDEVICES:"
    );


    console.table(
      devices.recordset
    );


    console.log(
      "\nSENSORS:"
    );


    console.table(
      sensors.recordset
    );


    console.log(
      "\nUSERS:"
    );


    console.table(
      users.recordset
    );


    console.log(
      "\nLATEST SENSOR ROWS:"
    );


    console.table(
      latest.recordset
    );


    console.log(
      "\nDatabase test completed successfully."
    );

  } catch (error) {

    console.error(
      "\nDatabase test failed:"
    );


    console.error(
      error
    );


    process.exitCode =
      1;

  } finally {

    await closeDB();
  }
}


main();