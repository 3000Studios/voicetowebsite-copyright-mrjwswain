import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Settings,
  Eye,
  Trash2,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Hardcoded credentials for the owner as requested
    if (email === 'mr.jwswain@gmail.com' && key === '5555') {
      setIsLoggedIn(true);
      fetchAdminData();
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, key }),
      });
      const data = await res.json();
      if (data.success && data.user.role === 'admin') {
        setIsLoggedIn(true);
        fetchAdminData();
      } else {
        alert("Invalid admin credentials");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [statsRes, msgRes, apptRes, sitesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/messages'),
        fetch('/api/admin/appointments'),
        fetch('/api/admin/sites')
      ]);
      setStats(await statsRes.json());
      setMessages(await msgRes.json());
      setAppointments(await apptRes.json());
      setSites(await sitesRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateStory = async () => {
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: "Generate a futuristic, high-end tech story about the evolution of voice-to-website technology. Include a title, a topic, a hero video description (for a stock video search), and the story content. Return the result in JSON format with keys: title, topic, heroVideoDescription, storyContent.",
        config: { responseMimeType: "application/json" }
      });

      const storyData = JSON.parse(response.text || '{}');
      
      await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyData),
      });

      alert("New story generated and published!");
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert("Failed to generate story");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md lifted-section bg-slate-900 p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">Admin <span className="text-indigo-400">Login</span></h1>
            <p className="text-slate-400 font-medium">Enter your credentials to access the command center.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <Input 
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-950 border-2 border-slate-800 text-white h-14 rounded-none focus:border-indigo-500 transition-all font-bold"
              required
            />
            <Input 
              type="password"
              placeholder="Admin Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="bg-slate-950 border-2 border-slate-800 text-white h-14 rounded-none focus:border-indigo-500 transition-all font-bold"
              required
            />
            <button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.4)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              {loading ? 'Verifying...' : 'Login to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-2 tracking-tighter uppercase italic">ADMIN <span className="text-indigo-400">DASHBOARD</span></h1>
          <p className="text-slate-400 text-xl font-medium">Real-time analytics and system management</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleGenerateStory}
            className="h-14 px-8 bg-slate-800 text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-slate-700 transition-all flex items-center"
          >
            <Sparkles className="mr-2" size={18} />
            Generate Story
          </button>
          <button 
            onClick={fetchAdminData}
            className="h-14 px-8 bg-indigo-600 text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-indigo-500 transition-all"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className="lifted-section bg-slate-900 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-indigo-600 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
              <Users className="text-white" size={24} />
            </div>
            <Badge className="bg-green-500 text-white font-black uppercase tracking-widest text-[10px] rounded-none border-none">+12%</Badge>
          </div>
          <div className="text-4xl font-black text-white mb-1 uppercase italic tracking-tight">{stats?.totalUsers || 0}</div>
          <div className="text-slate-500 font-black uppercase tracking-widest text-xs">Total Subscribers</div>
        </div>
        <div className="lifted-section bg-slate-900 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-purple-600 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
              <DollarSign className="text-white" size={24} />
            </div>
            <Badge className="bg-green-500 text-white font-black uppercase tracking-widest text-[10px] rounded-none border-none">+8%</Badge>
          </div>
          <div className="text-4xl font-black text-white mb-1 uppercase italic tracking-tight">${stats?.revenue?.toFixed(2) || '0.00'}</div>
          <div className="text-slate-500 font-black uppercase tracking-widest text-xs">Total Revenue</div>
        </div>
        <div className="lifted-section bg-slate-900 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-pink-600 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
              <MessageSquare className="text-white" size={24} />
            </div>
            <Badge className="bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-none border-none">New</Badge>
          </div>
          <div className="text-4xl font-black text-white mb-1 uppercase italic tracking-tight">{stats?.totalMessages || 0}</div>
          <div className="text-slate-500 font-black uppercase tracking-widest text-xs">Unread Messages</div>
        </div>
        <div className="lifted-section bg-slate-900 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-blue-600 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
              <TrendingUp className="text-white" size={24} />
            </div>
            <Badge className="bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-none border-none">Live</Badge>
          </div>
          <div className="text-4xl font-black text-white mb-1 uppercase italic tracking-tight">{stats?.activeSessions || 0}</div>
          <div className="text-slate-500 font-black uppercase tracking-widest text-xs">Active Sessions</div>
        </div>
      </div>

      {/* Sites List */}
      <div className="lifted-section bg-slate-900 overflow-hidden mb-12">
        <div className="p-8 border-b-2 border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Generated Sites ({sites.length})</h3>
          <Badge className="bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-none border-none">
            {stats?.dailyGenerations || 0} Today
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x-2 divide-y-2 divide-slate-800">
          {sites.length > 0 ? sites.map((site) => (
            <div key={site.id} className="p-8 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="font-black text-white uppercase italic tracking-tight text-lg truncate flex-1 mr-4">
                  {site.id}
                </div>
                <Badge className={site.isDraft ? 'bg-slate-700' : 'bg-green-600'}>
                  {site.isDraft ? 'Draft' : 'Live'}
                </Badge>
              </div>
              <div className="text-xs text-slate-500 font-medium italic mb-6">
                Created: {new Date(site.timestamp).toLocaleString()}
              </div>
              <div className="flex gap-4">
                <a 
                  href={`/${site.id}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:bg-indigo-500 transition-all flex items-center gap-2"
                >
                  <Eye size={14} />
                  View Site
                </a>
                <button className="px-4 py-2 bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:bg-slate-700 transition-all">
                  Manage
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full p-16 text-center text-slate-500 font-black uppercase tracking-widest italic">No sites generated yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Messages Table */}
        <div className="lifted-section bg-slate-900 overflow-hidden">
          <div className="p-8 border-b-2 border-slate-800 flex items-center justify-between bg-slate-950/50">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Recent Messages</h3>
            <button className="text-indigo-400 font-black uppercase tracking-widest text-xs hover:text-indigo-300 transition-all">View All</button>
          </div>
          <div className="divide-y-2 divide-slate-800">
            {messages.length > 0 ? messages.map((msg) => (
              <div key={msg.id} className="p-8 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-black text-white uppercase italic tracking-tight text-lg">{msg.name}</div>
                  <div className="text-xs text-slate-500 font-medium italic">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                </div>
                <p className="text-slate-400 font-medium mb-6 line-clamp-2 leading-relaxed">{msg.message}</p>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:bg-slate-700 transition-all">Reply</button>
                  <button className="px-4 py-2 bg-red-600/10 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-600/20 transition-all">Delete</button>
                </div>
              </div>
            )) : (
              <div className="p-16 text-center text-slate-500 font-black uppercase tracking-widest italic">No messages yet</div>
            )}
          </div>
        </div>

        {/* Appointments Table */}
        <div className="lifted-section bg-slate-900 overflow-hidden">
          <div className="p-8 border-b-2 border-slate-800 flex items-center justify-between bg-slate-950/50">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Upcoming Demos</h3>
            <button className="text-indigo-400 font-black uppercase tracking-widest text-xs hover:text-indigo-300 transition-all">Calendar</button>
          </div>
          <div className="divide-y-2 divide-slate-800">
            {appointments.length > 0 ? appointments.map((appt) => (
              <div key={appt.id} className="p-8 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] uppercase italic">
                      {appt.name[0]}
                    </div>
                    <div>
                      <div className="font-black text-white uppercase italic tracking-tight text-lg">{appt.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{appt.email}</div>
                    </div>
                  </div>
                  <Badge className="bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-none border-none shadow-lg">
                    {appt.date} @ {appt.time}
                  </Badge>
                </div>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-indigo-500 transition-all">Confirm</button>
                  <button className="px-6 py-3 bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-slate-700 transition-all">Reschedule</button>
                </div>
              </div>
            )) : (
              <div className="p-16 text-center text-slate-500 font-black uppercase tracking-widest italic">No appointments scheduled</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
