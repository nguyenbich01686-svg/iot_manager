import "../styles/login.css";
import {
  useState,
} from "react";

import {
  LockKeyhole,
  UserRound,
  Wifi,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

function Login() {
  const [
    studentId,
    setStudentId,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const {
    login,
  } = useAuth();

  const navigate =
    useNavigate();

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(
        studentId,
        password
      );

      navigate("/");
    } catch (error) {
      setError(
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          <Wifi size={30} />
        </div>

        <h1>
          IOT Manager
        </h1>

        <p>
          Sign in to your account
        </p>

        <form
          onSubmit={
            handleSubmit
          }
        >

          <label>
            Student ID
          </label>

          <div className="login-input">

            <UserRound
              size={19}
            />

            <input
              value={studentId}
              placeholder="Enter student ID"
              onChange={(e) =>
                setStudentId(
                  e.target.value
                )
              }
            />

          </div>

          <label>
            Password
          </label>

          <div className="login-input">

            <LockKeyhole
              size={19}
            />

            <input
              type="password"
              value={password}
              placeholder="Enter password"
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>

        {/* <div className="demo-account">
          Demo: B23DCCN081 / 123456
        </div> */}

      </div>

    </div>
  );
}

export default Login;