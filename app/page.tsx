import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Sparkles,
  Brain,
  MessageSquare,
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="container relative pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-black dark:text-white" />
            <span className="font-medium text-black dark:text-white">Powered by Generative AI</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl text-black dark:text-white">
            Cloud Cost Optimization Advisor
          </h1>

          <p className="mb-10 text-xl text-gray-600 dark:text-gray-400 md:text-2xl max-w-2xl mx-auto">
            Upload billing data, resource usage reports, and configurations to get AI-powered
            recommendations for optimizing cloud spending and governance.
          </p>

          <div className="flex items-center justify-center mb-16">
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black px-8 h-12 text-lg font-medium"
              >
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Floating Preview Cards */}
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute -top-4 left-0 w-72 opacity-60 animate-float">
              <Card className="p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-white dark:text-black" />
                  </div>
                  <div className="text-sm text-left">
                    <p className="font-medium text-black dark:text-white">Which EC2 instances are underutilized?</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">Analyzing usage patterns...</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="absolute -bottom-4 right-0 w-72 opacity-60 animate-float-delayed">
              <Card className="p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-800 dark:bg-gray-200 flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-white dark:text-black" />
                  </div>
                  <div className="text-sm text-left">
                    <p className="font-medium text-black dark:text-white">Potential Savings: $2,450/month</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">Rightsize 12 instances to save...</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
