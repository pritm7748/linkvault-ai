import { AddForm } from '@/app/(app)/add/_components/add-form'

export default function AddLinkPage() {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">Add a New Link</h1>
      {/* This renders our reusable form component.
        We pass the 'contentType' prop to tell the form to show a URL input field.
      */}
      <AddForm contentType="link" />
    </div>
  )
}
