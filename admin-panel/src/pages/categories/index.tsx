import { useState } from 'react'
import { Plus, Edit, Trash2, FolderOpen, Car } from 'lucide-react'

const INITIAL_CATEGORIES = [
    { id: '1', name: 'Sedan', count: 45 },
    { id: '2', name: 'SUV', count: 32 },
    { id: '3', name: 'Hatchback', count: 28 },
    { id: '4', name: 'Luxury', count: 15 },
    { id: '5', name: 'Sports', count: 8 },
    { id: '6', name: 'Electric', count: 12 },
]

export default function CategoriesPage() {
    const [categories, setCategories] = useState(INITIAL_CATEGORIES)
    const [newCat, setNewCat] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    const addCategory = () => {
        if (!newCat.trim()) return
        setCategories([...categories, { id: Date.now().toString(), name: newCat.trim(), count: 0 }])
        setNewCat('')
    }

    const startEdit = (cat: typeof categories[0]) => {
        setEditingId(cat.id)
        setEditValue(cat.name)
    }

    const saveEdit = (id: string) => {
        setCategories(categories.map(c => c.id === id ? { ...c, name: editValue.trim() } : c))
        setEditingId(null)
    }

    const deleteCategory = (id: string) => {
        setCategories(categories.filter(c => c.id !== id))
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Categories</h1>
                <p className="text-text-secondary text-sm mt-0.5">Manage vehicle categories</p>
            </div>

            {/* Add new */}
            <div className="flex gap-3">
                <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Enter category name..."
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    className="flex-1 max-w-sm h-10 px-4 bg-card border border-card-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                <button onClick={addCategory} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors">
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                    <div key={cat.id} className="bg-card rounded-2xl border border-card-border p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center">
                                    <Car className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    {editingId === cat.id ? (
                                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => saveEdit(cat.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(cat.id)} autoFocus
                                            className="font-bold text-text-primary bg-surface border border-primary rounded-lg px-2 py-1 text-sm w-32 focus:outline-none" />
                                    ) : (
                                        <h3 className="font-bold text-text-primary">{cat.name}</h3>
                                    )}
                                    <p className="text-xs text-text-muted mt-0.5">{cat.count} listings</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-surface text-text-muted"><Edit className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
