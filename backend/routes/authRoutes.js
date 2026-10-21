const express =
  require("express");


const router =
  express.Router();


const {
  sql,
  withDb,
} =
  require("../config/db");


/* ==========================================
   LOGIN
========================================== */

router.post(
  "/login",

  async (
    req,
    res
  ) => {

    try {

      const {
        studentId,
        password,
      } =
        req.body;


      /* ======================================
         VALIDATE
      ====================================== */

      if (
        !studentId ||
        !password
      ) {

        return res
          .status(400)
          .json({
            message:
              "Student ID and password are required",
          });
      }


      /* ======================================
         FIND USER
      ====================================== */

      const result =
        await withDb(
          (pool) =>

            pool
              .request()

              .input(
                "studentId",
                sql.VarChar(20),
                studentId
              )

              .input(
                "password",
                sql.VarChar(255),
                password
              )

              .query(`
                SELECT TOP 1

                  id,
                  student_id,
                  name,
                  email,
                  role

                FROM users

                WHERE
                  student_id =
                    @studentId

                  AND password =
                    @password;
              `)
        );


      /* ======================================
         WRONG ACCOUNT
      ====================================== */

      if (
        result.recordset.length ===
        0
      ) {

        return res
          .status(401)
          .json({
            message:
              "Student ID or password is incorrect",
          });
      }


      /* ======================================
         RESPONSE
      ====================================== */

      const user =
        result.recordset[0];


      return res.json({

        token:
          "mock-iot-token",

        user: {

          id:
            user.id,

          fullName:
            user.name,

          studentId:
            user.student_id,

          email:
            user.email,

          role:
            user.role,
        },
      });

    } catch (error) {

      console.error(
        "Login error:",
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