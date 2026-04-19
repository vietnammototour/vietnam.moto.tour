import type { NextApiRequest, NextApiResponse } from 'next';

interface HelloResponse {
  name: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HelloResponse>
) {
  res.status(200).json({ name: "John Doe" });
}
