"use client";
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ShieldCheck, AlertTriangle, X } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [alert, setAlert] = useState<string | null>(null); // State for AI Alert
  const [isConnected, setIsConnected] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const socket = new WebSocket('ws://127.0.0.1:8000/ws');
    socketRef.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);

    socket.onmessage = (event: any) => {
      const payload = JSON.parse(event.data);

      // 1. Handle Standard Logs
      if (payload.type === "LOG") {
        const log = payload.data;
        const chartPoint = {
          time: new Date(log.timestamp * 1000).toLocaleTimeString(),
          health: log.status === "200" ? 100 : 0,
        };

        setData(prev => {
          const newData = [...prev, chartPoint];
          if (newData.length > 30) newData.shift();
          return newData;
        });

        setLogs(prev => {
          const newLogs = [log, ...prev];
          if (newLogs.length > 6) newLogs.pop();
          return newLogs;
        });
      }

      // 2. Handle AI Alerts
      if (payload.type === "ALERT") {
        setAlert(payload.data);
      }
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  if (!isMounted) return <div className="p-10 text-white">Loading Sentinel...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans relative">
      
      {/* --- AI ALERT POPUP --- */}
      {alert && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 w-3/4 md:w-1/2 bg-red-900/90 border-2 border-red-500 rounded-xl p-6 shadow-2xl z-50 backdrop-blur-md animate-bounce-in">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-yellow-400 fill-current" /> CRITICAL INCIDENT DETECTED
            </h2>
            <button onClick={() => setAlert(null)} className="text-gray-300 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="bg-black/50 p-4 rounded-lg font-mono text-sm md:text-base text-green-300 whitespace-pre-wrap leading-relaxed border border-red-500/30">
            {alert}
          </div>
          <div className="mt-4 flex justify-end gap-3">
             <button onClick={() => setAlert(null)} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-bold transition">
               Acknowledge & Dismiss
             </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-green-400" /> Sentinel
          </h1>
          <p className="text-gray-400">AI-Powered Infrastructure Monitor</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-bold ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isConnected ? "● Live Connected" : "● Disconnected"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="md:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="text-blue-400" /> Live Health
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tick={false} />
                <YAxis domain={[0, 120]} hide />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }} itemStyle={{ color: '#E5E7EB' }}/>
                <Line type="monotone" dataKey="health" stroke="#3B82F6" strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Logs */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Stream</h2>
          <div className="space-y-3">
            {logs.map((log, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 text-xs md:text-sm font-mono transition-all ${log.status === "500" ? 'bg-red-500/10 border-red-500 text-red-200' : 'bg-gray-700/50 border-green-500 text-gray-300'}`}>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">{log.service}</span>
                  <span className={log.status === "500" ? "text-red-400 font-bold" : "text-green-400"}>{log.status}</span>
                </div>
                <div className="opacity-80 truncate">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}