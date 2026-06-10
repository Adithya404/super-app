export interface Sessions {
  id: string;
  sessiontoken: string;
  userid: string;
  useremail?: string;
  expires: Date;
}
