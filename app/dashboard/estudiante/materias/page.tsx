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

interface AcademicRecord {
  id: string;
  subject_id: string;
  student_id: string;
  grade: number;
  attendance: number;
  period: string;
  validated_by: string | null;
  recorded_at: string;
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
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AcademicRecord | null>(null);
  const [recordFormData, setRecordFormData] = useState({ period: "", grade: "", attendance: "" });
  const [submittingRecord, setSubmittingRecord] = useState(false);

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

  async function toggleRecords(subjectId: string) {
    if (expandedSubjectId === subjectId) {
      setExpandedSubjectId(null);
      setRecords([]);
      setShowRecordForm(false);
    } else {
      setExpandedSubjectId(subjectId);
      await loadRecords(subjectId);
    }
  }

  async function loadRecords(subjectId: string) {
    try {
      setLoadingRecords(true);
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("academic_records")
        .select("*")
        .eq("subject_id", subjectId)
        .order("recorded_at", { ascending: false });

      if (fetchError) throw fetchError;

      setRecords(data || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al cargar registros");
    } finally {
      setLoadingRecords(false);
    }
  }

  function openCreateRecordForm() {
    setEditingRecord(null);
    setRecordFormData({ period: "", grade: "", attendance: "" });
    setShowRecordForm(true);
  }

  function openEditRecordForm(record: AcademicRecord) {
    setEditingRecord(record);
    setRecordFormData({
      period: record.period,
      grade: record.grade.toString(),
      attendance: record.attendance.toString(),
    });
    setShowRecordForm(true);
  }

  function closeRecordForm() {
    setShowRecordForm(false);
    setEditingRecord(null);
    setRecordFormData({ period: "", grade: "", attendance: "" });
  }

  async function handleRecordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!recordFormData.period.trim() || !recordFormData.grade || !recordFormData.attendance) {
      alert("Por favor completa todos los campos");
      return;
    }

    const grade = parseFloat(recordFormData.grade);
    const attendance = parseFloat(recordFormData.attendance);

    if (isNaN(grade) || grade < 0 || grade > 10) {
      alert("La nota debe estar entre 0 y 10");
      return;
    }

    if (isNaN(attendance) || attendance < 0 || attendance > 100) {
      alert("La asistencia debe estar entre 0 y 100");
      return;
    }

    try {
      setSubmittingRecord(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (editingRecord) {
        const { error: updateError } = await supabase
          .from("academic_records")
          .update({
            period: recordFormData.period.trim(),
            grade,
            attendance,
          })
          .eq("id", editingRecord.id)
          .is("validated_by", null);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("academic_records")
          .insert({
            student_id: user.id,
            subject_id: expandedSubjectId!,
            period: recordFormData.period.trim(),
            grade,
            attendance,
          });

        if (insertError) throw insertError;
      }

      closeRecordForm();
      if (expandedSubjectId) {
        await loadRecords(expandedSubjectId);
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Error al guardar el registro"
      );
    } finally {
      setSubmittingRecord(false);
    }
  }

  async function handleRecordDelete(record: AcademicRecord) {
    if (!confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      return;
    }

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("academic_records")
        .delete()
        .eq("id", record.id)
        .is("validated_by", null);

      if (deleteError) throw deleteError;

      if (expandedSubjectId) {
        await loadRecords(expandedSubjectId);
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Error al eliminar el registro"
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
                    <>
                      <tr key={subject.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{subject.name}</td>
                        <td className="py-3 px-4">{subject.semester}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleRecords(subject.id)}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              {expandedSubjectId === subject.id ? "Ocultar registros" : "Ver registros"}
                            </button>
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
                      {expandedSubjectId === subject.id && (
                        <tr>
                          <td colSpan={3} className="p-0">
                            <div className="bg-gray-50 p-6 border-t border-b">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                  Registros Académicos
                                </h3>
                                <button
                                  onClick={openCreateRecordForm}
                                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Nuevo Registro
                                </button>
                              </div>

                              {showRecordForm && (
                                <div className="bg-white p-4 rounded-lg mb-4 border">
                                  <h4 className="font-semibold mb-3">
                                    {editingRecord ? "Editar Registro" : "Nuevo Registro"}
                                  </h4>
                                  <form onSubmit={handleRecordSubmit} className="space-y-3">
                                    <div>
                                      <label
                                        htmlFor="period"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                      >
                                        Período
                                      </label>
                                      <input
                                        type="text"
                                        id="period"
                                        value={recordFormData.period}
                                        onChange={(e) =>
                                          setRecordFormData({ ...recordFormData, period: e.target.value })
                                        }
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Parcial 1"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label
                                          htmlFor="grade"
                                          className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                          Nota
                                        </label>
                                        <input
                                          type="number"
                                          id="grade"
                                          value={recordFormData.grade}
                                          onChange={(e) =>
                                            setRecordFormData({ ...recordFormData, grade: e.target.value })
                                          }
                                          required
                                          min="0"
                                          max="10"
                                          step="0.01"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                      </div>

                                      <div>
                                        <label
                                          htmlFor="attendance"
                                          className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                          Asistencia (%)
                                        </label>
                                        <input
                                          type="number"
                                          id="attendance"
                                          value={recordFormData.attendance}
                                          onChange={(e) =>
                                            setRecordFormData({ ...recordFormData, attendance: e.target.value })
                                          }
                                          required
                                          min="0"
                                          max="100"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                          placeholder="85"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        type="submit"
                                        disabled={submittingRecord}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {submittingRecord ? "Guardando..." : "Guardar"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={closeRecordForm}
                                        disabled={submittingRecord}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              )}

                              {loadingRecords ? (
                                <div className="text-center py-4 text-gray-600">
                                  Cargando registros...
                                </div>
                              ) : records.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                  No hay registros para esta materia.
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                                          Período
                                        </th>
                                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                                          Nota
                                        </th>
                                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                                          Asistencia (%)
                                        </th>
                                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                                          Estado
                                        </th>
                                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                                          Acciones
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {records.map((record) => {
                                        const isValidated = record.validated_by !== null;
                                        return (
                                          <tr key={record.id} className="border-t hover:bg-gray-50">
                                            <td className="py-2 px-3 text-sm">{record.period}</td>
                                            <td className="py-2 px-3 text-sm">{record.grade.toFixed(2)}</td>
                                            <td className="py-2 px-3 text-sm">{record.attendance}%</td>
                                            <td className="py-2 px-3 text-sm">
                                              {isValidated ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                  Validado
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                  Pendiente
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2 px-3 text-sm">
                                              <div className="flex gap-2">
                                                {isValidated ? (
                                                  <span className="text-gray-400 text-xs">
                                                    Validado por consejero
                                                  </span>
                                                ) : (
                                                  <>
                                                    <button
                                                      onClick={() => openEditRecordForm(record)}
                                                      className="text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                      Editar
                                                    </button>
                                                    <button
                                                      onClick={() => handleRecordDelete(record)}
                                                      className="text-red-600 hover:text-red-800 font-medium"
                                                    >
                                                      Eliminar
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
