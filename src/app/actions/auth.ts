"use server";

import { redirect } from "next/navigation";
import { linkStudentByPhone, normPhone } from "@/lib/groups";
import { z } from "zod";
import { REQUIRE_PASSWORD_CHANGE } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ROUTES, homeFor, type Role } from "@/lib/routes";

/** email: xato chiqqanda kiritilgan e-pochta formada saqlanib qolishi uchun. */
export type FormState = { error: string; email?: string } | null;

const signInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const parsed = signInSchema.safeParse({
    email,
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Please enter a valid email and password.", email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  // Tasdiqlanmagan (yoki nofaol qilingan) hisob auth darajasida bloklangan.
  if (error?.code === "user_banned") {
    return {
      error: "Your account is waiting for teacher approval (or is not active). Please contact your teacher.",
      email,
    };
  }
  if (error || !data.user) {
    // Qaysi biri xato ekani ataylab aytilmaydi.
    return { error: "Wrong email or password.", email };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, must_change_password")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Your account is not active. Please contact your teacher." };
  }

  // O'quvchi har kirganda story-qo'llanma pop-up bo'lib ochiladi (?welcome=1).
  redirect(
    REQUIRE_PASSWORD_CHANGE && profile.must_change_password
      ? ROUTES.changePassword
      : profile.role === "student"
        ? `${ROUTES.student}?welcome=1`
        : homeFor(profile.role as Role),
  );
}

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "The password must be at least 8 characters.")
      .max(72, "The password must be at most 72 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "The passwords don’t match.",
  });

export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = passwordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    if (error.code === "same_password") {
      return { error: "The new password must be different from the old one." };
    }
    if (error.code === "weak_password") {
      return { error: "This password is too simple. Choose a stronger one." };
    }
    return { error: "Couldn’t change the password. Please try again." };
  }

  const { error: markError } = await supabase.rpc("mark_password_changed");
  if (markError) {
    return {
      error: "The password changed, but saving failed. Please try again.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  redirect(profile ? homeFor(profile.role as Role) : ROUTES.login);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.login);
}

// Amalda cheksiz: o'qituvchi tasdiqlaguncha.
const PENDING_BAN = "876000h";

export type SignUpState = {
  error?: string;
  values?: { full_name: string; email: string; course_id: string; age: string; teacher_id: string; phone: string };
} | null;

const signUpSchema = z
  .object({
    full_name: z.string().trim().min(3, "Please enter your full name.").max(120, "The name is too long."),
    email: z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email.").max(254)),
    password: z.string().min(8, "The password must be at least 8 characters.").max(72, "The password must be at most 72 characters."),
    confirm: z.string(),
    course_id: z.uuid("Please choose your course."),
    age: z.coerce.number({ message: "Please enter your age." }).int("Please enter your age.").min(5, "Please enter your real age.").max(99, "Please enter your real age."),
    teacher_id: z.uuid("Please choose your group (teacher)."),
    phone: z.string().trim().refine((v) => !v || normPhone(v) !== null, "Telefon raqami noto‘g‘ri (masalan: +998 90 123 45 67)."),
  })
  .refine((v) => v.password === v.confirm, { message: "The passwords don’t match." });

/**
 * O'quvchi o'zi ro'yxatdan o'tadi: ism, e-pochta, parol va kurs.
 * Hisob o'qituvchi TASDIQLAGUNCHA nofaol (auth'da bloklangan, app_metadata.pending_approval = true).
 * Istisno: telefon raqami guruh ro'yxatida bor bo'lsa — o'qituvchi uni allaqachon biladi, hisob darhol faol.
 */
export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const values = {
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    course_id: String(formData.get("course_id") ?? ""),
    age: String(formData.get("age") ?? "").trim(),
    teacher_id: String(formData.get("teacher_id") ?? ""),
    phone: String(formData.get("phone") ?? "").trim(),
  };
  // Bot tuzog'i: odam bu yashirin maydonni to'ldirmaydi.
  if (String(formData.get("website") ?? "")) return { error: "Couldn’t create the account.", values };

  const parsed = signUpSchema.safeParse({
    ...values,
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form.", values };

  const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("id").eq("id", parsed.data.course_id).maybeSingle();
  if (!course) return { error: "Please choose your course.", values };
  const { data: teacher } = await admin.from("profiles").select("id").eq("id", parsed.data.teacher_id).eq("role", "teacher").eq("is_active", true).maybeSingle();
  if (!teacher) return { error: "Please choose your group (teacher).", values };

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
    app_metadata: { pending_approval: true },
    // Tasdiqlanmaguncha kira olmaydi (approveStudent() bandni olib tashlaydi).
    ban_duration: PENDING_BAN,
  });
  if (error || !data.user) {
    return {
      error: error?.code === "email_exists" ? "This email is already registered. Please log in." : "Couldn’t create the account. Please try again.",
      values,
    };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      course_id: parsed.data.course_id,
      teacher_id: parsed.data.teacher_id,
      age: parsed.data.age,
      must_change_password: false,
      self_registered: true,
      is_active: false,
      phone: parsed.data.phone ? normPhone(parsed.data.phone) : null,
    })
    .eq("id", data.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Couldn’t create the account. Please try again.", values };
  }

  // Telefon guruh ro‘yxatida bo‘lsa — o‘quvchi o‘z guruhiga avtomatik bog‘lanadi va darhol faollashadi.
  const linked = parsed.data.phone ? await linkStudentByPhone(data.user.id, parsed.data.phone).catch(() => 0) : 0;
  if (!linked) redirect(`${ROUTES.login}?xato=kutish`);

  const { error: approveError } = await admin.auth.admin.updateUserById(data.user.id, {
    ban_duration: "none",
    app_metadata: { pending_approval: false },
  });
  if (approveError) redirect(`${ROUTES.login}?xato=kutish`);
  await admin.from("profiles").update({ is_active: true }).eq("id", data.user.id);

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (signInError) redirect(ROUTES.login);
  redirect(`${ROUTES.student}?welcome=1`);
}
