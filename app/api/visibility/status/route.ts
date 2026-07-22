import { NextResponse } from "next/server";
import { getJob } from "@/lib/queries";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("job");
  if (!id) return NextResponse.json({ error: "missing job id" }, { status: 400 });

  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });

  if (job.status === "done") {
    return NextResponse.json({
      status: "done",
      live: job.live,
      result: job.data,
      source: job.source,
    });
  }
  if (job.status === "error") {
    return NextResponse.json({ status: "error", error: job.error });
  }
  return NextResponse.json({ status: job.status });
}
