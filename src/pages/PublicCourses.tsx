import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Search, Globe, ArrowRight, Loader2, User,
  Clock, BarChart2, Users, Flame,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type PublicCourse = {
  id: string;
  title: string;
  description: string | null;
  topic: string;
  difficulty: string | null;
  estimated_time: string | null;
  subject_category: string | null;
  completion_count: number;
  created_at: string;
  user_id: string;
  module_count?: number;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

const SUBJECTS = [
  "All",
  "Science",
  "Math",
  "History",
  "Technology",
  "Life Skills",
  "Business",
  "Health",
  "Art & Music",
  "Language",
  "Philosophy",
  "Other",
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  Intermediate: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Advanced: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const SUBJECT_ICONS: Record<string, string> = {
  Science: "🔬",
  Math: "📐",
  History: "📜",
  Technology: "💻",
  "Life Skills": "🌱",
  Business: "💼",
  Health: "🏃",
  "Art & Music": "🎨",
  Language: "🗣️",
  Philosophy: "🤔",
  Other: "✨",
};

export default function PublicCourses() {
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicCourses();
  }, []);

  const fetchPublicCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, description, topic, difficulty, estimated_time, subject_category, completion_count, created_at, user_id")
      .eq("is_public", true)
      .eq("status", "ready")
      .order("completion_count", { ascending: false })
      .limit(60);

    if (!error && data) {
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const [profilesRes, moduleCountsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds),
        supabase.from("course_modules").select("course_id").in("course_id", data.map((c: any) => c.id)),
      ]);

      const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) || []);
      const moduleCountMap = new Map<string, number>();
      for (const m of (moduleCountsRes.data || [])) {
        moduleCountMap.set(m.course_id, (moduleCountMap.get(m.course_id) || 0) + 1);
      }

      const enriched = data.map((c: any) => ({
        ...c,
        module_count: moduleCountMap.get(c.id) || 0,
        profiles: profileMap.get(c.user_id) || null,
      }));
      setCourses(enriched);
    }
    setLoading(false);
  };

  const filtered = courses.filter((c) => {
    const matchesSubject = activeSubject === "All" || c.subject_category === activeSubject;
    const matchesSearch = !search.trim() || [c.title, c.topic, c.description]
      .some((s) => s?.toLowerCase().includes(search.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  // Sort: featured (most completions) first, then by date
  const sorted = [...filtered].sort((a, b) => {
    if (b.completion_count !== a.completion_count) return b.completion_count - a.completion_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/[0.08] border border-green-500/15 mb-6">
          <Globe className="w-3.5 h-3.5 text-green-500" />
          <span className="text-[13px] font-medium text-green-600 dark:text-green-400">Community Courses</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
          Explore <span className="gradient-text">Public Courses</span>
        </h1>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          Courses built by the community — instantly ready, no waiting.
        </p>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Subject filter tabs */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all",
                activeSubject === subject
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground",
              )}
            >
              {subject !== "All" && (
                <span className="mr-1">{SUBJECT_ICONS[subject] || "•"}</span>
              )}
              {subject}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {!loading && (
        <div className="max-w-5xl mx-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span>{sorted.length} course{sorted.length !== 1 ? "s" : ""}</span>
          {activeSubject !== "All" && <span>in {activeSubject}</span>}
          {search && <span>matching "{search}"</span>}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length > 0 ? (
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((course) => (
            <Card
              key={course.id}
              className="bg-card/80 border-border/50 hover:border-primary/20 transition-all cursor-pointer group hover:-translate-y-0.5"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <CardContent className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-lg">
                    {course.subject_category ? SUBJECT_ICONS[course.subject_category] || "📚" : "📚"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {course.difficulty && (
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0 border", DIFFICULTY_COLORS[course.difficulty] || "")}
                      >
                        {course.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Title & description */}
                <h3 className="font-display font-semibold text-[15px] mb-1 line-clamp-2">{course.title}</h3>
                <p className="text-[13px] text-muted-foreground line-clamp-2 mb-4">
                  {course.description || course.topic}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                  {course.module_count != null && course.module_count > 0 && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {course.module_count} module{course.module_count !== 1 ? "s" : ""}
                    </span>
                  )}
                  {course.estimated_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.estimated_time}
                    </span>
                  )}
                  {course.completion_count > 0 && (
                    <span className="flex items-center gap-1 text-amber-500/70">
                      <Flame className="w-3 h-3" />
                      {course.completion_count}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {course.profiles?.full_name || "Anonymous"}
                  </span>
                  <span className="text-xs text-primary font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Start <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            {search || activeSubject !== "All"
              ? "No courses match your filters."
              : "No public courses yet. Be the first to create one!"}
          </p>
          {(search || activeSubject !== "All") && (
            <button
              onClick={() => { setSearch(""); setActiveSubject("All"); }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
