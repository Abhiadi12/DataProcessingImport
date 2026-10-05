// Dates arrive as ISO strings. description is null until one is set.
export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// The create/edit form. description is "" when left blank.
export interface ProjectFormValues {
  name: string;
  description: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectVariables {
  id: string;
  input: ProjectFormValues;
}
