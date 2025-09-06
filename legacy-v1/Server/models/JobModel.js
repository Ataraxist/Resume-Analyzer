import mongoose from "mongoose";

const JobDetailSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // Job Code
    main: Object,
    tasks: Object,
    technology_skills: Object,
    hot_technology: Object,
    in_demand: Object,
    tools_used: Object,
    detailed_work_activities: Object,
    job_zone: Object,
    apprenticeship: Object,
    interests: Object,
    related_occupations: Object,
    professional_associations: Object,
  },
  { timestamps: true }
);

export default mongoose.model("JobDetail", JobDetailSchema);
