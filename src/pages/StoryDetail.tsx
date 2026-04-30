import { GoogleAdSense } from "@/components/GoogleAdSense";
import { FizzyButton } from "@/components/ui/FizzyButton";
import { SplitLink } from "@/components/ui/SplitLink";
import { Story, TechStoryService } from "@/lib/techStoryService";
import { ArrowLeft, Calendar, Clock, Play, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";

export const StoryDetail = () => {
  const { id } = useParams();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      const stories = await TechStoryService.getAllStories();
      const found = stories.find((s) => s.id === id);
      setStory(found || null);
      setLoading(false);
    };
    fetchStory();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-8">
        <h1 className="text-4xl font-black uppercase italic">
          Story Manifestation Not Found
        </h1>
        <Link to="/stories" className="btn-minimal bg-white/5 px-8 py-4">
          Back to Showcase
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-40 px-6 max-w-5xl mx-auto">
      <Helmet>
        <title>{story.seoTitle} | VoiceToWebsite.com</title>
        <meta name="description" content={story.seoDescription} />
        <meta name="keywords" content={story.seoKeywords} />
        <meta property="og:title" content={story.seoTitle} />
        <meta property="og:description" content={story.seoDescription} />
        <meta property="og:type" content="article" />
      </Helmet>

      <Link
        to="/stories"
        className="inline-flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest italic mb-12 transition-all"
      >
        <ArrowLeft size={18} /> <SplitLink>Back to Stories</SplitLink>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-6 text-slate-500 text-sm font-black uppercase tracking-[0.3em] italic">
            <span className="flex items-center gap-2">
              <Calendar size={14} />{" "}
              {story.timestamp.toDate().toLocaleDateString()}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={14} />{" "}
              {story.timestamp.toDate().toLocaleTimeString()}
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] uppercase italic tracking-tighter">
            {story.title}
          </h1>
          <div className="flex items-center gap-4">
            <div className="w-10 h-2.5 bg-indigo-500" />
            <span className="text-indigo-400 font-bold uppercase tracking-widest">
              {story.author}
            </span>
          </div>
        </div>

        {/* Video Segment */}
        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
          <video
            src={story.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-8 left-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
              <Play size={20} className="fill-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.4em]">
              Cinematic Manifest Active
            </span>
          </div>
        </div>

        <GoogleAdSense slot="story-middle" />

        <div className="prose prose-invert max-w-none prose-p:text-slate-400 prose-p:text-xl prose-p:leading-relaxed prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-a:text-indigo-400 font-medium">
          {story.content.split("\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-xs font-black uppercase tracking-widest">
              <Share2 size={14} /> Share Protocol
            </button>
          </div>
          <FizzyButton
            label="Initialize Your Manifest"
            onClick={() => navigate("/dashboard")}
            className="w-full md:w-fit"
          />
        </div>
      </motion.div>

      <div className="mt-32 border-t border-white/5 pt-20">
        <GoogleAdSense slot="story-footer" />
      </div>
    </div>
  );
};
