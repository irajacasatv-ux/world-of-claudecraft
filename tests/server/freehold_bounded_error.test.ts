// The bound on what a database error may carry into a housing log line, driven
// directly now that it is its own module. The store suite reaches it through a
// thrown write; this pins the shape itself, field by field.

import { describe, expect, it } from 'vitest';
import { boundedDatabaseError } from '../../server/freehold_bounded_error';

describe('boundedDatabaseError', () => {
  it('keeps the code, the constraint and the message, and drops the row the detail carries', () => {
    const pg = Object.assign(new Error('duplicate key value violates unique constraint'), {
      code: '23505',
      constraint: 'account_freeholds_plot_id',
      detail: 'Key (plot_id)=(plot:secret) already exists.',
      where: 'account 918273',
      table: 'account_freeholds',
    });
    expect(boundedDatabaseError(pg)).toEqual({
      code: '23505',
      constraint: 'account_freeholds_plot_id',
      message: 'duplicate key value violates unique constraint',
    });
  });

  it('answers undefined for a field of the wrong type rather than passing it through', () => {
    expect(boundedDatabaseError({ code: 23505, constraint: {}, message: ['row'] })).toEqual({
      code: undefined,
      constraint: undefined,
      message: undefined,
    });
  });

  it('stringifies a thrown non-object', () => {
    expect(boundedDatabaseError('connection reset')).toEqual({ message: 'connection reset' });
    expect(boundedDatabaseError(null)).toEqual({ message: 'null' });
  });
});
