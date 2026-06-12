"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, RefreshCw, Download, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export default function PreviewPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [selfie, setSelfie] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [reference, setReference] = useState<File | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"]

  const validateFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`Invalid file type: ${file.name}. Only JPG, JPEG, and PNG are allowed.`)
      return false
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large: ${file.name}. Max size is 10MB.`)
      return false
    }
    return true
  }

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setSelfie(file)
        setSelfiePreview(URL.createObjectURL(file))
      } else {
        e.target.value = ''
      }
    }
  }

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setReference(file)
        setReferencePreview(URL.createObjectURL(file))
      } else {
        e.target.value = ''
      }
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phone || !selfie || !reference) {
      toast.error("Please fill in all fields and upload both images.")
      return
    }

    setIsLoading(true)
    setResultImage(null)

    try {
      const formData = new FormData()
      formData.append("selfie", selfie)
      formData.append("reference", reference)

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success || !response.ok) {
        throw new Error(data.error || "Failed to generate preview")
      }

      setResultImage(data.resultUrl)
      toast.success("Hairstyle preview generated successfully!")
    } catch (error: unknown) {
      console.error("Generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred while generating the preview."
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResultImage(null)
  }

  const handleDownload = async () => {
    if (!resultImage) return

    try {
      // Create a temporary link to download the image
      const a = document.createElement('a')
      a.href = resultImage
      a.download = `hairstyle-preview-${name.replace(/\s+/g, '-').toLowerCase()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      console.error(err)
      toast.error("Failed to download image.")
    }
  }

  if (resultImage) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-5xl">
        <h1 className="text-3xl font-bold text-center mb-8">Your Hairstyle Preview</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Original Selfie</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {selfiePreview && (
                <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden">
                  <Image src={selfiePreview} alt="Selfie" fill unoptimized={true} className="object-cover" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Hairstyle Reference</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {referencePreview && (
                <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden">
                  <Image src={referencePreview} alt="Reference" fill unoptimized={true} className="object-cover" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary shadow-lg border-2">
            <CardHeader>
              <CardTitle className="text-center text-primary">AI Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden">
                <Image src={resultImage} alt="Generated Preview" fill unoptimized={true} className="object-cover" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={handleReset} variant="outline" className="w-40">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={handleDownload} className="w-40">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Try Hairstyle Preview</CardTitle>
          <CardDescription className="text-center">
            Upload your photo and a reference hairstyle to see how it looks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <Label>Your Selfie</Label>
                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center h-48 relative overflow-hidden group">
                  {selfiePreview ? (
                    <>
                      <Image src={selfiePreview} alt="Selfie preview" fill unoptimized={true} className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="secondary" size="sm" type="button" onClick={() => document.getElementById('selfie-upload')?.click()}>
                           Change
                         </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-sm">Upload a clear photo of your face</span>
                      <Button variant="secondary" size="sm" type="button" onClick={() => document.getElementById('selfie-upload')?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Browse
                      </Button>
                    </div>
                  )}
                  <input
                    id="selfie-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleSelfieChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Hairstyle Reference</Label>
                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center h-48 relative overflow-hidden group">
                  {referencePreview ? (
                    <>
                      <Image src={referencePreview} alt="Reference preview" fill unoptimized={true} className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="secondary" size="sm" type="button" onClick={() => document.getElementById('reference-upload')?.click()}>
                           Change
                         </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-sm">Upload a photo of the desired haircut</span>
                      <Button variant="secondary" size="sm" type="button" onClick={() => document.getElementById('reference-upload')?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Browse
                      </Button>
                    </div>
                  )}
                  <input
                    id="reference-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleReferenceChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading || !selfie || !reference || !name || !phone}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating your hairstyle preview...
                </>
              ) : (
                "Generate Preview"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
