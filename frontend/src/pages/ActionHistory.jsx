import "../styles/actions.css";

import {
  CalendarDays,
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
  getActions,
} from "../api/actionApi";


/* ==========================================
   FORMAT DATE TIME
========================================== */

function formatDateTime(
  value
) {
  if (
    !value
  ) {
    return "";
  }


  const date =
    new Date(
      value
    );


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


/* ==========================================
   COPY TEXT
========================================== */

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


/* ==========================================
   PAGINATION NUMBERS
========================================== */

function getPageNumbers(
  currentPage,
  totalPages
) {

  if (
    totalPages <= 7
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
    currentPage <= 4
  ) {

    return [
      1,
      2,
      3,
      4,
      5,
      "...",
      totalPages,
    ];
  }


  if (
    currentPage >=
    totalPages - 3
  ) {

    return [
      1,
      "...",
      totalPages - 4,
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


function ActionHistory() {

  const [
    actions,
    setActions,
  ] =
    useState([]);


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    deviceFilter,
    setDeviceFilter,
  ] =
    useState("All");


  const [
    actionFilter,
    setActionFilter,
  ] =
    useState("All");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("All");


  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1);


  const [
    pageSize,
    setPageSize,
  ] =
    useState(20);


  const [
    copiedCell,
    setCopiedCell,
  ] =
    useState(null);


  /* ==========================================
     COPY TIME
  ========================================== */

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


      setCopiedCell(
        cellKey
      );


      setTimeout(
        () => {

          setCopiedCell(
            (
              current
            ) =>
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


  /* ==========================================
     LOAD ACTIONS
  ========================================== */

  useEffect(
    () => {

      let mounted =
        true;


      async function loadActions() {

        try {

          const data =
            await getActions();


          if (
            mounted
          ) {

            setActions(
              Array.isArray(
                data
              )
                ? data
                : []
            );
          }

        } catch (error) {

          console.error(
            "Load actions error:",
            error
          );
        }
      }


      loadActions();


      const interval =
        setInterval(
          loadActions,
          1000
        );


      return () => {

        mounted =
          false;


        clearInterval(
          interval
        );
      };

    },
    []
  );


  /* ==========================================
     DEVICE OPTIONS
  ========================================== */

  const deviceOptions =
    useMemo(
      () => {

        const devices =
          actions
            .map(
              (
                item
              ) =>
                item.device
            )
            .filter(
              Boolean
            );


        return [
          ...new Set(
            devices
          ),
        ];
      },

      [
        actions,
      ]
    );


  /* ==========================================
     FILTER DATA
  ========================================== */

  const filteredActions =
    useMemo(
      () => {

        const keyword =
          search
            .trim()
            .toLowerCase();


        return actions.filter(
          (
            item
          ) => {

            const formattedTime =
              formatDateTime(
                item.time
              ).toLowerCase();


            const user =
              String(
                item.user ||
                ""
              ).toLowerCase();


            const device =
              String(
                item.device ||
                ""
              ).toLowerCase();


            const action =
              String(
                item.action ||
                ""
              ).toUpperCase();


            const status =
              String(
                item.status ||
                ""
              ).toLowerCase();


            /* SEARCH */

            const matchSearch =
              !keyword ||

              formattedTime.includes(
                keyword
              ) ||

              user.includes(
                keyword
              ) ||

              device.includes(
                keyword
              ) ||

              action
                .toLowerCase()
                .includes(
                  keyword
                ) ||

              status.includes(
                keyword
              );


            /* DEVICE */

            const matchDevice =
              deviceFilter ===
                "All" ||

              item.device ===
                deviceFilter;


            /* ACTION */

            const matchAction =
              actionFilter ===
                "All" ||

              action ===
                actionFilter;


            /* STATUS */

            const matchStatus =
              statusFilter ===
                "All" ||

              String(
                item.status ||
                ""
              ).toLowerCase() ===
                statusFilter.toLowerCase();


            return (
              matchSearch &&
              matchDevice &&
              matchAction &&
              matchStatus
            );
          }
        );
      },

      [
        actions,
        search,
        deviceFilter,
        actionFilter,
        statusFilter,
      ]
    );


  /* ==========================================
     PAGINATION
  ========================================== */

  const totalRecords =
    filteredActions.length;


  const totalPages =
    Math.max(
      1,

      Math.ceil(
        totalRecords /
        pageSize
      )
    );


  useEffect(
    () => {

      setCurrentPage(
        1
      );

    },
    [
      search,
      deviceFilter,
      actionFilter,
      statusFilter,
      pageSize,
    ]
  );


  useEffect(
    () => {

      if (
        currentPage >
        totalPages
      ) {

        setCurrentPage(
          totalPages
        );
      }

    },
    [
      currentPage,
      totalPages,
    ]
  );


  const startIndex =
    (
      currentPage - 1
    ) *
    pageSize;


  const pageRows =
    filteredActions.slice(
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


  const pageNumbers =
    getPageNumbers(
      currentPage,
      totalPages
    );


  /* ==========================================
     CLEAR
  ========================================== */

  function handleClear() {

    setSearch(
      ""
    );


    setDeviceFilter(
      "All"
    );


    setActionFilter(
      "All"
    );


    setStatusFilter(
      "All"
    );


    setCurrentPage(
      1
    );
  }


  return (

    <div className="page-shell actions-page">

      {/* PAGE TITLE */}

      <h1 className="page-title">
        Action History
      </h1>


      {/* FILTER BAR */}

      <div className="filter-bar">

        <div className="search-box">

          <Search
            size={20}
          />


          <input
            type="text"

            value={
              search
            }

            placeholder=
              "Search data..."

            onChange={
              (
                event
              ) =>
                setSearch(
                  event.target.value
                )
            }
          />

        </div>


        <select
          value={
            deviceFilter
          }

          onChange={
            (
              event
            ) =>
              setDeviceFilter(
                event.target.value
              )
          }
        >

          <option value="All">
            All Devices
          </option>


          {deviceOptions.map(
            (
              device
            ) => (

              <option
                key={
                  device
                }

                value={
                  device
                }
              >
                {device}
              </option>

            )
          )}

        </select>


        <select
          value={
            actionFilter
          }

          onChange={
            (
              event
            ) =>
              setActionFilter(
                event.target.value
              )
          }
        >

          <option value="All">
            All Actions
          </option>

          <option value="ON">
            ON
          </option>

          <option value="OFF">
            OFF
          </option>

        </select>


        <select
          value={
            statusFilter
          }

          onChange={
            (
              event
            ) =>
              setStatusFilter(
                event.target.value
              )
          }
        >

          <option value="All">
            All Statuses
          </option>

          <option value="Success">
            Success
          </option>

          <option value="Error">
            Error
          </option>

          <option value="Loading">
            Loading
          </option>

        </select>


        <button
          type="button"

          className=
            "clear-button"

          onClick={
            handleClear
          }
        >

          <RotateCcw
            size={18}
          />

          <span>
            Clear all
          </span>

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
                  User
                </th>

                <th>
                  Device
                </th>

                <th>
                  Action
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              {pageRows.length ===
              0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="empty-table"
                  >
                    No action history found.
                  </td>

                </tr>

              ) : (

                pageRows.map(
                  (
                    item,
                    index
                  ) => {

                    const actionValue =
                      String(
                        item.action ||
                        ""
                      ).toUpperCase();


                    const statusValue =
                      String(
                        item.status ||
                        ""
                      );


                    const cellKey =
                      `action-time-${
                        item.id ??
                        `${item.time}-${index}`
                      }`;


                    const isCopied =
                      copiedCell ===
                      cellKey;


                    return (

                      <tr
                        key={
                          item.id ||
                          `${item.time}-${index}`
                        }
                      >

                        <td className="action-id">
                          #
                          {
                            item.id
                          }
                        </td>


                        {/* TIME - CLICK TO COPY */}

                        <td
                          className=
                            "copy-time-cell"

                          role=
                            "button"

                          tabIndex={0}

                          title=
                            "Click to copy time"

                          onClick={
                            () =>
                              handleCopyTime(
                                item.time,
                                cellKey
                              )
                          }

                          onKeyDown={
                            (
                              event
                            ) => {

                              if (
                                event.key ===
                                  "Enter" ||

                                event.key ===
                                  " "
                              ) {

                                event.preventDefault();


                                handleCopyTime(
                                  item.time,
                                  cellKey
                                );
                              }
                            }
                          }
                        >

                          <div className="action-time">

                            <CalendarDays
                              size={16}
                            />


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
                          {item.user}
                        </td>


                        <td>

                          <span className="device-badge">
                            {
                              item.device
                            }
                          </span>

                        </td>


                        {/* ACTION */}

                        <td>

                          <span
                            className={
                              actionValue ===
                              "ON"
                                ? "action-badge action-on"
                                : "action-badge action-off"
                            }
                          >
                            {
                              actionValue
                            }
                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={
                              statusValue
                                .toLowerCase() ===
                              "success"
                                ? "status-badge status-success"

                                : statusValue
                                    .toLowerCase() ===
                                  "loading"
                                  ? "status-badge status-loading"

                                  : "status-badge status-error"
                            }
                          >
                            {
                              statusValue
                            }
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>


        {/* FOOTER */}

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

              className=
                "pagination-arrow"

              disabled={
                currentPage ===
                1
              }

              onClick={
                () =>
                  setCurrentPage(
                    (
                      previous
                    ) =>
                      Math.max(
                        1,
                        previous - 1
                      )
                  )
              }
            >

              <ChevronLeft
                size={18}
              />

            </button>


            {pageNumbers.map(
              (
                page,
                index
              ) => {

                if (
                  page ===
                  "..."
                ) {

                  return (

                    <span
                      key={
                        `dots-${index}`
                      }

                      className=
                        "pagination-dots"
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

                    onClick={
                      () =>
                        setCurrentPage(
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

              className=
                "pagination-arrow"

              disabled={
                currentPage ===
                totalPages
              }

              onClick={
                () =>
                  setCurrentPage(
                    (
                      previous
                    ) =>
                      Math.min(
                        totalPages,
                        previous + 1
                      )
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


export default ActionHistory;