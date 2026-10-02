import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error('ضع SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY في بيئة التشغيل أولًا.');
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const source = JSON.parse(await readFile(resolve('private-data/school-import.json'), 'utf8'));

const syntheticEmail = (code) => `${code}@login.gheras.local`;

async function allAuthUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

async function ensureAuthUser(code, name, role, existingByEmail) {
  const email = syntheticEmail(code);
  const existing = existingByEmail.get(email);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: code,
      user_metadata: { full_name: name },
      app_metadata: { role },
    });
    if (error) throw error;
    return data.user;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: code,
    email_confirm: true,
    user_metadata: { full_name: name },
    app_metadata: { role },
  });
  if (error) throw error;
  existingByEmail.set(email, data.user);
  return data.user;
}

async function upsert(table, rows, options = {}) {
  if (!rows.length) return;
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + 500), options);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

await upsert('programs', source.programs);
await upsert('classes', source.classes.map((item) => ({
  id: item.id,
  program_id: item.program === 'دبلومة' ? 'diploma' : 'bilingual',
  name: item.name,
  stage: item.stage,
  grade: item.grade,
  section: item.section,
})));
await upsert('students', source.students.map((item) => ({
  id: item.id,
  full_name: item.name,
  national_id: item.national_id || null,
  program_id: item.program === 'دبلومة' ? 'diploma' : 'bilingual',
  class_id: item.class_id,
  account_status: item.account_status,
})));
await upsert('quran_plan_entries', source.quran_plan_entries.map((item, index) => ({
  id: item.id,
  program_id: item.program === 'دبلومة' ? 'diploma' : 'bilingual',
  stage: item.stage,
  grade: item.grade,
  week_label: item.week_label,
  day_name: item.day_name,
  assignment_type: item.assignment_type,
  assignment_text: item.assignment_text,
  source_form: item.source_form,
  sort_order: index,
})));

const existingByEmail = new Map((await allAuthUsers()).map((user) => [user.email, user]));
for (const teacher of source.teachers) {
  const user = await ensureAuthUser(teacher.access_code, teacher.name, teacher.role, existingByEmail);
  await upsert('profiles', [{
    user_id: user.id,
    full_name: teacher.name,
    role: teacher.role,
    access_code: teacher.access_code,
    setup_complete: false,
  }]);
}

for (const student of source.students.filter((item) => item.national_id)) {
  const user = await ensureAuthUser(student.national_id, student.name, 'family', existingByEmail);
  await upsert('profiles', [{
    user_id: user.id,
    full_name: student.name,
    role: 'family',
    access_code: student.national_id,
    setup_complete: true,
  }]);
  await upsert('family_students', [{ user_id: user.id, student_id: student.id }]);
}

console.log(JSON.stringify({
  status: 'ok',
  students: source.students.length,
  activeFamilyAccounts: source.students.filter((item) => item.national_id).length,
  teachers: source.teachers.length,
  classes: source.classes.length,
  quranPlanEntries: source.quran_plan_entries.length,
}));
