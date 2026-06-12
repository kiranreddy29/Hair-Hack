import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Scissors } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center gap-2" href="#">
          <Scissors className="h-6 w-6" />
          <span className="font-bold">AI Barber</span>
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Preview Your Hairstyle Before the Haircut
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Upload a selfie and a reference photo, and let AI show you how the cut will look on you. No more surprises!
          </p>
          <div className="pt-4">
            <Link href="/preview">
              <Button size="lg" className="h-12 px-8 text-lg rounded-full">
                Try Hairstyle Preview
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
