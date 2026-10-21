/* ==========================================
   AUTH MIDDLEWARE
========================================== */

function authMiddleware(
  req,
  res,
  next
) {

  const authorization =
    req.headers.authorization;


  /* ======================================
     CHECK TOKEN
  ====================================== */

  if (
    authorization !==
    "Bearer mock-iot-token"
  ) {

    return res
      .status(401)
      .json({
        message:
          "Unauthorized",
      });
  }


  /*
    Hiện project chỉ có 1 user.

    Login vẫn kiểm tra SQL thật.

    Middleware không query SQL lại
    mỗi request để tránh tạo query
    thừa khi Dashboard load.
  */

  req.user = {

    id:
      1,

    fullName:
      "Nguyễn Thị Bích",

    studentId:
      "B23DCCN081",

    email:
      "BichNT.B23CN081@stu.ptit.edu.vn",

    role:
      "IoT Developer",
  };


  next();
}


module.exports =
  authMiddleware;