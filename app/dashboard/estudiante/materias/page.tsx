"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Subject {
  id: string;
  name: string;
  semester: string;
  created_at: string;
}

export default function MateriasPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: "", semester: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("subjects")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setSubjects(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar materias");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingSubject(null);
    setFormData({ name: "", semester: "" });
    setShowForm(true);
  }

  function openEditForm(subject: Subject) {
    setEditingSubject(subject);
    setFormData({ name: subject.name, semester: subject.semester });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingSubject(null);
    setFormData({ name: "", semester: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.semester.trim()) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (editingSubject) {
        const { error: updateError } = await supabase
          .from("subjects")
          .update({
            name: formData.name.trim(),
            semester: formData.semester.trim(),
          })
          .eq("id", editingSubject.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("subjects")
          .insert({
            student_id: user.id,
            name: formData.name.trim(),
            semester: formData.semester.trim(),
          });

        if (insertError) throw insertError;
      }

      closeForm();
      loadSubjects();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Error al guardar la materia"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(subject: Subject) {
    if (
      !confirm("¿Estás seguro de que deseas eliminar esta materia?")
    ) {
      return;
    }

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subject.id);

      if (deleteError) throw deleteError;

      loadSubjects();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Error al eliminar la materia"
      );
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Cargando materias...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Mis Materias</h1>
          <button
            onClick={openCreateForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nueva Materia
          </button>
        </div>

        {showForm && (
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-lg font-semibold mb-4">
              {editingSubject ? "Editar Materia" : "Nueva Materia"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Cálculo I"
                />
              </div>

              <div>
                <label
                  htmlFor="semester"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Semestre
                </label>
                <select
                  id="semester"
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un semestre</option>
                  <option value="1">1 - Primer Semestre</option>
                  <option value="2">2 - Segundo Semestre</option>
                  <option value="3">3 - Tercer Semestre</option>
                  <option value="4">4 - Cuarto Semestre</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="p-6">
          {subjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No tienes materias registradas aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Nombre
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Semestre
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => (
                    <tr key={subject.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{subject.name}</td>
                      <td className="py-3 px-4">{subject.semester}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditForm(subject)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(subject)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
