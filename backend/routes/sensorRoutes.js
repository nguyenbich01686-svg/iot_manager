const express =
  require("express");


const router =
  express.Router();


const {
  withDb,
} =
  require("../config/db");


/* ==========================================
   FORMAT SENSOR
========================================== */

function formatSensorRecord(
  item
) {

  return {

    id:
      Number(
        item.id
      ),

    temperature:
      Number(
        item.temperature
      ),

    humidity:
      Number(
        item.humidity
      ),

    light:
      Number(
        item.light
      ),

    recordedAt:
      item.create_at,
  };
}


/* ==========================================
   GET SENSOR HISTORY

   GET /api/sensors
========================================== */

router.get(
  "/",

  async (
    req,
    res
  ) => {

    try {

      const result =
        await withDb(
          (pool) =>

            pool
              .request()
              .query(`
                WITH latest_samples AS (

                  SELECT TOP 3000
                    create_at

                  FROM data_sensor

                  GROUP BY
                    create_at

                  ORDER BY
                    create_at DESC
                )

                SELECT

                  MAX(ds.id)
                    AS id,

                  ds.create_at,

                  MAX(
                    CASE

                      WHEN s.name =
                        N'Temperature'

                      THEN ds.value

                    END
                  )
                    AS temperature,

                  MAX(
                    CASE

                      WHEN s.name =
                        N'Humidity'

                      THEN ds.value

                    END
                  )
                    AS humidity,

                  MAX(
                    CASE

                      WHEN s.name =
                        N'Light'

                      THEN ds.value

                    END
                  )
                    AS light

                FROM latest_samples ls

                INNER JOIN data_sensor ds

                  ON ds.create_at =
                     ls.create_at

                INNER JOIN sensors s

                  ON s.id =
                     ds.sensor_id

                GROUP BY
                  ds.create_at

                ORDER BY
                  ds.create_at DESC;
              `)
        );


      res.json(
        result.recordset.map(
          formatSensorRecord
        )
      );

    } catch (error) {

      console.error(
        "Get sensors error:",
        error
      );


      res
        .status(500)
        .json({
          message:
            "Internal server error",
        });
    }
  }
);


/* ==========================================
   GET LATEST SENSOR

   GET /api/sensors/latest
========================================== */

router.get(
  "/latest",

  async (
    req,
    res
  ) => {

    try {

      const result =
        await withDb(
          (pool) =>

            pool
              .request()
              .query(`
                WITH latest_time AS (

                  SELECT TOP 1
                    create_at

                  FROM data_sensor

                  ORDER BY
                    create_at DESC
                )

                SELECT

                  MAX(ds.id)
                    AS id,

                  ds.create_at,

                  MAX(
                    CASE

                      WHEN s.name =
                        N'Temperature'

                      THEN ds.value

                    END
                  )
                    AS temperature,

                  MAX(
                    CASE

                      WHEN s.name =
                        N'Humidity'

                      THEN ds.value

                    END
                  )
                    AS humidity,

                  MAX(
                    CASE

                      WHEN s.name =
                        N'Light'

                      THEN ds.value

                    END
                  )
                    AS light

                FROM data_sensor ds

                INNER JOIN latest_time lt

                  ON lt.create_at =
                     ds.create_at

                INNER JOIN sensors s

                  ON s.id =
                     ds.sensor_id

                GROUP BY
                  ds.create_at;
              `)
        );


      /* ======================================
         NO DATA
      ====================================== */

      if (
        result.recordset.length ===
        0
      ) {

        return res.json({

          id:
            0,

          temperature:
            0,

          humidity:
            0,

          light:
            0,

          recordedAt:
            null,
        });
      }


      return res.json(
        formatSensorRecord(
          result.recordset[0]
        )
      );

    } catch (error) {

      console.error(
        "Get latest sensor error:",
        error
      );


      return res
        .status(500)
        .json({
          message:
            "Internal server error",
        });
    }
  }
);


module.exports =
  router;