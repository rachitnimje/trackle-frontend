"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Login from "./login";
import Register from "./register";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Trackle</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Track your fitness journey
          </p>
        </div>

        <Tabs
          defaultValue="login"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Login onSuccess={() => router.push("/")} />
          </TabsContent>
          <TabsContent value="register">
            <Register onSuccess={() => setActiveTab("login")} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
