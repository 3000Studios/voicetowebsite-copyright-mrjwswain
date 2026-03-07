import { motion } from "framer-motion";
import React from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const IMG =
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80";
const VIDEO = "https://www.youtube.com/embed/Wm6CUgyLu94?autoplay=0";

const CategoryPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const categoryName = name ? name.replace(/-/g, " ") : "Apps";
  const title = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

  return (
    <PageLayout
      title={title}
      subtitle={`Apps and tools in the ${title} category.`}
      wallpaper="templates"
    >
      <div className="space-y-16">
        <motion.section
          className="grid md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="vtw-card-hover rounded-3xl overflow-hidden border border-white/10 bg-black/30">
            <img
              src={IMG}
              alt={title}
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
          <div className="vtw-card-hover rounded-3xl overflow-hidden border border-white/10 bg-black/30 aspect-video">
            <iframe
              src={VIDEO}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.section>
        <motion.p
          className="text-white/80 text-lg leading-relaxed vtw-body-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Browse our {title.toLowerCase()} apps in the App Store. Filter by
          category to find productivity tools, development helpers, design apps,
          and more.
        </motion.p>
      </div>
    </PageLayout>
  );
};

export default CategoryPage;
