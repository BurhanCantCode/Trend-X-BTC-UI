// pages/api/fetchMetrics.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '@/config/firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';
import Papa from 'papaparse';

interface BTCMetrics {
  Date: string;
  Open: number;
  High: number;
  Volume: number;
  'Number of trades': number;
  avg_block_size: number;
  value: number;
  net_order_flow: number;
  num_user_addresses: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const metricsRef = ref(storage, 'data/cleaned_data.csv');
    const downloadURL = await getDownloadURL(metricsRef);
    
    const response = await fetch(downloadURL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const parsed = Papa.parse<BTCMetrics>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      console.error('PapaParse Errors:', parsed.errors);
      throw new Error('Error parsing CSV data');
    }

    const data = parsed.data;
    if (data.length === 0) {
      throw new Error('No data found in CSV');
    }

    // Get the latest row and verify its timestamp
    const latestData = data[data.length - 1];
    const latestTimestamp = new Date(latestData.Date);
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - latestTimestamp.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    // If data is more than 1 hour old, send warning
    if (hoursDifference > 1) {
      console.warn(`Data might be stale. Latest entry is ${hoursDifference.toFixed(1)} hours old`);
    }

    // Get historical data
    const historicalData = data.slice(-48);
    
    res.status(200).json({ 
      metrics: latestData,
      historical: historicalData.map(entry => ({
        time: new Date(entry.Date).toLocaleTimeString(),
        price: entry.Open,
        timestamp: new Date(entry.Date).getTime()
      })),
      lastUpdated: latestTimestamp.toISOString(),
      isStale: hoursDifference > 1
    });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
