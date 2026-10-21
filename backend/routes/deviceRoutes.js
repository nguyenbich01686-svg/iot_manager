const express =
  require("express");


const router =
  express.Router();


const {
  sql,
  withDb,
} =
  require("../config/db");


const {
  sendDeviceCommand,
  isDevicePending,
} =
  require("../services/mqttService");


/* ==========================================
   GET ALL DEVICES
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

                  id,
                  code,
                  name,
                  current_status

                FROM devices

                ORDER BY
                  id ASC;
              `)
        );


      res.json(
        result.recordset.map(
          (item) => ({

            id:
              item.id,

            code:
              item.code,

            name:
              item.name,

            state:
              Boolean(
                item.current_status
              ),

            loading:
              isDevicePending(
                item.id
              ),
          })
        )
      );

    } catch (error) {

      console.error(
        "Get devices error:",
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
   GET DEVICE BY ID
========================================== */

router.get(
  "/:id",

  async (
    req,
    res
  ) => {

    try {

      const deviceId =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(
          deviceId
        )
      ) {

        return res
          .status(400)
          .json({
            message:
              "Invalid device ID",
          });
      }


      const result =
        await withDb(
          (pool) =>

            pool
              .request()

              .input(
                "deviceId",
                sql.Int,
                deviceId
              )

              .query(`
                SELECT

                  id,
                  code,
                  name,
                  current_status

                FROM devices

                WHERE id =
                  @deviceId;
              `)
        );


      if (
        result.recordset.length ===
        0
      ) {

        return res
          .status(404)
          .json({
            message:
              "Device not found",
          });
      }


      const item =
        result.recordset[0];


      res.json({

        id:
          item.id,

        code:
          item.code,

        name:
          item.name,

        state:
          Boolean(
            item.current_status
          ),

        loading:
          isDevicePending(
            item.id
          ),
      });

    } catch (error) {

      console.error(
        "Get device error:",
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
   CONTROL DEVICE
========================================== */

router.patch(
  "/:id",

  async (
    req,
    res
  ) => {

    try {

      const deviceId =
        Number(
          req.params.id
        );


      const {
        state,
      } =
        req.body;


      /* ======================================
         VALIDATE
      ====================================== */

      if (
        !Number.isInteger(
          deviceId
        )
      ) {

        return res
          .status(400)
          .json({
            message:
              "Invalid device ID",
          });
      }


      if (
        typeof state !==
        "boolean"
      ) {

        return res
          .status(400)
          .json({
            message:
              "State must be true or false",
          });
      }


      /* ======================================
         ALREADY LOADING
      ====================================== */

      if (
        isDevicePending(
          deviceId
        )
      ) {

        return res
          .status(409)
          .json({
            message:
              "Device is waiting for hardware response",
          });
      }


      /* ======================================
         FIND DEVICE
      ====================================== */

      const deviceResult =
        await withDb(
          (pool) =>

            pool
              .request()

              .input(
                "deviceId",
                sql.Int,
                deviceId
              )

              .query(`
                SELECT

                  id,
                  code,
                  name,
                  current_status

                FROM devices

                WHERE id =
                  @deviceId;
              `)
        );


      if (
        deviceResult.recordset
          .length === 0
      ) {

        return res
          .status(404)
          .json({
            message:
              "Device not found",
          });
      }


      const device =
        deviceResult.recordset[0];


      const actionValue =
        state
          ? "ON"
          : "OFF";


      /* ======================================
         CREATE LOADING ACTION
      ====================================== */

      const actionResult =
        await withDb(

          (pool) =>

            pool
              .request()

              .input(
                "deviceId",
                sql.Int,
                deviceId
              )

              .input(
                "userId",
                sql.Int,
                req.user.id
              )

              .input(
                "action",
                sql.VarChar(10),
                actionValue
              )

              .input(
                "status",
                sql.VarChar(20),
                "Loading"
              )

              .query(`
                INSERT INTO actions (
                  device_id,
                  user_id,
                  action,
                  status
                )

                OUTPUT

                  INSERTED.id,
                  INSERTED.action,
                  INSERTED.status,
                  INSERTED.create_at

                VALUES (
                  @deviceId,
                  @userId,
                  @action,
                  @status
                );
              `),

          /*
            Không retry INSERT.

            Tránh trường hợp INSERT thành công
            nhưng connection reset ngay sau đó
            rồi retry tạo action trùng.
          */

          {
            retry:
              false,
          }
        );


      const action =
        actionResult.recordset[0];


      const actionId =
        Number(
          action.id
        );


      /* ======================================
         MQTT CONTROL
      ====================================== */

      try {

        await sendDeviceCommand({

          actionId:
            actionId,

          deviceId:
            deviceId,

          deviceCode:
            device.code,

          state:
            state,
        });

      } catch (mqttError) {

        /* ==================================
           MQTT FAILED
        ================================== */

        await withDb(
          (pool) =>

            pool
              .request()

              .input(
                "actionId",
                sql.BigInt,
                actionId
              )

              .query(`
                UPDATE actions

                SET status =
                  'Error'

                WHERE id =
                  @actionId;
              `)
        );


        console.error(
          "Send MQTT command error:",
          mqttError.message
        );


        return res
          .status(503)
          .json({
            message:
              "Cannot send command to hardware",
          });
      }


      /* ======================================
         RETURN LOADING
      ====================================== */

      return res
        .status(202)
        .json({

          device: {

            id:
              device.id,

            code:
              device.code,

            name:
              device.name,

            /*
              Đây vẫn là trạng thái thật cũ.

              Chưa update SQL cho tới khi
              ESP phản hồi.
            */

            state:
              Boolean(
                device.current_status
              ),

            loading:
              true,

            requestedState:
              state,
          },


          action: {

            id:
              actionId,

            time:
              action.create_at,

            user:
              req.user.fullName,

            device:
              device.name,

            deviceCode:
              device.code,

            action:
              actionValue,

            status:
              "Loading",
          },
        });

    } catch (error) {

      console.error(
        "Control device error:",
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