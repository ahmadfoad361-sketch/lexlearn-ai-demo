// Server-side, normalized faculty-to-cohort binding. Never trust browser cohort identifiers.
type AdminClient=any;
function clean(value:unknown,max=160){return String(value??"").trim().slice(0,max);}
export async function facultyCohort(admin:AdminClient,universityInput:unknown,facultyInput:unknown){
  const university=clean(universityInput),faculty=clean(facultyInput);
  if(!university||!faculty)throw new Error("university_and_faculty_required");
  let found=await admin.from("academic_faculty_cohorts").select("cohort_id").eq("university",university).eq("faculty",faculty).maybeSingle();
  if(found.error)throw found.error;
  if(found.data?.cohort_id)return String(found.data.cohort_id);
  const group=await admin.from("cohorts").insert({
    name:university+" — "+faculty,
    institution:university,
    active:true
  }).select("id").single();
  if(group.error||!group.data?.id)throw group.error||new Error("create_faculty_cohort_failed");
  const created=await admin.from("academic_faculty_cohorts").insert({university,faculty,cohort_id:group.data.id}).select("cohort_id").single();
  if(created.error){
    // Concurrent faculty provisioning can create an unused cohort; never override the existing mapping.
    found=await admin.from("academic_faculty_cohorts").select("cohort_id").eq("university",university).eq("faculty",faculty).maybeSingle();
    if(found.error||!found.data?.cohort_id)throw created.error;
    return String(found.data.cohort_id);
  }
  return String(created.data.cohort_id);
}
