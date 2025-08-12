import { AddForm } from '../_components/add-form'

export default function AddVideoPage() {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">Add a New Video Link</h1>
      <p className="text-muted-foreground mb-4">Paste a YouTube video URL to get an AI-powered summary of its content.</p>
      <AddForm contentType="video" />
    </div>
  )
}
