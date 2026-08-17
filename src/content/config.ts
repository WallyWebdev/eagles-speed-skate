import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Calendar events for the Eagles Speed Skate schedule.
// One file per event (or per recurring series). Edit/add YAML files in
// src/content/calendar/ to update the public calendar — no code changes needed.
// See UPDATE-GUIDE.md for field-by-field instructions and copy/paste templates.

const Weekday = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

const recurrenceSchema = z
  .object({
    freq: z.literal('weekly'),
    days: z.array(Weekday).min(1),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    until: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
      .optional(),
  })
  .describe('Repeating sessions. Leave empty for a one-off event.');

const calendar = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/calendar' }),
  schema: z
    .object({
      title: z.string(),
      category: z.enum([
        'training',
        'local',
        'state',
        'national',
        'international',
      ]),
      // One-off events use `start` (and optional `end` for multi-day).
      // Recurring series use `recurrence` instead. One of the two is required.
      start: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
        .optional(),
      end: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
        .optional(),
      time: z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'HH:MM, 24h')
        .optional(),
      endTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'HH:MM, 24h')
        .optional(),
      location: z.string().optional(),
      info: z.string().optional(),
      url: z.string().url().optional(),
      recurrence: recurrenceSchema.optional(),
    })
    .refine((d) => d.recurrence || d.start, {
      message: 'Provide either "start" (one-off) or "recurrence" (repeating).',
      path: ['start'],
    })
    .refine(
      (d) => !d.recurrence || !d.start,
      {
        message: 'Use either "start" or "recurrence", not both.',
        path: ['start'],
      },
    ),
});

export const collections = { calendar };
