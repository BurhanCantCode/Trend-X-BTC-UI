import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { memo } from 'react';

interface BitcoinChartProps {
  data: {
    time?: string;
    price?: number;
    timestamp?: number;
    x?: string | number;
    y?: number;
  }[] | null;
}

export const BitcoinChart = memo(function BitcoinChart({ data }: BitcoinChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  // Transform the data to the correct format
  const formattedData = data.map(item => {
    // Handle both data formats (time/price/timestamp and x/y)
    const timestamp = item.timestamp || (typeof item.x === 'string' ? new Date(item.x).getTime() : item.x);
    const price = item.price || item.y;

    if (!timestamp || !price) {
      console.warn('Missing required data:', item);
      return null;
    }

    return {
      x: timestamp,
      y: price
    };
  })
  .filter(Boolean)
  .sort((a, b) => (a?.x || 0) - (b?.x || 0));

  if (formattedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Invalid data format
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={formattedData}
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
        <XAxis
          dataKey="x"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={(timestamp) => {
            return new Date(timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });
          }}
          stroke="#666"
          tick={{ fill: '#666' }}
          fontSize={12}
        />
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          stroke="#666"
          tick={{ fill: '#666' }}
          fontSize={12}
          width={80}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '12px'
          }}
          labelFormatter={(timestamp) => {
            return new Date(timestamp).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
        />
        <Line
          type="monotone"
          dataKey="y"
          stroke="#F7931A"
          strokeWidth={2}
          dot={{ fill: '#F7931A', stroke: '#F7931A', strokeWidth: 1, r: 3 }}
          activeDot={{ r: 6, fill: '#F7931A', stroke: '#fff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
