import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { appCategories, newApps } from "../data/newApps";

const EnhancedAppStore: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState(newApps);
  const [sortBy, setSortBy] = useState("featured");
  const [cart, setCart] = useState<string[]>([]);

  useEffect(() => {
    let filtered = newApps.filter((app) => {
      const matchesCategory =
        selectedCategory === "all" ||
        app.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Sort apps
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "reviews":
          return b.reviews - a.reviews;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    // Use setTimeout to avoid cascading renders
    setTimeout(() => setFilteredApps(filtered), 0);
  }, [selectedCategory, searchTerm, sortBy]);

  const addToCart = (appId: string) => {
    setCart((prev) => [...prev, appId]);
  };

  const isInCart = (appId: string) => cart.includes(appId);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                App Store
              </h1>
              <p className="text-slate-300 mt-2">
                Discover amazing apps to boost your productivity
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search apps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white w-64"
                />
                <span className="absolute left-3 top-2.5 text-slate-400">
                  🔍
                </span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
                <option value="name">Name</option>
              </select>

              <div className="relative">
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.length}
                </span>
                <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  🛒 Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-3">
          {appCategories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full transition-all ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.name} ({category.count})
            </motion.button>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {filteredApps.map((app) => (
              <motion.div
                key={app.id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all"
              >
                {/* App Badge */}
                {app.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full">
                      {app.badge}
                    </span>
                  </div>
                )}

                {/* App Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <div className="text-6xl">📱</div>
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* App Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {app.name}
                  </h3>
                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                    {app.description}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < Math.floor(app.rating)
                              ? "text-yellow-400"
                              : "text-slate-600"
                          }
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="text-slate-400 text-sm">
                      {app.rating} ({app.reviews})
                    </span>
                  </div>

                  {/* Features */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {app.features.slice(0, 2).map((feature, index) => (
                        <span
                          key={index}
                          className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                      {app.features.length > 2 && (
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                          +{app.features.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        ${app.price}
                      </div>
                      {app.originalPrice && (
                        <div className="text-sm text-slate-400 line-through">
                          ${app.originalPrice}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => addToCart(app.id)}
                        disabled={isInCart(app.id)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          isInCart(app.id)
                            ? "bg-green-600 text-white"
                            : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isInCart(app.id) ? "✓ In Cart" : "Buy Now"}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No apps found
            </h3>
            <p className="text-slate-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 right-6 bg-slate-800 border border-slate-600 rounded-xl p-6 shadow-2xl max-w-sm"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Cart Summary
          </h3>
          <div className="space-y-2 mb-4">
            {cart.slice(0, 3).map((appId) => {
              const app = newApps.find((a) => a.id === appId);
              return app ? (
                <div key={appId} className="flex justify-between text-sm">
                  <span className="text-slate-300">{app.name}</span>
                  <span className="text-white font-semibold">${app.price}</span>
                </div>
              ) : null;
            })}
            {cart.length > 3 && (
              <div className="text-slate-400 text-sm">
                +{cart.length - 3} more items
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 pt-4">
            <div className="flex justify-between mb-4">
              <span className="text-white font-semibold">Total:</span>
              <span className="text-xl font-bold text-green-400">
                $
                {cart
                  .reduce((total, appId) => {
                    const app = newApps.find((a) => a.id === appId);
                    return total + (app?.price || 0);
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>

            <motion.button
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Checkout ({cart.length} items)
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedAppStore;
