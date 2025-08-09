import { z } from "zod";

export const ContentPack = z.object({
  id: z.string(),
  displayName: z.string(),
  jurisdiction: z.enum(["UK", "SG", "US"]).default("UK"),
  syllabus: z.array(z.object({
    moduleId: z.string(),
    title: z.string(),
    topics: z.array(z.object({
      topicId: z.string(),
      title: z.string(),
      outcomes: z.array(z.string())
    }))
  })),
  caseSummaries: z.array(z.object({
    caseId: z.string(),
    title: z.string(),
    citation: z.string(),
    year: z.number(),
    summary: z.string(),
    keyPrinciples: z.array(z.string())
  })),
  statutes: z.array(z.object({
    statuteId: z.string(),
    title: z.string(),
    jurisdiction: z.string(),
    sections: z.array(z.object({
      section: z.string(),
      text: z.string()
    }))
  })),
  pedagogy: z.object({
    tone: z.enum(["mentor", "coach", "examiner"]).default("mentor"),
    citationStyle: z.enum(["OSCULA", "OSCOLA", "Bluebook", "MLA"]).default("OSCOLA"),
    socraticDepth: z.number().min(0).max(3).default(2)
  }),
  prompts: z.object({
    systemPersona: z.string(),
    guardrails: z.string()
  })
});

export type ContentPack = z.infer<typeof ContentPack>;
