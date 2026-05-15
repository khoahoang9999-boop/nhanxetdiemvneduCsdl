/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ExternalLink, Monitor, Download, X, Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'options' | 'popup'>('options');
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const resp = await fetch(`/nhan-xet-diem-v3.zip?t=${Date.now()}`);
      if (!resp.ok) throw new Error("HTTP error " + resp.status);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "nhan-xet-diem-v3.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Lỗi khi tải file", error);
      alert("Đã xảy ra lỗi khi tải file. Vui lòng thử lại sau.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-slate-50 w-full min-h-screen flex flex-col font-sans text-slate-800">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center shadow-md border border-yellow-200/50 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent"></div>
            <span className="text-white font-black text-2xl select-none relative z-10 drop-shadow-sm">K</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Trợ lý Nhận xét Pro</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setActiveTab('options')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'options' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Màn hình Quản lý
            </button>
            <button 
              onClick={() => setActiveTab('popup')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'popup' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Màn hình Popup
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          <a 
            href="/popup.html" target="_blank"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Mở tab đầy đủ
          </a>
          <button 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all text-slate-700 rounded-md shadow-sm cursor-pointer"
            onClick={() => setShowInstallGuide(true)}
          >
            <Download className="w-4 h-4" /> HD Cài Đặt
          </button>
          <button
            disabled={isDownloading}
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 border border-transparent hover:bg-blue-700 disabled:opacity-70 disabled:cursor-wait transition-all text-white rounded-md shadow drop-shadow-sm"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isDownloading ? "Đang tạo file ZIP..." : "Tải Xuống Extension"}
          </button>
        </div>
      </header>

      {showInstallGuide && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Hướng Dẫn Cài Đặt</h3>
              <button onClick={() => setShowInstallGuide(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-600 leading-relaxed">
              <ul className="list-decimal pl-5 space-y-3 font-medium text-slate-700">
                <li>Nhấn vào nút <strong>Tải Xuống Extension</strong> ở trên cùng để tải trực tiếp file <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600">nhan-xet-diem.zip</code> về máy. Quá trình này sẽ mất vài giây để Build tự động.</li>
                <li>Giải nén file ZIP vừa tải về, bạn sẽ nhận được một thư mục (nếu zip giải nén ra nhiều file rời rạc, hãy bỏ chúng vào cùng 1 thư mục tạo sẵn).</li>
                <li>Mở trình duyệt Chrome hoặc Cốc Cốc, gõ vào thanh địa chỉ: <code>chrome://extensions/</code></li>
                <li>Bật <strong>Developer mode (Chế độ dành cho nhà phát triển)</strong> ở góc trên bên phải màn hình.</li>
                <li>Nhấn vào nút <strong>Load unpacked (Tải tiện ích đã giải nén)</strong> và chọn thư mục vừa giải nén.</li>
                <li>Mở trang VnEdu hoặc CSDL, mở tính năng nhận xét để công cụ bắt đầu làm việc.</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowInstallGuide(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg text-sm transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex bg-slate-200/50 p-6 md:p-10 justify-center overflow-auto h-[calc(100vh-64px)] relative">
        <div className="absolute top-4 left-6 max-w-sm text-xs text-slate-500 italic">
          * Đây là môi trường Review. Ứng dụng thực tế là Chrome Extension chạy trên trang csdl.moet.gov.vn | vnedu.vn. CSS của Extension được xử lý qua Vite và render qua Iframe.
        </div>

        {activeTab === 'options' ? (
          <div className="w-full max-w-[1100px] h-fit bg-[#F8FAFC] rounded-xl shadow-2xl shadow-slate-300 overflow-hidden ring-1 ring-slate-200 flex flex-col">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex gap-1.5 items-center">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="ml-4 bg-white px-3 py-1 text-xs text-slate-500 rounded border border-slate-200 flex items-center gap-2 shadow-sm font-mono tracking-widest">
                  <Monitor className="w-3 h-3" /> options.html
                </div>
              </div>
            </div>
            <iframe src="/options.html" className="w-full min-h-[750px] border-0 bg-white" title="Options Preview" />
          </div>
        ) : (
          <div className="w-[360px] h-fit bg-white rounded-[2.5rem] shadow-2xl shadow-slate-400 ring-[8px] ring-slate-900 overflow-hidden relative flex flex-col mt-4">
            <div className="w-24 h-6 bg-slate-900 rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2 z-10 hidden sm:block"></div>
            <div className="bg-slate-50 mt-6 px-4 py-2 border-y border-slate-200 flex justify-center text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              popup.html
            </div>
            <div className="w-[320px] mx-auto min-h-[400px] bg-slate-100 flex pb-4">
               <iframe src="/popup.html" className="w-[320px] min-h-[420px] border-0 mx-auto block bg-white shadow py-2" title="Popup Preview" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
