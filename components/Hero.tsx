"use client"

import React from 'react';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Award } from 'lucide-react';
import Image from 'next/image';

interface RunnerHeroProps {
  heading?: string;
  subheading?: string;
  description?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  stats?: {
    label: string;
    value: string;
  }[];
  backgroundImage?: string;
}

const RunnerHero = ({
  heading = "Push Your Limits",
  subheading = "Every Mile Matters",
  description = "Join thousands of runners who are transforming their lives one stride at a time. Track your progress, connect with fellow athletes, and achieve your personal best.",
  primaryCta = {
    text: "Login to Dashboard",
    href: "/login",
  },
  secondaryCta = {
    text: "View The Crew",
    href: "#members",
  },
  stats = [
    { label: "Active Runners", value: "15" },
    { label: "Plans Available", value: "3" },
    { label: "Finish Line", value: "1" },
  ],
  backgroundImage = "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&auto=format&fit=crop&q=80",
}: RunnerHeroProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const imageVariants = {
    hidden: { scale: 1.2, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <div className="hero-container dark">
      <section className="relative min-h-screen w-full overflow-hidden bg-background">
        {/* Animated gradient background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-background"></div>
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: 'radial-gradient(ellipse 800px 600px at 50% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
              animation: 'pulse 8s ease-in-out infinite alternate',
            }}
          ></div>
        </div>

        <div className="container relative z-10 mx-auto px-6 py-16 lg:px-8 mt-16">
          <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Content */}
            <motion.div
              className="flex flex-col justify-center"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="mb-4 inline-flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium tracking-wider text-primary uppercase">
                  {subheading}
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="mb-6 text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl"
              >
                {heading}
              </motion.h1>

              <motion.div variants={itemVariants} className="mb-4 h-1 w-24 bg-primary"></motion.div>

              <motion.p
                variants={itemVariants}
                className="mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground"
              >
                {description}
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-4 sm:flex-row sm:items-center"
              >
                <Button size="lg" className="group relative overflow-hidden" asChild>
                  <a href={primaryCta.href} className="flex items-center gap-2">
                    {primaryCta.text}
                    <Award className="h-4 w-4 transition-transform group-hover:scale-110" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href={secondaryCta.href} className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    {secondaryCta.text}
                  </a>
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8"
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center sm:text-left">
                    <div className="mb-1 text-2xl font-bold text-foreground md:text-3xl">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              className="relative h-[400px] lg:h-[600px]"
              initial="hidden"
              animate="visible"
              variants={imageVariants}
            >
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="h-full w-full relative">
                  <Image 
                    src={backgroundImage} 
                    alt="Runner Hero" 
                    fill 
                    priority 
                    className="object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent"></div>
                </div>
              </div>

              {/* Floating card */}
              <motion.div
                className="absolute bottom-8 left-8 right-8 rounded-xl border border-border bg-background/80 p-6 backdrop-blur-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Personal Best Achieved
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Join the community today
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.2; }
          }
        `}</style>
      </section>
    </div>
  );
};

export default function Hero() {
  return <RunnerHero />;
}
