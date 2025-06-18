export interface Position {
  id: string;
  name: string;
  department: string;
  employeeName: string;
  status: 'permanent' | 'acting';
  reportsTo: string | null; // ID of the parent position
}
