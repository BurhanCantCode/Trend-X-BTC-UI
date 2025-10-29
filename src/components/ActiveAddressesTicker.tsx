import React, { useState, useEffect, useRef } from 'react';

interface AddressState {
  count: number;
  change24h: number;
  trendPercentage: number;
}

const initialState: AddressState = {
  count: 0,
  change24h: 0,
  trendPercentage: 25
};

interface ActiveAddressesProps {
  onDataUpdate?: (data: { trend: number; isPositive: boolean }) => void;
}

export const ActiveAddressesTicker = React.memo(function ActiveAddressesTicker({ onDataUpdate }: ActiveAddressesProps) {
  const [addressData, setAddressData] = useState<AddressState>(initialState);
  const onDataUpdateRef = useRef(onDataUpdate);

  // Keep ref updated with latest callback
  useEffect(() => {
    onDataUpdateRef.current = onDataUpdate;
  }, [onDataUpdate]);

  useEffect(() => {
    const fetchAddressData = async () => {
      try {
        const response = await fetch('https://api.blockchain.info/charts/n-unique-addresses?timespan=2days&format=json&cors=true');
        const data = await response.json();
        
        if (data.values && data.values.length >= 2) {
          const latest = data.values[data.values.length - 1];
          const previous = data.values[data.values.length - 2];
          const change = ((latest.y - previous.y) / previous.y) * 100;
          
          const trendPercentage = Math.min(
            Math.max(Math.abs(change) + 25, 25),
            95
          );

          const newData = {
            count: latest.y,
            change24h: change,
            trendPercentage
          };

          setAddressData(newData);
          onDataUpdateRef.current?.({
            trend: trendPercentage,
            isPositive: change >= 0
          });
        }
      } catch (error) {
        console.error('Error fetching active addresses:', error);
      }
    };

    fetchAddressData();
    const interval = setInterval(fetchAddressData, 300000);

    return () => clearInterval(interval);
  }, []); // Empty deps - callback accessed via ref

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const isPositive = addressData.change24h >= 0;

  return (
    <div className="flex items-center text-sm">
      <span className={`${isPositive ? 'text-[#4CD964]' : 'text-[#FF3B30]'} font-medium`}>
        {formatNumber(addressData.count)}
        <span className="ml-2">
          ({isPositive ? '+' : ''}{addressData.change24h.toFixed(2)}%)
        </span>
      </span>
    </div>
  );
}); 