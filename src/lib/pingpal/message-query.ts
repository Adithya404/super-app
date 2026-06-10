export const MESSAGE_SELECT = `
  SELECT
    m.id,
    m.room_id,
    m.sender_id,
    m.content,
    m.type,
    m.file_url,
    m.reply_to_id,
    m.is_edited,
    m.is_deleted,
    m.created_at,
    m.updated_at,
    json_build_object(
      'id', u.id,
      'name', u.name,
      'email', u.email,
      'avatar_url', u.image
    ) AS sender,
    CASE
      WHEN reply.id IS NULL THEN NULL
      ELSE json_build_object(
        'id', reply.id,
        'content', reply.content,
        'sender_id', reply.sender_id,
        'is_deleted', reply.is_deleted
      )
    END AS reply_to,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'emoji', grouped.emoji,
            'count', grouped.cnt,
            'user_ids', grouped.user_ids
          )
          ORDER BY grouped.emoji
        )
        FROM (
          SELECT
            r.emoji,
            COUNT(*)::int AS cnt,
            array_agg(r.user_id) AS user_ids
          FROM pingpal.reactions r
          WHERE r.message_id = m.id
          GROUP BY r.emoji
        ) grouped
      ),
      '[]'::json
    ) AS reactions
  FROM pingpal.messages m
  LEFT JOIN super.users u ON u.id = m.sender_id
  LEFT JOIN pingpal.messages reply ON reply.id = m.reply_to_id
`;
