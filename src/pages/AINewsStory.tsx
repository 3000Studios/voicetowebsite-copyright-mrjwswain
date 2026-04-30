import { motion } from "motion/react";
import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";

const stories = import.meta.glob("../content/ai-news/*.json", {
  eager: true,
}) as Record<string, any>;

function getStoryBySlug(slug: string) {
  const matchKey = Object.keys(stories).find((k) => stories[k]?.slug === slug);
  return matchKey ? stories[matchKey] : null;
}

export const AINewsStory = () => {
  const { slug } = useParams();
  const story = useMemo(() => (slug ? getStoryBySlug(slug) : null), [slug]);
  const canonical = slug
    ? `https://voice2website.com/ai-news/${slug}`
    : "https://voice2website.com/ai-news";

  if (!story) {
    return (
      <div className="pt-32 pb-40 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">
          Story not found
        </h1>
        <p className="text-slate-400 italic mt-4">Return to the index.</p>
        <div className="mt-10">
          <Link className="btn-minimal" to="/ai-news">
            Back to AI News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-40 px-6 max-w-4xl mx-auto">
      <Helmet>
        <title>{story.title} | Voice2Website</title>
        <meta name="description" content={story.description} />
        <meta name="keywords" content={(story.keywords || []).join(", ")} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={story.title} />
        <meta property="og:description" content={story.description} />
        <meta property="og:type" content="article" />
        {story.heroImage ? (
          <meta property="og:image" content={story.heroImage} />
        ) : null}
      </Helmet>

      <div className="space-y-10">
        <div className="space-y-4">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">
            {new Date(story.publishedAt).toLocaleString()}
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] lights-header"
          >
            {story.title}
          </motion.h1>
          <p className="text-slate-400 italic leading-relaxed">
            {story.description}
          </p>
        </div>

        <div className="glass-premium border border-white/5 overflow-hidden">
          <div className="relative aspect-video w-full bg-black">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale brightness-75"
            >
              <source
                src={story.heroVideo || "/input_file_0.mp4"}
                type="video/mp4"
              />
            </video>
            <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/70" />
          </div>
        </div>

        {story.sections?.map((s: any, i: number) => (
          <motion.section
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
              {s.heading}
            </h2>
            <p className="text-slate-300 leading-relaxed">{s.body}</p>
          </motion.section>
        ))}

        <div className="pt-10 border-t border-white/10 flex items-center justify-between gap-6">
          <Link className="btn-minimal" to="/ai-news">
            Back to AI News
          </Link>
          <Link
            className="btn-minimal bg-indigo-600 text-white hover:bg-white hover:text-black border-none"
            to="/pricing"
          >
            Subscribe
          </Link>
        </div>
      </div>
    </div>
  );
};
