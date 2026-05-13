import { useState } from 'react'
import { useCoachesStore } from '../stores/coaches'

export default function CoachSetup() {
  const create = useCoachesStore((s) => s.create)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    setError('')
    await create({ name: name.trim(), email: email.trim() })
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mt-4 mb-2">Welcome to Sideline</h1>
      <p className="text-gray-500 mb-6">Enter your details to get started.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g. Coach Micah"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g. micah@example.com"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Get Started
        </button>
      </form>
    </div>
  )
}
