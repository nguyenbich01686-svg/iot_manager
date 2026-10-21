import "../styles/sensors.css";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  Search,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSensors,
} from "../api/sensorApi";


function DataSensors() {
  const [
    data,
    setData,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("All");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    copiedCell,
    setCopiedCell,
  ] = useState(null);

  const pageSize = 20;


  // =========================
  // FORMAT DATE TIME
  // dd/MM/yyyy HH:mm:ss
  // =========================

  function formatDateTime(
    value
  ) {
    const date =
      new Date(value);

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const year =
      date.getFullYear();

    const hours =
      String(
        date.getHours()
      ).padStart(
        2,
        "0"
      );

    const minutes =
      String(
        date.getMinutes()
      ).padStart(
        2,
        "0"
      );

    const seconds =
      String(
        date.getSeconds()
      ).padStart(
        2,
        "0"
      );

    return (
      `${day}/${month}/${year} ` +
      `${hours}:${minutes}:${seconds}`
    );
  }


  // =========================
  // COPY TEXT
  // =========================

  async function copyText(
    text
  ) {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        text
      );

      return;
    }


    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      text;

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    textarea.style.pointerEvents =
      "none";

    document.body.appendChild(
      textarea
    );

    textarea.focus();

    textarea.select();

    document.execCommand(
      "copy"
    );

    document.body.removeChild(
      textarea
    );
  }


  // =========================
  // COPY TIME
  // =========================

  async function handleCopyTime(
    value,
    cellKey
  ) {
    try {
      const formattedTime =
        formatDateTime(
          value
        );

      await copyText(
        formattedTime
      );


      // Hiện dấu tích
      setCopiedCell(
        cellKey
      );


      // Sau 1 giây trở lại icon copy
      setTimeout(
        () => {
          setCopiedCell(
            (current) =>
              current ===
              cellKey
                ? null
                : current
          );
        },
        1000
      );

    } catch (error) {
      console.error(
        "Copy time error:",
        error
      );
    }
  }


  // =========================
  // LOAD DATA
  // =========================

  async function loadData() {
    try {
      const result =
        await getSensors();

      setData(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (error) {
      console.error(
        "Load sensors error:",
        error
      );
    }
  }


  useEffect(() => {
    loadData();

    const timer =
      setInterval(
        loadData,
        2000
      );

    return () =>
      clearInterval(
        timer
      );
  }, []);


  // =========================
  // CONVERT SENSOR RECORD
  // =========================

  const rows =
    useMemo(() => {
      return data.flatMap(
        (item) => [
          {
            key:
              `${item.id}-light`,

            time:
              item.recordedAt,

            type:
              "Light",

            value:
              item.light,

            unit:
              "lux",
          },

          {
            key:
              `${item.id}-humidity`,

            time:
              item.recordedAt,

            type:
              "Humidity",

            value:
              item.humidity,

            unit:
              "%",
          },

          {
            key:
              `${item.id}-temperature`,

            time:
              item.recordedAt,

            type:
              "Temperature",

            value:
              item.temperature,

            unit:
              "°C",
          },
        ]
      );
    }, [data]);


  // =========================
  // FILTER + SEARCH
  // =========================

  const filteredRows =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();


      if (
        keyword === ""
      ) {
        return rows;
      }


      return rows.filter(
        (item) => {

          // TEMPERATURE

          if (
            filter ===
            "Temperature"
          ) {
            return (
              item.type ===
                "Temperature" &&

              String(
                item.value
              )
                .toLowerCase()
                .includes(
                  keyword
                )
            );
          }


          // HUMIDITY

          if (
            filter ===
            "Humidity"
          ) {
            return (
              item.type ===
                "Humidity" &&

              String(
                item.value
              )
                .toLowerCase()
                .includes(
                  keyword
                )
            );
          }


          // LIGHT

          if (
            filter ===
            "Light"
          ) {
            return (
              item.type ===
                "Light" &&

              String(
                item.value
              )
                .toLowerCase()
                .includes(
                  keyword
                )
            );
          }


          // TIME

          if (
            filter ===
            "Time"
          ) {
            const formattedTime =
              formatDateTime(
                item.time
              )
                .toLowerCase();

            return formattedTime
              .includes(
                keyword
              );
          }


          // ALL

          const formattedTime =
            formatDateTime(
              item.time
            )
              .toLowerCase();

          const type =
            item.type
              .toLowerCase();

          const value =
            String(
              item.value
            )
              .toLowerCase();

          return (
            type.includes(
              keyword
            ) ||

            value.includes(
              keyword
            ) ||

            formattedTime.includes(
              keyword
            )
          );
        }
      );
    }, [
      rows,
      search,
      filter,
    ]);


  // =========================
  // RESET PAGE
  // =========================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filter,
  ]);


  // =========================
  // SEARCH PLACEHOLDER
  // =========================

  function getPlaceholder() {
    if (
      filter ===
      "Temperature"
    ) {
      return "Enter temperature...";
    }

    if (
      filter ===
      "Humidity"
    ) {
      return "Enter humidity...";
    }

    if (
      filter ===
      "Light"
    ) {
      return "Enter light intensity...";
    }

    if (
      filter ===
      "Time"
    ) {
      return "Enter date & time...";
    }

    return "Search data...";
  }


  // =========================
  // PAGINATION
  // =========================

  const totalRecords =
    filteredRows.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalRecords /
          pageSize
      )
    );


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);


  const startIndex =
    (
      currentPage - 1
    ) * pageSize;


  const pageRows =
    filteredRows.slice(
      startIndex,
      startIndex +
        pageSize
    );


  const showingFrom =
    totalRecords === 0
      ? 0
      : startIndex + 1;


  const showingTo =
    Math.min(
      startIndex +
        pageRows.length,
      totalRecords
    );


  // =========================
  // GO TO PAGE
  // =========================

  function goToPage(
    page
  ) {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(
      page
    );
  }


  // =========================
  // PAGE NUMBERS
  // =========================

  function getPageNumbers() {
    if (
      totalPages <= 5
    ) {
      return Array.from(
        {
          length:
            totalPages,
        },
        (
          _,
          index
        ) =>
          index + 1
      );
    }


    if (
      currentPage <= 3
    ) {
      return [
        1,
        2,
        3,
        4,
        "...",
        totalPages,
      ];
    }


    if (
      currentPage >=
      totalPages - 2
    ) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }


    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }


  return (
    <div className="page-shell sensors-page">

      {/* PAGE TITLE */}

      <h1 className="page-title">
        Data Sensors
      </h1>


      {/* FILTER BAR */}

      <div className="filter-bar">

        <select
          value={
            filter
          }

          onChange={(e) => {

            setFilter(
              e.target.value
            );

            setSearch("");

            setCurrentPage(
              1
            );
          }}
        >

          <option value="All">
            All Sensors
          </option>

          <option value="Temperature">
            Temperature
          </option>

          <option value="Humidity">
            Humidity
          </option>

          <option value="Light">
            Light
          </option>

          <option value="Time">
            Time
          </option>

        </select>


        {/* SEARCH */}

        <div className="search-box">

          <Search
            size={18}
          />

          <input
            type="text"

            value={
              search
            }

            placeholder={
              getPlaceholder()
            }

            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>


        {/* CLEAR */}

        <button
          type="button"

          className="clear-button"

          onClick={() => {

            setSearch("");

            setFilter(
              "All"
            );

            setCurrentPage(
              1
            );
          }}
        >

          <RotateCcw
            size={18}
          />

          Clear all

        </button>

      </div>


      {/* TABLE */}

      <div className="table-card fixed-table-card">

        <div className="table-scroll">

          <table>

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Time
                </th>

                <th>
                  Sensor Type
                </th>

                <th>
                  Value
                </th>

              </tr>

            </thead>


            <tbody>

              {pageRows.map(
                (
                  item,
                  index
                ) => {

                  const globalIndex =
                    startIndex +
                    index;

                  const displayId =
                    totalRecords -
                    globalIndex;

                  const isCopied =
                    copiedCell ===
                    item.key;


                  return (
                    <tr
                      key={
                        item.key
                      }
                    >

                      <td>
                        #
                        {
                          displayId
                        }
                      </td>


                      {/* TIME - CLICK TO COPY */}

                      <td
                        className="copy-time-cell"

                        role="button"

                        tabIndex={0}

                        title="Click to copy time"

                        onClick={() =>
                          handleCopyTime(
                            item.time,
                            item.key
                          )
                        }

                        onKeyDown={(event) => {

                          if (
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          ) {

                            event.preventDefault();

                            handleCopyTime(
                              item.time,
                              item.key
                            );
                          }
                        }}
                      >

                        <div className="copy-time-content">

                          <span>
                            {formatDateTime(
                              item.time
                            )}
                          </span>


                          <span className="copy-time-icon">

                            {
                              isCopied
                                ? (
                                  <Check
                                    size={14}
                                  />
                                )
                                : (
                                  <Copy
                                    size={14}
                                  />
                                )
                            }

                          </span>

                        </div>

                      </td>


                      <td>

                        <span className="type-badge">
                          {
                            item.type
                          }
                        </span>

                      </td>


                      <td>

                        <strong>
                          {
                            item.value
                          }
                        </strong>

                        <span className="unit-text">
                          {" "}
                          {
                            item.unit
                          }
                        </span>

                      </td>

                    </tr>
                  );
                }
              )}


              {pageRows.length ===
                0 && (

                <tr>

                  <td
                    colSpan={4}
                    className="empty-table"
                  >
                    No sensor data
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* TABLE FOOTER */}

        <div className="table-footer">

          <div className="table-footer-left">

            <span>

              Showing{" "}

              <strong>
                {showingFrom}
              </strong>

              {" - "}

              <strong>
                {showingTo}
              </strong>

              {" of "}

              <strong>
                {totalRecords}
              </strong>

            </span>

          </div>


          <div className="pagination">

            <button
              type="button"

              className="pagination-arrow"

              disabled={
                currentPage === 1
              }

              onClick={() =>
                goToPage(
                  currentPage - 1
                )
              }
            >

              <ChevronLeft
                size={18}
              />

            </button>


            {getPageNumbers().map(
              (
                page,
                index
              ) => {

                if (
                  page === "..."
                ) {
                  return (
                    <span
                      key={
                        `dots-${index}`
                      }

                      className="pagination-dots"
                    >
                      ...
                    </span>
                  );
                }


                return (
                  <button
                    type="button"

                    key={
                      page
                    }

                    className={
                      currentPage ===
                      page
                        ? "page-button active-page"
                        : "page-button"
                    }

                    onClick={() =>
                      goToPage(
                        page
                      )
                    }
                  >
                    {page}
                  </button>
                );
              }
            )}


            <button
              type="button"

              className="pagination-arrow"

              disabled={
                currentPage ===
                totalPages
              }

              onClick={() =>
                goToPage(
                  currentPage + 1
                )
              }
            >

              <ChevronRight
                size={18}
              />

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


export default DataSensors;