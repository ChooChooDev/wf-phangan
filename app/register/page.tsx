/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import NationalityAutocomplete from "@/components/NationalityAutocomplete";
import { createClient } from "@/lib/supabase/client";
import { generateRefId, getMaxDate, normalizePassport } from "@/lib/utils";
import type { MemberFormData } from "@/types";
import type { Database } from "@/types/database";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<MemberFormData>({
    passport_number: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    nationality: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof MemberFormData, string>>
  >({});

  const currentLocale =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("NEXT_LOCALE="))
          ?.split("=")[1] || "en"
      : "en";

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MemberFormData, string>> = {};

    if (!formData.passport_number.trim()) {
      newErrors.passport_number = t("form.required");
    } else if (formData.passport_number.trim().length < 5) {
      newErrors.passport_number = t("form.invalidPassport");
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = t("form.required");
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t("form.required");
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = t("form.required");
    } else {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();

      if (
        age < 20 ||
        (age === 20 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))
      ) {
        newErrors.date_of_birth = t("form.minAge");
      }
    }

    if (!formData.nationality.trim()) {
      newErrors.nationality = t("form.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const normalizedPassport = normalizePassport(formData.passport_number);

      const { data: existing } = await supabase
        .from("member_submissions")
        .select("id")
        .eq("passport_number", normalizedPassport)
        .maybeSingle();

      if (existing) {
        setErrors({ passport_number: t("form.duplicatePassport") });
        setLoading(false);
        return;
      }

      setStep(2);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const normalizedPassport = normalizePassport(formData.passport_number);
      const refId = generateRefId(normalizedPassport);

      type MemberSubmissionInsert =
        Database["public"]["Tables"]["member_submissions"]["Insert"];

      const insertData: MemberSubmissionInsert = {
        ref_id: refId,
        passport_number: normalizedPassport,
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
        date_of_birth: formData.date_of_birth,
        nationality: formData.nationality,
        status: "confirmed",
        created_by: user.id,
      };

      const { data: submission, error: insertError } = await supabase
        .from("member_submissions")
        .insert(insertData as any)
        .select()
        .single();

      if (insertError || !submission) {
        throw new Error(insertError?.message || "Failed to create submission");
      }

      type MemberSubmissionRow =
        Database["public"]["Tables"]["member_submissions"]["Row"];
      const typedSubmission = submission as MemberSubmissionRow;

      const response = await fetch("/api/storehub/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: typedSubmission.id }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/register/success?refId=${refId}`);
      } else {
        router.push(
          `/register/error?message=${encodeURIComponent(
            result.error || "Unknown error"
          )}`
        );
      }
    } catch (err) {
      setError("Failed to submit registration. Please try again.");
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {t("registration.title")}
            </h1>
            <LanguageSwitcher currentLocale={currentLocale} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {t("registration.step1Title")}
                </h2>
                <p className="text-gray-600">
                  {t("registration.step1Description")}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("form.passportNumber")}
                  </label>
                  <input
                    type="text"
                    value={formData.passport_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        passport_number: e.target.value,
                      })
                    }
                    placeholder={t("form.passportPlaceholder")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.passport_number
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.passport_number && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.passport_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("form.firstName")}
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    placeholder={t("form.firstNamePlaceholder")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.first_name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("form.lastName")}
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    placeholder={t("form.lastNamePlaceholder")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.last_name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.last_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("form.dateOfBirth")}
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date_of_birth: e.target.value,
                      })
                    }
                    max={getMaxDate()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.date_of_birth
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.date_of_birth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("form.nationality")}
                  </label>
                  <NationalityAutocomplete
                    value={formData.nationality}
                    onChange={(value) =>
                      setFormData({ ...formData, nationality: value })
                    }
                    placeholder={t("form.nationalityPlaceholder")}
                    error={errors.nationality}
                    locale={currentLocale}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t("common.loading") : t("common.next")}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {t("registration.step2Title")}
                </h2>
                <p className="text-gray-600">
                  {t("registration.step2Description")}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium text-gray-700">
                    {t("form.passportNumber")}:
                  </span>
                  <span className="text-gray-900">
                    {formData.passport_number}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium text-gray-700">
                    {t("form.firstName")}:
                  </span>
                  <span className="text-gray-900">{formData.first_name}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium text-gray-700">
                    {t("form.lastName")}:
                  </span>
                  <span className="text-gray-900">{formData.last_name}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium text-gray-700">
                    {t("form.dateOfBirth")}:
                  </span>
                  <span className="text-gray-900">
                    {new Date(formData.date_of_birth).toLocaleDateString(
                      currentLocale === "th" ? "th-TH" : "en-GB"
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium text-gray-700">
                    {t("form.nationality")}:
                  </span>
                  <span className="text-gray-900">{formData.nationality}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {t("common.edit")}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t("registration.submitting") : t("common.confirm")}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
