export interface User {
  id: number;
  email: string;
  status?: status;
  phoneNumbers: string[];
}

export type status = "Happy" | "Sad";

export interface UserCreationRequest {
  email: string;
  phoneNumbers: string[];
}
