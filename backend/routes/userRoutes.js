const express =
  require("express");


const router =
  express.Router();


/* ==========================================
   GET CURRENT USER
========================================== */

router.get(
  "/me",

  (
    req,
    res
  ) => {

    res.json(
      req.user
    );
  }
);


module.exports =
  router;