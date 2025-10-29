import type { NextApiRequest, NextApiResponse } from 'next';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebaseConfig';
import Papa from 'papaparse';

interface PredictionRow {
  Date: string;
  'Predicted Close': string;
}

// Cache for prediction data
let predictionsCache: {
  data: any;
  timestamp: number;
} | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check cache first
    if (predictionsCache && Date.now() - predictionsCache.timestamp < CACHE_DURATION) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
      return res.status(200).json(predictionsCache.data);
    }

    console.log('Attempting to fetch predictions from Firebase Storage');
    
    const fileRef = ref(storage, 'data/predictions.csv');
    console.log('Storage reference created for:', fileRef.fullPath);
    
    const url = await getDownloadURL(fileRef);
    console.log('Successfully obtained download URL');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file. HTTP status: ${response.status}`);
    }

    const csvText = await response.text();
    const parsed = Papa.parse<PredictionRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        if (field === 'Predicted Close') {
          return value.replace(/[$,]/g, '');
        }
        return value;
      }
    });

    if (!parsed.data || parsed.data.length === 0) {
      throw new Error('No data found in predictions file');
    }

    const graphData = parsed.data
      .slice(0, 30)
      .reverse()
      .map(row => {
        try {
          return {
            x: new Date(row.Date).getTime(),
            y: parseFloat(row['Predicted Close'])
          };
        } catch (error) {
          console.error('Error parsing row:', row, error);
          return null;
        }
      })
      .filter(Boolean);

    const predictions = parsed.data.slice(0, 7).map(row => ({
      date: row.Date,
      price: parseFloat(row['Predicted Close']).toFixed(2)
    }));

    const responseData = {
      predictions,
      graphData,
      lastUpdated: new Date().toISOString()
    };

    // Update cache
    predictionsCache = {
      data: responseData,
      timestamp: Date.now()
    };

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Detailed error in fetch predictions:', {
      error,
      firebaseConfig: {
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      }
    });
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch predictions',
      timestamp: new Date().toISOString()
    });
  }
}