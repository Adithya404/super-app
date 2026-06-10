export type Reaction = {
  emoji: string;
  count: number;
  user_ids: string[];
};

export type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  file_url: string | null;
  reply_to_id: string | null;
  reply_to?: {
    id: string;
    content: string;
    sender_id: string;
    is_deleted: boolean;
  } | null;
  reactions?: Reaction[];
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};
