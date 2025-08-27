"use client";

import Link from "next/link";
import {
  BarChart3,
  Activity,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StatisticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Coming Soon Section */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-8 p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full w-fit">
            <BarChart3 className="h-16 w-16 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Coming Soon! 🚀</h2>
          {/* <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're working hard to bring you comprehensive fitness analytics and insights. 
            Your progress tracking will be more powerful than ever!
          </p> */}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            In the meantime, keep tracking your workouts to build up your data!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/workouts/create">
              <Button size="lg" className="w-full sm:w-auto">
                <Activity className="mr-2 h-5 w-5" />
                Start a Workout
              </Button>
            </Link>
            <Link href="/workouts">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Clock className="mr-2 h-5 w-5" />
                View History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
