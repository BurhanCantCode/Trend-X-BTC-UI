import { useState, useEffect } from 'react';

interface BinanceTickerProps {
  showFullPrice?: boolean;
}

export const BinanceTicker: React.FC<BinanceTickerProps> = ({ showFullPrice = false }) => {
  const [tickerData, setTickerData] = useState<{
    price: string;
    priceChange: string;
    priceChangePercent: string;
  } | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      // Initial price fetch
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
        .then(response => response.json())
        .then(data => {
          if (data.price) {
            setTickerData(prev => ({
              ...prev,
              price: data.price,
              priceChange: '0',
              priceChangePercent: '0'
            }));
          }
        })
        .catch(err => console.error('Failed to fetch initial price:', err));

      // WebSocket connection for real-time updates
      try {
        ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setTickerData({
            price: data.c, // Current price
            priceChange: data.p, // Price change
            priceChangePercent: data.P, // Price change percent
          });
          reconnectAttempts = 0; // Reset on successful message
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          // Attempt reconnection with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++;
              connect();
            }, delay);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  if (!tickerData) return <div>Loading...</div>;

  const isPositive = parseFloat(tickerData.priceChange) >= 0;

  return (
    <div className="flex flex-col">
      {showFullPrice && (
        <span className="text-2xl font-bold text-white">
          ${parseFloat(tickerData.price).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      )}
      <span className={`${isPositive ? 'text-[#4CD964]' : 'text-[#FF3B30]'} text-sm font-medium mt-1`}>
        ${Math.abs(parseFloat(tickerData.priceChange)).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} 
        ({isPositive ? '+' : '-'}{Math.abs(parseFloat(tickerData.priceChangePercent))}%)
      </span>
    </div>
  );
}; 