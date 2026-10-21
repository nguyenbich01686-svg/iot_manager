const express =
  require("express");


const router =
  express.Router();


const {
  withDb,
} =
  require("../config/db");


/* ==========================================
   GET ACTION HISTORY
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
                SELECT

                  a.id,
                  a.action,
                  a.status,
                  a.create_at,

                  u.name
                    AS user_name,

                  d.name
                    AS device_name,

                  d.code
                    AS device_code

                FROM actions a

                INNER JOIN users u
                  ON a.user_id =
                     u.id

                INNER JOIN devices d
                  ON a.device_id =
                     d.id

                ORDER BY
                  a.id DESC;
              `)
        );


      const actions =
        result.recordset.map(
          (item) => ({

            id:
              Number(
                item.id
              ),

            time:
              item.create_at,

            user:
              item.user_name,

            device:
              item.device_name,

            deviceCode:
              item.device_code,

            action:
              item.action,

            status:
              item.status,
          })
        );


      res.json(
        actions
      );

    } catch (error) {

      console.error(
        "Get actions error:",
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


module.exports =
  router;