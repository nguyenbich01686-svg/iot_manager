import "../styles/profile.css";

import {
  Boxes,
  Code2,
  FileText,
  Mail,
  Folder,
  PenTool,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  getMe,
} from "../api/userApi";

import {
  useAuth,
} from "../context/AuthContext";

function Profile() {
  /*
    user trong AuthContext đã có
    ngay sau khi đăng nhập.
  */
  const {
    user: authUser,
  } = useAuth();

  /*
    Hiển thị authUser ngay lập tức,
    không cần chờ GET /users/me.
  */
  const [
    profileUser,
    setProfileUser,
  ] = useState(
    authUser
  );

  /*
    Sau đó gọi Backend ngầm để
    đồng bộ thông tin mới nhất.
  */
  useEffect(() => {
    async function loadProfile() {
      try {
        const data =
          await getMe();

        setProfileUser(
          data
        );
      } catch (error) {
        /*
          Nếu Backend lỗi tạm thời,
          vẫn giữ user đã đăng nhập
          nên trang không trắng /
          không Loading.
        */
        console.error(
          "Load profile error:",
          error
        );
      }
    }

    loadProfile();
  }, []);

  function handleResourceClick(resourceName) {
  const links = {
    "System Documentation":
      "https://1drv.ms/w/c/2e1b0403df770e20/IQAJNO_E3YO4R5Al8lHhfkrjAQPZ0G0j5HBz6jZMJaAP_uw?e=Zbe480",

    "API Reference":
      "https://lunar-desert-4409451.postman.co/workspace/Personal-Workspace~a65beafb-5a0c-460c-9fcb-1c14e20b4084/request/53649443-fbd40dd0-792e-479b-9f53-d4fc774013f8?action=share&creator=53649443",

    "GitHub Repository":
      "https://github.com/nguyenbich01686-svg/iot_manager.git",

    "Figma Design":
      "https://www.figma.com/design/JVBqFmLXqFFDWLUMo2JTNB/IOT?node-id=0-1&t=idKaVrkh7Bl5UluM-1",
  };

  const url =
    links[resourceName];

  if (url) {
    window.open(
      url,
      "_blank"
    );
  }
}

  /*
    Trường hợp : user chưa tồn tại.
  */
  if (!profileUser) {
    return (
      <div className="page-shell profile-page">

        <h1 className="page-title">
          Profile
        </h1>

      </div>
    );
  }

  return (
    <div className="page-shell profile-page">

      {/* =========================
          PAGE TITLE
      ========================= */}

      <h1 className="page-title">
        Profile
      </h1>

      {/* =========================
          PROFILE INFORMATION
      ========================= */}

      <section className="profile-main-card">

        <div className="profile-avatar">
          NTB
        </div>

        <div className="profile-information">

          <h2>
            {profileUser.fullName}
          </h2>

          <h3>
            {profileUser.role}
          </h3>

          <div className="profile-contact-list">

            <div className="profile-contact">

              <UserRound
                size={18}
              />

              <span>
                {profileUser.studentId}
              </span>

            </div>

            <div className="profile-contact">

              <Mail
                size={18}
              />

              <span>
                {profileUser.email}
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          DOCUMENTATION TITLE
      ========================= */}

      <div className="profile-resource-title">

        <Folder
          size={21}
        />

        <h2>
          Documentation & Resources
        </h2>

      </div>

      {/* =========================
          RESOURCE BUTTONS
      ========================= */}

      <div className="profile-resource-grid">

        <ResourceButton
          icon={
            <FileText />
          }
          title="System Documentation"
          description="Complete guide for Smart Room IoT system"
          tag="PDF"
          onClick={() =>
            handleResourceClick(
              "System Documentation"
            )
          }
        />

        <ResourceButton
          icon={
            <Boxes />
          }
          title="API Reference"
          description="REST API endpoints and integration guide"
          tag="API"
          onClick={() =>
            handleResourceClick(
              "API Reference"
            )
          }
        />

        <ResourceButton
          icon={
            <Code2 />
          }
          title="GitHub Repository"
          description="Source code and project files"
          tag="CODE"
          onClick={() =>
            handleResourceClick(
              "GitHub Repository"
            )
          }
        />

        <ResourceButton
          icon={
            <PenTool />
          }
          title="Figma Design"
          description="UI/UX design files and components"
          tag="DESIGN"
          onClick={() =>
            handleResourceClick(
              "Figma Design"
            )
          }
        />

      </div>

    </div>
  );
}


/* =========================
   RESOURCE BUTTON
========================= */

function ResourceButton({
  icon,
  title,
  description,
  tag,
  onClick,
}) {
  return (
    <button
      type="button"
      className="profile-resource-card"
      onClick={onClick}
    >

      <div className="profile-resource-icon">
        {icon}
      </div>

      <div className="profile-resource-content">

        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>

      </div>

      <span className="profile-resource-tag">
        {tag}
      </span>

    </button>
  );
}

export default Profile;
