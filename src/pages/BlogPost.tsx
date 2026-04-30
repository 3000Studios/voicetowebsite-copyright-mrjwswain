import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Twitter, Linkedin, Facebook } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { GlassCard } from '@/components/GlassCard';
import { GoogleAdSense } from '@/components/GoogleAdSense';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: string;
  slug: string;
  author?: string;
}

export const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts/${slug}`);
      if (response.ok) {
        const data = await response.json() as { post: BlogPost; related: BlogPost[] };
        setPost(data.post);
        setRelatedPosts(data.related || []);
      } else {
        // Fallback
        const sample = getSamplePost();
        setPost(sample);
        setRelatedPosts([]);
      }
    } catch (error) {
      const sample = getSamplePost();
      setPost(sample);
    } finally {
      setLoading(false);
    }
  };

  const getSamplePost = (): BlogPost => ({
    id: '1',
    title: 'The Future of AI Website Building',
    excerpt: 'How voice technology is revolutionizing website creation',
    content: `
      <p>The landscape of website building is undergoing a seismic shift. Gone are the days when creating a professional website required weeks of work, thousands of dollars, and specialized technical skills.</p>
      
      <h2>The Voice Revolution</h2>
      <p>Voice-to-website technology represents the next evolution in democratizing web development. By simply describing what you want in natural language, AI can now generate complete, production-ready websites in minutes rather than weeks.</p>
      
      <h2>Why This Matters</h2>
      <p>For small businesses and entrepreneurs, time is money. Every day spent wrestling with website builders is a day not spent serving customers. Voice-powered website generation eliminates this friction entirely.</p>
      
      <p>The technology works by using advanced natural language processing to understand your requirements, then generating optimized HTML, CSS, and JavaScript that follows modern best practices for performance, accessibility, and SEO.</p>
      
      <h2>What's Next</h2>
      <p>As AI models continue to improve, we can expect even more sophisticated capabilities: real-time editing through voice commands, automatic A/B testing, and AI-generated content that adapts to your audience.</p>
      
      <p>The future of web development isn't about learning to code—it's about learning to communicate your vision clearly. And that's something every business owner already knows how to do.</p>
    `,
    category: 'AI & Technology',
    tags: ['AI', 'Voice Technology', 'Future', 'Web Development'],
    publishedAt: new Date().toISOString(),
    readTime: '5 min',
    slug: 'future-of-ai-website-building',
    author: 'VoiceToWebsite Team',
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="section-shell pt-32 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Post not found</h1>
        <Link to="/blog" className="text-indigo-400 hover:text-indigo-300">
          Back to blog
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <Helmet>
        <title>{post.title} | VoiceToWebsite Blog</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>

      {/* Header */}
      <section className="section-shell pt-32 pb-12">
        <div className="content-grid max-w-4xl">
          <ScrollReveal>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to blog
            </Link>

            <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                {post.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime} read
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              {post.title}
            </h1>

            <p className="text-xl text-slate-400 leading-relaxed">
              {post.excerpt}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* AdSense */}
      <div className="content-grid">
        <GoogleAdSense slot="blog-post-top" />
      </div>

      {/* Content */}
      <section className="section-shell py-12">
        <div className="content-grid max-w-4xl">
          <ScrollReveal>
            <GlassCard className="prose prose-invert prose-lg max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: post.content }}
                className="text-slate-300 leading-relaxed space-y-6 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-12 [&>h2]:mb-6 [&>p]:text-lg"
              />
            </GlassCard>
          </ScrollReveal>

          {/* Tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 text-slate-400 text-sm border border-white/10"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          {/* Share */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Share this article</span>
              <div className="flex gap-3">
                <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <Twitter className="w-5 h-5 text-slate-400" />
                </button>
                <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <Linkedin className="w-5 h-5 text-slate-400" />
                </button>
                <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <Facebook className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AdSense */}
      <div className="content-grid">
        <GoogleAdSense slot="blog-post-bottom" />
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="section-shell">
          <div className="content-grid max-w-4xl">
            <ScrollReveal>
              <h2 className="text-2xl font-bold text-white mb-8">Related Articles</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {relatedPosts.map((related) => (
                  <Link key={related.id} to={`/blog/${related.slug}`}>
                    <GlassCard className="group cursor-pointer">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">
                        {related.category}
                      </span>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-2">{related.excerpt}</p>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogPost;
