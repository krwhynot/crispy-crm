export interface User {
  firstName: string;
  lastName: string;
  title?: string;
}

export function formatUserName(user: User): string {
  if (!user.firstName || !user.lastName) {
    return 'Unknown User';
  }
  return user.title ? `${user.title} ${user.firstName} ${user.lastName}` : `${user.firstName} ${user.lastName}`;
}