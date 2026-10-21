import {
  createContext,
  useContext,
  useState,
} from "react";

import {
  loginApi,
} from "../api/authApi";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(() => {
    const saved =
      localStorage.getItem(
        "iot_user"
      );

    return saved
      ? JSON.parse(saved)
      : null;
  });

  async function login(
    studentId,
    password
  ) {
    const data =
      await loginApi(
        studentId,
        password
      );

    localStorage.setItem(
      "iot_token",
      data.token
    );

    localStorage.setItem(
      "iot_user",
      JSON.stringify(
        data.user
      )
    );

    setUser(
      data.user
    );

    return data.user;
  }

  function logout() {
    localStorage.removeItem(
      "iot_token"
    );

    localStorage.removeItem(
      "iot_user"
    );

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext
  );
}