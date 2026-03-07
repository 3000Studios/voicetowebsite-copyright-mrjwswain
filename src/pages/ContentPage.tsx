import { motion } from "framer-motion";
import React from "react";
import PageLayout, { WallpaperVariant } from "../components/PageLayout";

export interface CardItem {
  title: string;
  body: string;
}

export interface ContentPageConfig {
  title: string;
  subtitle?: string;
  wallpaper: WallpaperVariant;
  imageUrl: string;
  imageAlt: string;
  videoUrl: string;
  videoTitle: string;
  paragraphs: string[];
  cards?: CardItem[];
  extra?: React.ReactNode;
}

interface ContentPageProps {
  config: ContentPageConfig;
}

const ContentPage: React.FC<ContentPageProps> = ({ config }) => {
  const {
    title,
    subtitle,
    wallpaper,
    imageUrl,
    imageAlt,
    videoUrl,
    videoTitle,
    paragraphs,
    cards = [],
    extra,
  } = config;

  return (
    <PageLayout title={title} subtitle={subtitle} wallpaper={wallpaper}>
      <div className="space-y-16">
        {/* Media block: image + video */}
        <motion.section
          className="grid md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="vtw-card-hover rounded-3xl overflow-hidden border border-white/10 bg-black/30">
            <img
              src={imageUrl}
              alt={imageAlt}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="p-4 text-center text-white/70 text-sm vtw-body-text">
              {imageAlt}
            </div>
          </div>
          <div className="vtw-card-hover rounded-3xl overflow-hidden border border-white/10 bg-black/30 aspect-video">
            <iframe
              src={videoUrl}
              title={videoTitle}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.section>

        {/* Paragraphs */}
        <motion.section
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-white/80 text-lg md:text-xl leading-relaxed vtw-body-text vtw-scroll-reveal"
            >
              {p}
            </p>
          ))}
        </motion.section>

        {/* Cards */}
        {cards.length > 0 && (
          <motion.section
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {cards.map((card, i) => (
              <div
                key={i}
                className="vtw-card-hover rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <h3 className="vtw-card-title text-xl text-white mb-2">
                  {card.title}
                </h3>
                <p className="vtw-body-text text-white/70 text-sm leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </motion.section>
        )}

        {extra}
      </div>
    </PageLayout>
  );
};

export default ContentPage;
