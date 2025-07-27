import { AddForm } from '@/app/(app)/add/_components/add-form'

export default function AddNotePage() {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">Add a New Note</h1>
      {/* This renders our reusable form component.
        We pass the 'contentType' prop to tell the form to show a textarea for a note.
      */}
      <AddForm contentType="note" />
    </div>
  )
}
