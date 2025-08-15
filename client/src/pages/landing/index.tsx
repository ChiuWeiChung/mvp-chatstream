import { MessageSquareDot, Video, Users, Zap, Shield, ArrowRight, MessageCircle, Radio, Code, Server, Database } from 'lucide-react';

export const Component = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto p-4 text-center">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 text-primary">
            <MessageSquareDot className="h-12 w-12" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">SockStream</h1>
          </div>
        </div>

        <h2 className="text-xl md:text-3xl font-semibold text-muted-foreground mb-6">即時直播互動平台</h2>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          結合 <span className="text-primary font-semibold">WebSocket 即時通訊</span> 與 <span className="text-primary font-semibold">HLS 影音串流</span> 技術， 打造類似 Discord
          的多頻道直播體驗。支援房間管理、即時聊天、直播串流等完整功能。
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">即時</div>
            <div className="text-sm text-muted-foreground">WebSocket 通訊</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">HLS</div>
            <div className="text-sm text-muted-foreground">影音串流</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">多房間</div>
            <div className="text-sm text-muted-foreground">頻道系統</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 ">
        <h3 className="text-3xl md:text-4xl font-bold mb-4 text-center">核心功能</h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Cards */}
          <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Radio className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold">即時直播</h4>
            </div>
            <p className="text-muted-foreground">支援 RTMP 串流與 HLS 播放，房主可透過 OBS 等工具進行直播，並提供低延遲的播放體驗。</p>
          </div>

          <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold">即時聊天</h4>
            </div>
            <p className="text-muted-foreground">採用 Socket.IO 實作即時聊天，支援多人同時互動，訊息會即時同步。</p>
          </div>

          <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold">多頻道系統</h4>
            </div>
            <p className="text-muted-foreground">採用類似 Discord 的命名空間設計，提供多個頻道與房間，方便依主題進行分組交流。</p>
          </div>

          <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold">身份驗證</h4>
            </div>
            <p className="text-muted-foreground">支援 Google OAuth 與 Email/Password 登入，並透過 better-auth 實作安全的身份驗證。</p>
          </div>

          <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold">HLS 播放</h4>
            </div>
            <p className="text-muted-foreground">使用 HLS.js 在瀏覽器中播放直播，支援自適應串流與跨平台播放。</p>
          </div>

          <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold">即時更新</h4>
            </div>
            <p className="text-muted-foreground">房間人數、用戶狀態、串流狀態等資訊即時更新，提供流暢的使用體驗。</p>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="bg-muted/20 p-8">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-center">Tech Stack</h3>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Frontend */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Code className="h-6 w-6 text-blue-500" />
                </div>
                <h4 className="text-xl font-semibold">前端技術</h4>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  React + TypeScript
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  React Router 7
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Tailwind CSS
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Socket.IO Client
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  HLS.js & Zustand
                </li>
              </ul>
            </div>

            {/* Backend */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Server className="h-6 w-6 text-green-500" />
                </div>
                <h4 className="text-xl font-semibold">後端技術</h4>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Node.js + Express
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Socket.IO Server
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  better-auth
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  SQLite Database
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  RTMP Server (Nginx)
                </li>
              </ul>
            </div>

            {/* Infrastructure */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Database className="h-6 w-6 text-purple-500" />
                </div>
                <h4 className="text-xl font-semibold">基礎環境</h4>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Docker Container
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Node.js 20-alpine (Image)
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Nginx RTMP (Image)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className=" p-6 bg-muted/30 border text-center">
        <p className="text-sm text-muted-foreground">
          <strong>注意：</strong> 本專案為學習用途，專注於即時通訊與影音串流技術的整合實作。 某些商業邏輯和安全性考量已簡化，以便專注於核心技術的展示。
        </p>
      </div>
    </div>
  );
};
