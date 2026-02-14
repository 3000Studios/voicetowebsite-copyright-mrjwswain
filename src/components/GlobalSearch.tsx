import React, { useState, useEffect, useRef } from "react";
import { Search, X, Globe, FileText, User, Settings, ShoppingCart, Zap } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "page" | "product" | "user" | "setting" | "feature";
  icon: React.ReactNode;
}

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample search data - in production, this would come from an API
  const searchData: SearchResult[] = [
    {
      id: "1",
      title: "Voice to Website",
      description: "Convert voice commands into websites instantly",
      url: "/",
      type: "page",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: "2",
      title: "App Store",
      description: "Browse and purchase premium applications",
      url: "/store",
      type: "page",
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      id: "3",
      title: "Admin Panel",
      description: "Access administrative controls and settings",
      url: "/admin/",
      type: "page",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "4",
      title: "Pricing Plans",
      description: "View our subscription tiers and pricing",
      url: "/pricing.html",
      type: "page",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "5",
      title: "AudioBoost Pro AI",
      description: "Professional audio enhancement powered by AI",
      url: "/store",
      type: "product",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: "6",
      title: "User Profile",
      description: "Manage your account and preferences",
      url: "/profile",
      type: "user",
      icon: <User className="w-4 h-4" />,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate search delay
    const timer = setTimeout(() => {
      const filteredResults = searchData.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filteredResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    window.location.href = result.url;
    setIsOpen(false);
    setQuery("");
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "page":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "product":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "user":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "setting":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "feature":
        return "bg-pink-500/20 text-pink-400 border-pink-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 p-3 bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-xl text-white hover:bg-gray-800/80 transition-all duration-200 group"
        title="Search (⌘K)"
      >
        <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          ⌘K
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div
        ref={searchRef}
        className="relative w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700/50">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, products, features..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left group"
                >
                  <div className={`p-2 rounded-lg border ${getTypeColor(result.type)} flex-shrink-0`}>
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                        {result.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getTypeColor(result.type)}`}>
                        {result.type}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-1">{result.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() !== "" ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No results found</p>
              <p className="text-sm">Try searching for something else</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-white font-medium mb-2">Popular Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {["Voice to Website", "App Store", "Pricing", "Admin"].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-lg text-sm transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Quick Links</h3>
                <div className="space-y-2">
                  {searchData.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleResultClick(item)}
                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
                    >
                      <div className={`p-1.5 rounded border ${getTypeColor(item.type)}`}>{item.icon}</div>
                      <span className="text-gray-300 hover:text-white transition-colors">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700/50 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            <span>Search across entire site</span>
          </div>
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
