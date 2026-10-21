const API_BASE_URL =
  import.meta.env
    .VITE_API_BASE_URL;

export async function apiRequest(
  endpoint,
  options = {}
) {
  const token =
    localStorage.getItem(
      "iot_token"
    );

  const headers = {
    "Content-Type":
      "application/json",

    ...options.headers,
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      "API request failed"
    );
  }

  return data;
}