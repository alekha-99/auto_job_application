export interface Application {
  id: string;
  title?: string;
  organization?: string;
  location?: string;
  salaryRaw?: string | null;
  status?: 'Interviewing' | 'Offered' | 'Saved' | 'Applied' | 'New' | string;
  datePosted?: string;
  experienceLevel?: string;
  employmentType?: string;
  descriptionText?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyData {
  date: string;
  applications: number;
}

