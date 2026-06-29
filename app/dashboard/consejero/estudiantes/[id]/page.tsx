"use client";

import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AcademicRecord {
  id: string;
  grade: number;
  attendance: number;
  period: string;
  recorded_at: string;
  validated_by: string | null;
  validated_at: string | null;
}

interface Subject {
  id: string;
  name: string;
  semester: number;
  academic_records: AcademicRecord[];
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [studentName, setStudentName] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"records" | "reports">("records");
  const [loading, setLoading] = useState(true);
  const [counselorId, setCounselorId] = useState("");

  useEffect(() => {
    loadData();
  }, [studentId]);

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", studentId)
      .single();

    setStudentName(profile?.full_name || "Estudiante");

    const { data: subjectsData } = await supabase
      .from("subjects")
      .select(
        `
        id,
        name,
        semester,
        academic_records (
          id,
          grade,
          attendance,
          period,
          recorded_at,
          validated_by,
          validated_at
        )
      `
      )
      .eq("student_id", studentId)
      .order("semester", { ascending: true });

    setSubjects((subjectsData as Subject[]) || []);
    setLoading(false);
  }

  async function handleValidate(recordId: string) {
    const supabase = createClient();

    const { error } = await supabase
      .from("academic_records")
      .update({
        validated_by: counselorId,
        validated_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    if (!error) {
      await loadData();
    }
  }

  function toggleSubject(subjectId: string) {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  }

  const allRecords = subjects.flatMap((s) => s.academic_records || []);
  const hasData = allRecords.length > 0;

  const averageGrade = hasData
    ? allRecords.reduce((sum, r) => sum + r.grade, 0) / allRecords.length
    : 0;

  const averageAttendance = hasData
    ? allRecords.reduce((sum, r) => sum + r.attendance, 0) / allRecords.length
    : 0;

  const barChartData = subjects
    .map((subject) => {
      const records = subject.academic_records || [];
      if (records.length === 0) return null;
      const avg = records.reduce((sum, r) => sum + r.grade, 0) / records.length;
      return {
        name: subject.name,
        promedio: parseFloat(avg.toFixed(2)),
      };
    })
    .filter((item) => item !== null);

  const lineChartData: { [period: string]: any } = {};
  subjects.forEach((subject) => {
    const records = subject.academic_records || [];
    records.forEach((record) => {
      if (!lineChartData[record.period]) {
        lineChartData[record.period] = { period: record.period };
      }
      lineChartData[record.period][subject.name] = record.grade;
    });
  });

  const lineChartArray = Object.values(lineChartData);

  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/consejero/estudiantes")}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Volver
        </button>
        <h1 className="text-3xl font-bold">{studentName}</h1>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("records")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "records"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Registros Académicos
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "reports"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Reportes
          </button>
        </div>
      </div>

      {activeTab === "records" && (
        <div className="space-y-4">
          {subjects.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Este estudiante no tiene materias registradas.
            </div>
          ) : (
            subjects.map((subject) => {
              const isExpanded = expandedSubjects.has(subject.id);
              const recordCount = subject.academic_records?.length || 0;

              return (
                <div key={subject.id} className="bg-white rounded-lg shadow">
                  <button
                    onClick={() => toggleSubject(subject.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold">{subject.name}</span>
                      <span className="text-sm text-gray-500">
                        Semestre {subject.semester}
                      </span>
                      <span className="text-sm text-gray-400">
                        {recordCount} registro{recordCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4">
                      {recordCount === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No hay registros académicos para esta materia.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2 font-semibold text-gray-700">
                                  Período
                                </th>
                                <th className="text-left py-2 px-2 font-semibold text-gray-700">
                                  Nota
                                </th>
                                <th className="text-left py-2 px-2 font-semibold text-gray-700">
                                  Asistencia (%)
                                </th>
                                <th className="text-left py-2 px-2 font-semibold text-gray-700">
                                  Estado
                                </th>
                                <th className="text-left py-2 px-2 font-semibold text-gray-700">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {subject.academic_records.map((record) => {
                                const isValidated = record.validated_by !== null;
                                const validatedByMe = record.validated_by === counselorId;

                                return (
                                  <tr key={record.id} className="border-b hover:bg-gray-50">
                                    <td className="py-2 px-2">{record.period}</td>
                                    <td className="py-2 px-2 font-medium">{record.grade}</td>
                                    <td className="py-2 px-2">{record.attendance}%</td>
                                    <td className="py-2 px-2">
                                      {isValidated ? (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                                          Validado
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                                          Pendiente
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-2">
                                      {isValidated ? (
                                        <span className="text-xs text-gray-500">
                                          {validatedByMe
                                            ? "Validado por ti"
                                            : "Validado por otro consejero"}
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handleValidate(record.id)}
                                          className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                                        >
                                          Validar
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div>
          {!hasData ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">
                No hay datos suficientes para generar reportes.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Promedio General
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {averageGrade.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Asistencia Promedio
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {averageAttendance.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Materias Registradas
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {subjects.length}
                  </div>
                </div>
              </div>

              {barChartData.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Promedio de Notas por Materia
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Bar dataKey="promedio" fill="#3B82F6" label={{ position: "top" }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {lineChartArray.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Evolución de Notas por Período
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={lineChartArray}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      {subjects.map((subject, index) => (
                        <Line
                          key={subject.id}
                          type="monotone"
                          dataKey={subject.name}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
