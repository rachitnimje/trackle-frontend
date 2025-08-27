"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Users,
  ArrowRight,
  PlayCircle,
  CheckCircle,
  LogIn,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, isAuthenticated, loading, logout, isGoogleUser } = useAuth();
  const router = useRouter();

  const handleLoginClick = () => {
    console.log("Login button clicked!");
    router.push("/auth/login");
  };

  const handleRegisterClick = () => {
    console.log("Register button clicked!");
    router.push("/auth/register");
  };

  return (
    <div className="min-h-screen">
      {!loading && (
        <>
          {isAuthenticated ? (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
              <div className="w-full max-w-6xl mx-auto px-4 py-3">
                {/* Welcome Section */}
                <div className="text-center mb-4">
                  <h1 className="text-3xl font-bold mb-4">
                    Welcome back, {user?.username}! 💪
                  </h1>
                  <p className="text-l text-muted-foreground">
                    Ready to crush your fitness goals today?
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
                  <Link href="/workouts/create">
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group gap-2 py-3">
                      <CardHeader className="text-center">
                        <div className="mx-auto p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit group-hover:scale-110 transition-transform">
                          <PlayCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-lg">Start Workout</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Begin a new workout session
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/templates">
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group gap-2 py-3">
                      <CardHeader className="text-center">
                        <div className="mx-auto p-2 bg-green-100 dark:bg-green-900/20 rounded-full w-fit group-hover:scale-110 transition-transform">
                          <BookOpen className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-lg">Templates</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Browse workout templates
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/exercises">
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group gap-2 py-3">
                      <CardHeader className="text-center">
                        <div className="mx-auto p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full w-fit group-hover:scale-110 transition-transform">
                          <Dumbbell className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <CardTitle className="text-lg">Exercises</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Explore exercise database
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/statistics">
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group gap-2 py-3">
                      <CardHeader className="text-center">
                        <div className="mx-auto p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full w-fit group-hover:scale-110 transition-transform">
                          <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                        </div>
                        <CardTitle className="text-lg">Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">
                          View your progress
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            // New landing page for non-authenticated users
            <div className="w-full">
              {/* Hero Section */}
              <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20">
                <div className="max-w-6xl mx-auto px-4">
                  <div className="text-center max-w-3xl mx-auto">
                    <Badge variant="secondary" className="mb-4">
                      🏋️ Transform Your Fitness Journey
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-6">
                      Track. Train. Transform.
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                      Take control of your fitness with Trackle - the smart
                      workout tracker that helps you build stronger habits,
                      track your progress, and achieve your goals.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={handleRegisterClick}
                      >
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={handleLoginClick}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Features Section */}
              <section className="py-20 bg-background">
                <div className="max-w-6xl mx-auto px-4">
                  <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      Everything you need to succeed
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                      Powerful features designed to make your fitness journey
                      simple, effective, and enjoyable.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <Card className="text-center p-6 border-0 shadow-lg">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Dumbbell className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        Exercise Library
                      </h3>
                      <p className="text-muted-foreground">
                        Access hundreds of exercises with detailed instructions
                        and muscle group targeting.
                      </p>
                    </Card>

                    {/* Feature 2 */}
                    <Card className="text-center p-6 border-0 shadow-lg">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        Progress Tracking
                      </h3>
                      <p className="text-muted-foreground">
                        Monitor your strength gains, workout frequency, and
                        overall fitness progress over time.
                      </p>
                    </Card>

                    {/* Feature 3 */}
                    <Card className="text-center p-6 border-0 shadow-lg">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        Smart Templates
                      </h3>
                      <p className="text-muted-foreground">
                        Create and save workout templates for quick and
                        consistent training sessions.
                      </p>
                    </Card>

                    {/* Feature 4 */}
                    <Card className="text-center p-6 border-0 shadow-lg">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        Quick Workouts
                      </h3>
                      <p className="text-muted-foreground">
                        Log workouts fast with intuitive interface designed for
                        efficiency during training.
                      </p>
                    </Card>

                    {/* Feature 5 */}
                    <Card className="text-center p-6 border-0 shadow-lg">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        Goal Achievement
                      </h3>
                      <p className="text-muted-foreground">
                        Set personal records, track achievements, and celebrate
                        your fitness milestones.
                      </p>
                    </Card>

                    {/* Feature 6 */}
                    <Card className="text-center p-6 border-0 shadow-lg">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        Personal Dashboard
                      </h3>
                      <p className="text-muted-foreground">
                        Get insights with comprehensive statistics and analytics
                        about your training habits.
                      </p>
                    </Card>
                  </div>
                </div>
              </section>

              {/* Benefits Section */}
              <section className="py-20 bg-primary/5">
                <div className="max-w-4xl mx-auto px-4">
                  <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      Why choose Trackle?
                    </h2>
                    <p className="text-xl text-muted-foreground">
                      Join thousands of fitness enthusiasts who trust Trackle to
                      guide their fitness journey.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            Simple & Intuitive
                          </h3>
                          <p className="text-muted-foreground">
                            Clean interface designed for both beginners and
                            experienced lifters.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            Always Available
                          </h3>
                          <p className="text-muted-foreground">
                            Works offline and syncs when connected. Access your
                            data anywhere.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            Privacy Focused
                          </h3>
                          <p className="text-muted-foreground">
                            Your data is secure and private. We never share your
                            personal information.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            Completely Free
                          </h3>
                          <p className="text-muted-foreground">
                            All features included at no cost. No hidden fees or
                            premium tiers.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            Regular Updates
                          </h3>
                          <p className="text-muted-foreground">
                            Continuous improvements and new features based on
                            user feedback.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            Community Driven
                          </h3>
                          <p className="text-muted-foreground">
                            Built by fitness enthusiasts for fitness
                            enthusiasts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <section className="py-20 bg-background">
                <div className="max-w-4xl mx-auto px-4 text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Ready to start your fitness journey?
                  </h2>
                  <p className="text-xl text-muted-foreground mb-8">
                    Join Trackle today and take the first step towards a
                    stronger, healthier you.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto"
                      onClick={handleRegisterClick}
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Tracking Now
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                      onClick={handleLoginClick}
                    >
                      Already have an account?
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
