import {
  AirVent,
  Droplets,
  Lightbulb,
} from "lucide-react";


function DeviceToggle({
  device,
  onToggle,
}) {

  const icons = {

    LED1:
      <AirVent
        size={19}
      />,

    LED2:
      <Droplets
        size={19}
      />,

    LED3:
      <Lightbulb
        size={19}
      />,
  };


  /* ==========================================
     CARD CLASS
  ========================================== */

  const cardClassName = [
    "device-card",

    device.state
      ? "device-card-active"
      : "",

    device.loading
      ? "device-card-loading"
      : "",
  ]
    .filter(Boolean)
    .join(" ");


  /* ==========================================
     SWITCH CLASS
  ========================================== */

  const switchClassName = [
    "switch",

    device.state
      ? "active"
      : "",

    device.loading
      ? "loading"
      : "",
  ]
    .filter(Boolean)
    .join(" ");


  return (

    <div
      className={
        cardClassName
      }
    >

      {/* ======================================
          DEVICE INFO
      ====================================== */}

      <div
        className=
          "device-info"
      >

        <div
          className=
            "device-icon"
        >

          {
            icons[
              device.code
            ]
          }

        </div>


        <div
          className=
            "device-name-wrap"
        >

          <span
            className=
              "device-name"
          >
            {device.name}
          </span>


          {
            device.loading && (

              <span
                className=
                  "device-loading-text"
              >
                Updating...
              </span>

            )
          }

        </div>

      </div>


      {/* ======================================
          SWITCH
      ====================================== */}

      <button
        type=
          "button"

        className={
          switchClassName
        }

        disabled={
          device.loading
        }

        aria-busy={
          device.loading
        }

        aria-label={
          device.loading
            ? `${device.name} is updating`
            : `${
                device.state
                  ? "Turn off"
                  : "Turn on"
              } ${device.name}`
        }

        onClick={
          () => {

            if (
              !device.loading
            ) {

              onToggle(
                device
              );
            }
          }
        }
      >

        {/* NORMAL LABEL */}

        <span
          className=
            "switch-label"
        >

          {
            device.loading
              ? "WAIT"
              : device.state
                ? "ON"
                : "OFF"
          }

        </span>


        {/* NORMAL SWITCH KNOB */}

        <i
          className=
            "switch-knob"
        />


        {/* LOADING SPINNER */}

        {
          device.loading && (

            <span
              className=
                "switch-loader"

              aria-hidden=
                "true"
            />

          )
        }

      </button>

    </div>
  );
}


export default DeviceToggle;