function SensorCard({
  title,
  value,
  unit,
  icon,
  color,
}) {
  return (
    <div className="sensor-card">

      <div className="sensor-header">

        <span>
          {title}
        </span>

        <div
          className={
            `sensor-icon ${color}`
          }
        >
          {icon}
        </div>

      </div>

      <div className="sensor-value">
        {value}
        <small>
          {unit}
        </small>
      </div>

    </div>
  );
}

export default SensorCard;