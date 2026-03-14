import { useAuth } from '../../context/AuthContext';
import React, { useState } from 'react';
import { useRealtimeMotorData } from '../../hooks/useRealtimeMotorData';
import MotorControl from './MotorControl';
import { Link } from 'react-router-dom';
import { useExcludedDevices } from '../../context/ExcludedDevicesContext';

const DEVICE_TYPES = [
  { label: 'All Devices', value: 'all' },
  { label: 'Motors', value: 'motor' },
  { label: 'Pumps', value: 'pump' },
  { label: 'Generators', value: 'generator' },
  { label: 'Compressors', value: 'compressor' },
];
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '20px',
  padding: '20px',
  fontFamily: 'sans-serif',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '16px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  backgroundColor: '#ffffff',
  minWidth: '220px',
  flex: 1,
  textDecoration: 'none',
};

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: '#333',
  fontSize: '1.4rem',
  borderBottom: '1px solid #eee',
  paddingBottom: '8px',
  textTransform: 'capitalize',
};

const metricStyle: React.CSSProperties = {
  margin: '8px 0',
  fontSize: '1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const getMetricStyle = (value: number, type: 'temperature' | 'pressure' | 'current'): string => {
  const baseStyle = 'rounded-full px-2.5 py-1 text-sm font-semibold';


  switch (type) {
    case 'temperature':
      if (value > 85) return `${baseStyle} bg-red-100 text-red-800`;
      if (value >= 65) return `${baseStyle} bg-amber-100 text-amber-800`;
      return `${baseStyle} bg-green-100 text-green-800`;

    case 'pressure':
      if (value > 1080) return `${baseStyle} bg-red-100 text-red-800`;
      if (value >= 1050) return `${baseStyle} bg-amber-100 text-amber-800`;
      return `${baseStyle} bg-green-100 text-green-800`;

    case 'current':
      if (value > 15) return `${baseStyle} bg-red-100 text-red-800`;
      if (value >= 10) return `${baseStyle} bg-amber-100 text-amber-800`;
      return `${baseStyle} bg-green-100 text-green-800`;

    default:

      return `${baseStyle} bg-gray-100 text-gray-800`;
  }
};

export default function Device() {
  const realtimeData = useRealtimeMotorData();
  const { excludedIds } = useExcludedDevices();
  const [selectedType, setSelectedType] = useState('all');
  const { profile } = useAuth();
  // assignedTypes: array of device type strings (e.g., ['motor', 'pump'])
  const assignedTypes = profile?.assignedDevices || null;

  if (Object.keys(realtimeData).length === 0) {
    return <div style={{ padding: '20px' }}>Loading device data...</div>;
  }

  // Filter dropdown options: always show 'All Devices', then only assigned types (for operators)
  let filteredDeviceTypes = DEVICE_TYPES;
  if (assignedTypes && Array.isArray(assignedTypes)) {
    filteredDeviceTypes = [
      DEVICE_TYPES[0], // 'All Devices'
      ...DEVICE_TYPES.filter(
        (type) => type.value !== 'all' && assignedTypes.includes(type.value)
      ),
    ];
  }

  return (
    <div>
      <div style={{ padding: '0 20px 16px 20px' }}>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '1rem',
            backgroundColor: '#fff',
            cursor: 'pointer',
            minWidth: '180px',
          }}
        >
          {filteredDeviceTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
      <div style={containerStyle}>
        {Object.entries(realtimeData)
          .filter(([deviceId]) => !excludedIds.includes(deviceId))
          .filter(([deviceId]) => selectedType === 'all' || deviceId.startsWith(selectedType + '-'))
          // Only show devices matching assigned types (for operators)
          .filter(([deviceId]) => {
            if (!assignedTypes) return true; // admin or not set: show all
            // deviceId format: type-xxx (e.g., motor-1)
            return assignedTypes.some(type => deviceId.startsWith(type + '-'));
          })
          .map(([deviceId, data]) => {
            const temperature = parseFloat(data.temperature);
            const pressure = parseFloat(data.pressure);
            const current = parseFloat(data.current);

            return (
              <div key={deviceId} style={cardStyle}>
                <h3 style={cardTitleStyle}>{deviceId}</h3>

                <p style={metricStyle}>
                  <strong>Temperature:</strong>
                  <span className={getMetricStyle(temperature, 'temperature')}>
                    {temperature.toFixed(2)} °C
                  </span>
                </p>

                <p style={metricStyle}>
                  <strong>Pressure:</strong>
                  <span className={getMetricStyle(pressure, 'pressure')}>
                    {pressure.toFixed(2)} hPa
                  </span>
                </p>

                <p style={metricStyle}>
                  <strong>Current:</strong>
                  <span className={getMetricStyle(current, 'current')}>
                    {current.toFixed(2)} A
                  </span>
                </p>

                <MotorControl />
                <Link to={`/device/${deviceId}`} style={{ textDecoration: 'none', color: 'blue', marginTop: '10px', display: 'block' }}>
                  View Analytics
                </Link>
              </div>
            );
          })}
      </div>
    </div>
  );
}