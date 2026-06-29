"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SearchResult {
  id: string;
  full_name: string;
}

interface AssignedStudent {
  id: string;
  full_name: string;
  semesters: number[];
}

export default function EstudiantesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [counselorId, setCounselorId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCounselorId(user.id);
      await loadAssignedStudents(user.id);
      setLoading(false);
    }

    loadData();
  }, [router]);

  async function loadAssignedStudents(counselorId: string) {
    const supabase = createClient();

    const { data: assignments } = await supabase
      .from("counselor_students")
      .select("student_id, profiles!counselor_students_student_id_fkey(id, full_name)")
      .eq("counselor_id", counselorId);

    if (!assignments) return;

    const studentIds = assignments.map((a) => a.student_id);
    setAssignedIds(new Set(studentIds));

    const studentsWithSemesters: AssignedStudent[] = [];

    for (const assignment of assignments) {
      const profile = assignment.profiles as any;
      if (!profile) continue;

      const { data: subjects } = await supabase
        .from("subjects")
        .select("semester")
        .eq("student_id", assignment.student_id);

      const semesters = subjects
        ? Array.from(new Set(subjects.map((s) => s.semester))).sort((a, b) => a - b)
        : [];

      studentsWithSemesters.push({
        id: profile.id,
        full_name: profile.full_name,
        semesters,
      });
    }

    setAssignedStudents(studentsWithSemesters);
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const supabase = createClient();

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "estudiante")
      .ilike("full_name", `%${query}%`)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  }

  async function handleAssign(studentId: string) {
    const supabase = createClient();

    const { error } = await supabase
      .from("counselor_students")
      .insert({ counselor_id: counselorId, student_id: studentId });

    if (!error) {
      await loadAssignedStudents(counselorId);
      setSearchQuery("");
      setSearchResults([]);
    }
  }

  async function handleUnassign(studentId: string) {
    if (!confirm("¿Estás seguro de que deseas desasignar este estudiante?")) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("counselor_students")
      .delete()
      .eq("counselor_id", counselorId)
      .eq("student_id", studentId);

    if (!error) {
      await loadAssignedStudents(counselorId);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Gestión de Estudiantes</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Buscar y Asignar Estudiante</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar estudiante por nombre
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Escribe el nombre del estudiante..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {searching && (
          <div className="text-sm text-gray-500">Buscando...</div>
        )}

        {searchResults.length > 0 && (
          <div className="border border-gray-200 rounded-lg divide-y">
            {searchResults.map((student) => {
              const isAssigned = assignedIds.has(student.id);
              return (
                <div
                  key={student.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="text-gray-800">{student.full_name}</span>
                  {isAssigned ? (
                    <span className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded cursor-not-allowed">
                      Ya asignado
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAssign(student.id)}
                      className="px-4 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                      Asignar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {searchQuery && !searching && searchResults.length === 0 && (
          <div className="text-sm text-gray-500">No se encontraron estudiantes.</div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Mis Estudiantes</h2>

        {assignedStudents.length === 0 ? (
          <p className="text-gray-500">No tienes estudiantes asignados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Semestre(s)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {assignedStudents.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{student.full_name}</td>
                    <td className="py-3 px-4">
                      {student.semesters.length > 0
                        ? student.semesters.join(", ")
                        : "Sin materias"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/consejero/estudiantes/${student.id}`)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Ver detalle
                        </button>
                        <button
                          onClick={() => handleUnassign(student.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Desasignar
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
  );
}
