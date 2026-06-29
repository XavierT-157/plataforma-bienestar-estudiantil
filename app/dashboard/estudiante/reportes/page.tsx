"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
  Cell,
} from "recharts";

interface AcademicRecord {
  id: string;
  grade: number;
  attendance: number;
  period: string;
  recorded_at: string;
}

interface Subject {
  id: string;
  name: string;
  semester: string;
  academic_records: AcademicRecord[];
}

export default function ReportesPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
            recorded_at
          )
        `
        )
        .eq("student_id", user.id)
        .order("semester", { ascending: true });

      if (fetchError) throw fetchError;

      setSubjects((data as Subject[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  const filteredSubjects =
    selectedSemester === "all"
      ? subjects
      : subjects.filter((s) => s.semester === selectedSemester);

  const allRecords = filteredSubjects.flatMap((s) => s.academic_records || []);

  const hasData = allRecords.length > 0;

  const averageGrade = hasData
    ? allRecords.reduce((sum, r) => sum + r.grade, 0) / allRecords.length
    : 0;

  const averageAttendance = hasData
    ? allRecords.reduce((sum, r) => sum + r.attendance, 0) / allRecords.length
    : 0;

  const subjectCount = filteredSubjects.length;

  const barChartData = filteredSubjects
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
  filteredSubjects.forEach((subject) => {
    const records = subject.academic_records || [];
    records.forEach((record) => {
      if (!lineChartData[record.period]) {
        lineChartData[record.period] = { period: record.period };
      }
      lineChartData[record.period][subject.name] = record.grade;
    });
  });

  const lineChartArray = Object.values(lineChartData);

  const uniqueSemesters = Array.from(
    new Set(subjects.map((s) => s.semester))
  ).sort();

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
        <div className="text-gray-600">Cargando reportes...</div>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Reportes</h1>
        <p className="text-gray-600">Resumen de tu rendimiento académico</p>
      </div>

      {uniqueSemesters.length > 0 && (
        <div className="mb-6">
          <label
            htmlFor="semester-filter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Filtrar por semestre
          </label>
          <select
            id="semester-filter"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los semestres</option>
            {uniqueSemesters.map((semester) => (
              <option key={semester} value={semester}>
                Semestre {semester}
              </option>
            ))}
          </select>
        </div>
      )}

      {!hasData ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">
            No hay datos suficientes para generar reportes. Registra tus notas
            en Mis Materias.
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
                {subjectCount}
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
                  {filteredSubjects.map((subject, index) => (
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
  );
}
