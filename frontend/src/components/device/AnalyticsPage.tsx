import TemperatureChart from '../charts/TemperatureChart';
import PressureChart from '../charts/PressureChart';
import CurrentChart from '../charts/CurrentChart';
import { useAuth } from '../../context/AuthContext';
import { useAggregatedMotorData } from '../../hooks/useAggregatedMotorData';

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const assignedTypes = profile?.assignedDevices || null;
  const { metrics } = useAggregatedMotorData();

  // Filter metrics by assigned device types (for operators)
  let filteredMetrics = metrics;
  if (assignedTypes && Array.isArray(assignedTypes)) {
    filteredMetrics = Object.fromEntries(
      Object.entries(metrics).filter(([deviceId]) =>
        assignedTypes.some(type => deviceId.startsWith(type + '-'))
      )
    );
  }

  // Prepare chart data for each metric
  const tempData = Object.keys(filteredMetrics).map((deviceId) => ({
    name: deviceId,
    temperature: parseFloat(filteredMetrics[deviceId].avgTemp.toFixed(2)),
  }));
  const pressureData = Object.keys(filteredMetrics).map((deviceId) => ({
    name: deviceId,
    pressure: parseFloat(filteredMetrics[deviceId].avgPressure.toFixed(2)),
  }));
  const currentData = Object.keys(filteredMetrics).map((deviceId) => ({
    name: deviceId,
    current: parseFloat(filteredMetrics[deviceId].avgCurrent.toFixed(2)),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-1 xl:grid-cols-1">
      <div className="bg-white  shadow rounded-lg">
        <div className="p-5">
            <p className='text-base pb-5'>X-Axis: Device ID, Y-Axis: Temperature (°C) </p>
          <TemperatureChart data={tempData} dataKey="temperature" />
        </div>
      </div>
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
            <p className='text-base pb-5'>X-Axis: Device ID, Y-Axis: Pressure (hPa) </p>
          <PressureChart data={pressureData} dataKey="pressure" />
        </div>
      </div>
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
            <p className='text-base pb-5'>X-Axis: Device ID, Y-Axis: Current (A) </p>
          <CurrentChart data={currentData} dataKey="current" />
        </div>
      </div>
    </div>
  );
}
